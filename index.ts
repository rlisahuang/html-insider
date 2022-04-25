import CDP from "chrome-remote-interface";
import * as chromeLauncher from "chrome-launcher";

type LaunchedChrome = chromeLauncher.LaunchedChrome;

const dest = "file:///Users/lisa/projects/LiveWeb/tasks/toy/test.html";
const srcJS = "file:///Users/lisa/projects/LiveWeb/tasks/toy/script.js";
const program = `
    document.querySelector('button#btn1');
    // btn.click();
    // document.body.innerHTML;
    // getEventListeners(btn);
`;

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
    return chromeLauncher.launch({
        port: 9224, // Uncomment to force a specific port of your choice.
        chromeFlags: [
            //   "--window-size=412,732",
            "--start-fullscreen",
            "--disable-gpu",
            headless ? "--headless" : "",
        ],
    });
}

async function main() {
    const chrome = await launchChrome();
    const protocol = await CDP({ port: chrome.port, local:true }); // client type


    // Extract the DevTools protocol domains we need and enable them.
    // See API docs: https://chromedevtools.github.io/devtools-protocol/
    const { Page, Runtime, Debugger, DOM, DOMDebugger } = protocol;
    await Promise.all([Page.enable(), Runtime.enable()]);

    Page.navigate({ url: dest });
    Debugger.enable({});
    DOM.enable();


    // Wait for window.onload before doing stuff.
    Page.on('loadEventFired', async () => {
        // chromeDebugger.
        const js = program;

        const bodyID = (await Runtime.evaluate({ expression: "document.body"})).result.objectId;

        const btnID = (await Runtime.evaluate({ expression: "document.querySelector('button#btn1')" })).result.objectId;

        const listeners = (await DOMDebugger.getEventListeners({ objectId: btnID })).listeners;
        // const scriptIDs = listeners.map(listener => listener.scriptId);

        // const scriptSrcs = await Promise.all(
        //     scriptIDs.map(async (id) => (await Debugger.getScriptSource({ scriptId: id })).scriptSource)
        //     );

        // console.log(listeners);
        listeners.forEach(listener => {
            Debugger.setBreakpoint({location: {scriptId: listener.scriptId, lineNumber: listener.lineNumber, columnNumber: listener.columnNumber}});    
        });
        
        // TODO: figure out how to set and pause and remove breakpoints


        let htmls: string[] = [];
        // await DOMDebugger.setEventListenerBreakpoint({ eventName: 'click' });
        let entered = false;
        Debugger.on('paused', async (e) => {
            console.log('stopped');
            console.log(e.callFrames);
            const html = (await DOM.getOuterHTML({objectId: bodyID})).outerHTML;
            // if (htmls.length > 0 && html != htmls[htmls.length-1])
                htmls.push(html);
            // if (!entered) {
            //     console.log('stepped into');
            //     await Debugger.stepInto({});
            // }
            await Debugger.stepInto({}); // this line works
            // await Debugger.pause();
            // TODO: if Debugger paused in HTML, then step into, otherwise step over, and if Debugger ends in HTML, then resume
        });

        


        await Runtime.evaluate({
            expression: `const btn =document.querySelector('button#btn1'); 
           btn.dispatchEvent(new MouseEvent('click'));` });



        console.log(htmls);

        // console.log(result);
        // console.log("Title of page: " + result.result.value);

        // setTimeout(async () => {
            await protocol.close();
            await chrome.kill(); // Kill Chrome.
        // }, 60000);
    });
}

// entry point
(async function () {
    await main();
})();
