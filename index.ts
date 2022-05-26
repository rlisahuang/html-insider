import CDP from "chrome-remote-interface";
import * as chromeLauncher from "chrome-launcher";
import { stdout, stderr, argv } from "process";

type LaunchedChrome = chromeLauncher.LaunchedChrome;

const events: string[] = argv[2] ? JSON.parse(argv[2]).events : ["click"]; // TODO: list
const target_selectors: string[] = argv[3] ? JSON.parse(argv[3]).targets : ["button#btn1"]; // TODO: LIST
const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/toy/test.html";
const height = argv[5] ?? undefined;
const width = argv[6] ?? undefined;

// const srcJS = "file:///Users/lisa/projects/LiveWeb/tasks/toy/script.js";
// const program = `document.querySelector('${target_selector}');`;

// Optional: set logging level of launcher to see its output.
// Install it using: npm i --save lighthouse-logger
// const log = require('lighthouse-logger');
// log.setLevel('info');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<LaunchedChrome>}
 */
function launchChrome(headless: boolean | undefined = true): Promise<LaunchedChrome> {
    // headless = false;
    const windowSize = (height && width) ? `--window-size=${height},${width}` : "--start-fullscreen";

    return chromeLauncher.launch({
        port: 9224, // Uncomment to force a specific port of your choice.
        chromeFlags: [
            windowSize,
            "--disable-gpu",
            headless ? "--headless" : "",
        ],
    });
}

async function main() {
    const chrome = await launchChrome();
    const protocol = await CDP({ port: chrome.port, local: true }); // client type


    // Extract the DevTools protocol domains we need and enable them.
    // See API docs: https://chromedevtools.github.io/devtools-protocol/
    const { Page, Runtime, Debugger, DOM, DOMDebugger } = protocol;
    await Promise.all([Page.enable(), Runtime.enable()]);


    Page.navigate({ url: viewFile });
    Debugger.enable({});
    DOM.enable();

    const scripts: Map<string, string> = new Map<string, string>();

    Debugger.on('scriptParsed', (e) => {
        if (''.localeCompare(e.url) !== 0) {

            if (scripts.has(e.scriptId) && scripts.get(e.scriptId).localeCompare(e.url) !== 0) {
                throw new Error('scriptId and url mismatch');
            }

            // filter out non-local non-js files
            // file://[any_char]+.js
            // TODO: does it work for webapps running on localhost?
            const regex_macos = new RegExp(/file:\/\/\S+\.js/g)
            if (!scripts.has(e.scriptId) && e.url.match(regex_macos)) {
                scripts.set(e.scriptId, e.url);
            }

        }
    });


    // Wait for window.onload before doing stuff.
    Page.on('loadEventFired', async () => {


        let htmls: Array<{ [key: string]: any }> = [];
        let newHTMLs: Array<{ [key: string]: any }> = [];
        let pngs: Array<HTMLImageElement> = [];

        let last: string = "";
        Debugger.on('paused', async (e) => {
            // console.log('hi');

            /**
             * - obtain stack traces from scripts in `scripts` and their lineno
             * - obtain html
             * - if html different from the last one recorded:
             *  - for all script/lineno pairs, record html to `htmls` in the following format:
             *    {
             *      "script": scripts.get(scriptId),
             *      "lineno": lineno,
             *      "html": html
             *     }
             * - set `last` to current
             *  
             */
            const body = (await Runtime.evaluate({ expression: "document.body" })).result
            const bodyID = body.objectId;

            const html = (await DOM.getOuterHTML({ objectId: bodyID })).outerHTML;
            const screenshot = (await Page.captureScreenshot({ format: 'png' })).data;
            const scriptsInvolved: Array<{ [key: string]: any }> = [];
            e.callFrames.forEach(frame => {
                if (scripts.has(frame.location.scriptId)) {
                    scriptsInvolved.push({
                        script: scripts.get(frame.location.scriptId),
                        lineno: frame.location.lineNumber,
                    });
                }
            });

            // TODO: record the event and target info as well
            // also record whether the original target still exists in the page (by looking at the runtime objectId of the target based on query)
            if (scriptsInvolved.length > 0) {
                if (last.localeCompare(html) !== 0) {
                    scriptsInvolved.forEach(script => {
                        newHTMLs = [
                            ...newHTMLs,
                            {
                                ...script,
                                html: html,
                                screenshot: screenshot,
                            }
                        ];
                    });
                    // const img = new Image();
                    // img.src = await toPng(html);
                }

                last = html;
            }

            await Debugger.stepInto({}); // this line works
            // TODO: if Debugger paused in HTML, then step into, otherwise step over, and if Debugger ends in HTML, then resume
        });


        if (events.length !== target_selectors.length) {
            throw new Error('events and target_selectors must have the same length');
        }

        for (let i = 0; i < events.length; i++) {

            await DOMDebugger.setEventListenerBreakpoint({ eventName: events[i] });

            await Runtime.evaluate({
                expression: `document.querySelector('${target_selectors[i]}').dispatchEvent(new MouseEvent('${events[i]}'));`
            });
            newHTMLs.forEach(html => {
                if (!html.event) {
                    html.event = events[i];
                }
                if (!html.target) {
                    html.target = target_selectors[i];
                }
            });
            htmls = [...htmls, ...newHTMLs];

            newHTMLs = []; // reset new htmls

        }


        // TODO: the argument of `dispatchEvent depends on event name/type




        // setTimeout(async () => {
        // const json = JSON.stringify({result: htmls});
        // console.log(JSON.parse(json));
        stdout.write(JSON.stringify({ result: htmls }));
        // stdout.write('hi');

        await protocol.close();
        await chrome.kill(); // Kill Chrome.
        // }, 10000);
    });
}

// entry point
(async function () {
    try {
        await main();
    } catch (e) {
        stderr.write(e.message);
    }
})();
