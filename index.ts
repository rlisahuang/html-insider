import CDP, { Protocol } from "chrome-remote-interface";
import * as chromeLauncher from "chrome-launcher";
import { stdout, stderr, argv } from "process";

type LaunchedChrome = chromeLauncher.LaunchedChrome;

const events: string[] = argv[2] ? JSON.parse(argv[2]).events : ["click"]; // TODO: list
const target_selectors: string[] = argv[3] ? JSON.parse(argv[3]).targets : ["BUTTON:nth-child(3)"]; // TODO: LIST
const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/toy/test.html";
const height = argv[5] ?? undefined;
const width = argv[6] ?? undefined;

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
    // const windowSize = (height && width) ? `--window-size=${height},${width}` : "--start-fullscreen";
    const windowSize = (height && width) ? `--window-size=${height},${width}` : "--window-size=600,400";

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
        let watchedEvents = new Set();

        let last: string = "";
        let currTarget: string | undefined;
        let currTargetId: number | undefined;
        
        const bodyID = (await Runtime.evaluate({ expression: "document.body" })).result.objectId;
        Debugger.on('paused', async (e) => {

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

            const html = (await DOM.getOuterHTML({ objectId: bodyID })).outerHTML;
            const screenshot = (await Page.captureScreenshot({ format: 'png' })).data;
            const newTargetId = (await DOM.querySelector({
                nodeId: docId,
                selector: currTarget!,
            })).nodeId;

            const scriptsInvolved: Array<{ [key: string]: any }> = []; // local scripts
            e.callFrames.forEach(frame => {
                if (scripts.has(frame.location.scriptId)) {
                    scriptsInvolved.push({
                        script: scripts.get(frame.location.scriptId),
                        lineno: frame.location.lineNumber,
                    });
                }
            });


            if (scriptsInvolved.length > 0) {
                if (last.localeCompare(html) !== 0) {
                    scriptsInvolved.forEach(script => {
                        newHTMLs = [
                            ...newHTMLs,
                            {
                                ...script,
                                html: html,
                                targetExists: currTargetId === newTargetId,
                                screenshot: screenshot,
                            }
                        ];
                    });
                }

                last = html;
            }

            await Debugger.stepInto({});
            // TODO: if Debugger paused in HTML, then step into, otherwise step over, and if Debugger ends in HTML, then resume
        });


        if (events.length !== target_selectors.length) {
            throw new Error('events and target_selectors must have the same length');
        }


        let docId = (await DOM.getDocument({})).root.nodeId;

        for (let i = 0; i < events.length; i++) {

            if (!watchedEvents.has(events[i])) {
                await DOMDebugger.setEventListenerBreakpoint({ eventName: events[i] });
                watchedEvents.add(events[i]);
            }

            currTarget = target_selectors[i];

            currTargetId = (await DOM.querySelector({
                nodeId: docId,
                selector: currTarget,
            })).nodeId;

            // add current target and event info to the last recorded data
            if (i !== 0) {
                htmls[htmls.length-1].nextEvent = events[i];
                htmls[htmls.length-1].nextTarget = target_selectors[i];
                htmls[htmls.length-1].nextTargetExists = true;
            }


            // TODO: the argument of `dispatchEvent depends on event name/type
            await Runtime.evaluate({
                expression: `document.querySelector('${target_selectors[i]}').dispatchEvent(new MouseEvent('${events[i]}'));`
            });

            for (const html of newHTMLs) {
                if (!html.event) {
                    html.event = events[i];
                }
                if (!html.target) {
                    html.target = target_selectors[i];
                }
            }

            htmls = [...htmls, ...newHTMLs];
            // console.log(`******${events[i]}, ${target_selectors[i]}******`)
            // console.log(htmls);

            newHTMLs = []; // reset new htmls

        }


        // setTimeout(async () => {
        stdout.write(JSON.stringify({ result: htmls }));

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
