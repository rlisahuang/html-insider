import CDP from "chrome-remote-interface";
import * as chromeLauncher from "chrome-launcher";
import { stdout, stderr, argv } from "process";

type LaunchedChrome = chromeLauncher.LaunchedChrome;

const events: string[] = argv[2] ? JSON.parse(argv[2]).events : ["click"];
// const target_selectors: string[] = argv[3] ? JSON.parse(argv[3]).targets : ["BODY > TABLE:nth-child(2) > TBODY:nth-child(2) > TR:nth-child(2) > TD:nth-child(3) > DIV:nth-child(1) > DIV:nth-child(1)"]; // second row, second col
const target_selectors: string[] = argv[3] ? JSON.parse(argv[3]).targets : ["BODY > DIV:nth-child(2) > DIV:nth-child(1) > IMG:nth-child(1)"];

const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/memory-game/index.html";
// const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/table-editing/index.html";
// const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/demo/test.html";

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
    const windowSize = (height && width) ? `--window-size=${width},${height}` : "--window-size=600,400";

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
    const { Page, Network, Runtime, Debugger, DOM, DOMDebugger } = protocol;
    await Promise.all([Page.enable(), Runtime.enable(), Network.enable({})]);

    Page.navigate({ url: viewFile });
    Debugger.enable({});
    DOM.enable();

    const scripts: Map<string, string> = new Map<string, string>();

    Runtime.on('exceptionThrown', (e) => {
        // throw the error to stderr
        const msg = e.exceptionDetails.exception.description;
        const line = e.exceptionDetails.lineNumber + 1;
        const col = e.exceptionDetails.columnNumber + 1;
        stderr.write(`[line ${line}, col${col}]: \n${msg}`);
    });

    Debugger.on('scriptParsed', (e) => {

        if ('' !== e.url) {

            if (scripts.has(e.scriptId) && scripts.get(e.scriptId) !== e.url) {
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

        let watchedEvents = new Set();
        const bodyID = (await Runtime.evaluate({ expression: "document.body" })).result.objectId;
        const html: string = (await DOM.getOuterHTML({ objectId: bodyID })).outerHTML;
        const screenshot = (await Page.captureScreenshot({ format: 'png' })).data;
        let last = screenshot;

        let lastCallStack: Array<{ [key: string]: any }> = []; // local scripts only
        let htmls: Array<{ [key: string]: any }> = [{ start: true, html: html, events: [], screenshot: screenshot }];
        let newHTMLs: Array<{ [key: string]: any }> = [];

        let lastEvent: string | undefined;
        let lastTarget: string | undefined;
        let lastTargetId: number | undefined;
        let lastIdx: number | undefined;

        Debugger.on('paused', async (e) => {
            const html = (await DOM.getOuterHTML({ objectId: bodyID })).outerHTML;
            const screenshot = (await Page.captureScreenshot({ format: 'png' })).data;
            const newTargetId = (await DOM.querySelector({
                nodeId: docId,
                selector: lastTarget!,
            })).nodeId;

            if (lastCallStack.length > 0) {
                if (last !== screenshot) {
                    newHTMLs = [
                        ...newHTMLs,
                        {
                            html: html,
                            events: [
                                {
                                    idx: lastIdx!,
                                    name: lastEvent!,
                                    target: lastTarget!,
                                    targetExists: lastTargetId === newTargetId
                                },
                            ],
                            locations: lastCallStack,
                            screenshot: screenshot,
                        }
                    ];
                }
            }

            last = screenshot;

            const currCallStack: Array<{ [key: string]: any }> = []; // local scripts
            for (let i = 0; i < e.callFrames.length; i++) {
                const frame = e.callFrames[i];
                if (scripts.has(frame.location.scriptId)) {
                    currCallStack.push({
                        script: scripts.get(frame.location.scriptId),
                        lineno: frame.location.lineNumber + 1, // convert 0-index to 1-index
                    });
                }
            }
            lastCallStack = currCallStack;

            // console.log(html);

            await Debugger.stepInto({});
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

            lastIdx = i;
            // TODO: the following can be refactored
            lastEvent = events[i];
            lastTarget = target_selectors[i];

            lastTargetId = (await DOM.querySelector({
                nodeId: docId,
                selector: lastTarget,
            })).nodeId;

            // TODO: the argument of `dispatchEvent depends on event name/type
            // BUG: we might end up having to use `click` only as dispatchEvent(click) sometimes fails
            // if (events[i] === 'click') {
                // bug: the following method (through jQuery I guess) enters into an infinite loop
                // for the 'demo' example
            //     await Runtime.evaluate({
            //         expression: `document.querySelector('${target_selectors[i]}').click();`
            //     });
            // } else {
            //     await Runtime.evaluate({
            //         expression: `document.querySelector('${target_selectors[i]}').dispatchEvent(new MouseEvent('${events[i]}'));`
            //     });
            // }


            // BUG: for non-clickable examples (e.g. table-editing), the following call does not get executed
            // on non-button elements for some reason. 
            const mockEvent = `new MouseEvent('${events[i]}', {
                bubbles: true,
                cancelable: true,
                view: window
              })`;
            await Runtime.evaluate({
                expression: `document.querySelector('${target_selectors[i]}').dispatchEvent(${mockEvent});`
            });

            if (i === 0) { // record the first event info to the start HTMl record
                if (!htmls[0].start) {
                    throw new Error('first record is not start'); // assertion check
                }

                htmls[0].events.push(
                    {
                        idx: i,
                        name: events[i],
                        target: target_selectors[i],
                        targetExists: true,
                    }
                )
            } else {
                htmls[htmls.length - 1].events.push({
                    idx: i,
                    name: events[i],
                    target: target_selectors[i],
                    targetExists: true,
                })
            }

            htmls = [...htmls, ...newHTMLs];

            newHTMLs = []; // reset new htmls

        }


        // setTimeout(async () => {
            // there will be both std and stderr if there are runtime errors with the given script,
            // so we need to process the error first in the front end
            stdout.write(JSON.stringify({ result: htmls }));
            // stdout.write(String(htmls.length));

            await protocol.close();
            await chrome.kill(); // Kill Chrome.
        // }, 1000000);
    });
}

// entry point
(async function () {
    try {
        await main();
    } catch (e) {
        // why is error from main not picked up here?
        stderr.write(e.message);
    }
})();
