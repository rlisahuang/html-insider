import CDP from "chrome-remote-interface";
import * as chromeLauncher from "chrome-launcher";

type LaunchedChrome = chromeLauncher.LaunchedChrome;

const dest = "file:///Users/lisa/projects/LiveWeb/tasks/toy/test.html";
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
  headless = false;
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
  const protocol = await CDP({ port: chrome.port }); // client type


  // Extract the DevTools protocol domains we need and enable them.
  // See API docs: https://chromedevtools.github.io/devtools-protocol/
  const { Page, Runtime, Debugger, DOMDebugger } = protocol;
  await Promise.all([Page.enable(), Runtime.enable()]);

  Page.navigate({ url: dest });


  // Wait for window.onload before doing stuff.
  Page.on('loadEventFired', async () => {
    // chromeDebugger.
    const js = program;
    
    const result = await Runtime.evaluate({ expression: "document.querySelector('button#btn1')" });
    const btnID = result.result.objectId;

    const listeners = (await DOMDebugger.getEventListeners({ objectId: btnID })).listeners;

    console.log(listeners);
    // TODO: figure out how to set and pause and remove breakpoints
    
    await DOMDebugger.setEventListenerBreakpoint({ eventName: 'click' });
    // Debugger.on('paused', () => {
    //     console.log('stopped');
    //     Debugger.resume({});
    // });

    await Runtime.evaluate({ expression: "document.querySelector('button#btn1').click()" });



    // console.log(result);
    // console.log("Title of page: " + result.result.value);

    setTimeout(() => {
    protocol.close();
    chrome.kill(); // Kill Chrome.
    }, 60000);
  });
}

// entry point
(async function () {
  await main();
})();
