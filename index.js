const CDP = require("chrome-remote-interface");
const chromeLauncher = require("chrome-launcher");
const dest = "file:///Users/lisa/projects/LiveWeb/tasks/toy/test.html";

// Optional: set logging level of launcher to see its output.
// Install it using: npm i --save lighthouse-logger
// const log = require('lighthouse-logger');
// log.setLevel('info');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless = true) {
  headless = false;
  return chromeLauncher.launch({
    port: 9224, // Uncomment to force a specific port of your choice.
	local: true,
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
  const protocol = await CDP({ port: chrome.port });

  // Extract the DevTools protocol domains we need and enable them.
  // See API docs: https://chromedevtools.github.io/devtools-protocol/
  const { Page, Runtime } = protocol;
  await Promise.all([Page.enable(), Runtime.enable()]);

  Page.navigate({ url: dest });

  // Wait for window.onload before doing stuff.
  Page.loadEventFired(async () => {
    const js = "document.querySelector('button#btn1').innerHTML";
    // Evaluate the JS expression in the page.
    const result = await Runtime.evaluate({ expression: js });

    console.log(result);
    // console.log("Title of page: " + result.result.value);

    protocol.close();
    chrome.kill(); // Kill Chrome.
  });
}

// entry point
(async function () {
  await main();
})();
