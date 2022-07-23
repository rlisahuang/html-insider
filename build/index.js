"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
exports.__esModule = true;
var chrome_remote_interface_1 = __importDefault(require("chrome-remote-interface"));
var chromeLauncher = __importStar(require("chrome-launcher"));
var process_1 = require("process");
var events = process_1.argv[2] ? JSON.parse(process_1.argv[2]).events : ["click"];
// const target_selectors: string[] = argv[3] ? JSON.parse(argv[3]).targets : ["BODY > TABLE:nth-child(2) > TBODY:nth-child(2) > TR:nth-child(2) > TD:nth-child(3) > DIV:nth-child(1) > DIV:nth-child(1)"]; // second row, second col
var target_selectors = process_1.argv[3] ? JSON.parse(process_1.argv[3]).targets : ["BODY > DIV:nth-child(2) > DIV:nth-child(1) > IMG:nth-child(1)"];
var viewFile = (_a = process_1.argv[4]) !== null && _a !== void 0 ? _a : "file:///Users/lisa/projects/LiveWeb/tasks/memory-game/index.html";
// const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/table-editing/index.html";
// const viewFile = argv[4] ?? "file:///Users/lisa/projects/LiveWeb/tasks/demo/test.html";
var height = (_b = process_1.argv[5]) !== null && _b !== void 0 ? _b : undefined;
var width = (_c = process_1.argv[6]) !== null && _c !== void 0 ? _c : undefined;
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
function launchChrome(headless) {
    if (headless === void 0) { headless = true; }
    // headless = false;
    // const windowSize = (height && width) ? `--window-size=${height},${width}` : "--start-fullscreen";
    var windowSize = (height && width) ? "--window-size=".concat(width, ",").concat(height) : "--window-size=600,400";
    return chromeLauncher.launch({
        port: 9224,
        chromeFlags: [
            windowSize,
            "--disable-gpu",
            headless ? "--headless" : "",
        ]
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var chrome, protocol, Page, Network, Runtime, Debugger, DOM, DOMDebugger, scripts;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, launchChrome()];
                case 1:
                    chrome = _a.sent();
                    return [4 /*yield*/, (0, chrome_remote_interface_1["default"])({ port: chrome.port, local: true })];
                case 2:
                    protocol = _a.sent();
                    Page = protocol.Page, Network = protocol.Network, Runtime = protocol.Runtime, Debugger = protocol.Debugger, DOM = protocol.DOM, DOMDebugger = protocol.DOMDebugger;
                    return [4 /*yield*/, Promise.all([Page.enable(), Runtime.enable(), Network.enable({})])];
                case 3:
                    _a.sent();
                    Page.navigate({ url: viewFile });
                    Debugger.enable({});
                    DOM.enable();
                    scripts = new Map();
                    Debugger.on('scriptParsed', function (e) {
                        if ('' !== e.url) {
                            if (scripts.has(e.scriptId) && scripts.get(e.scriptId) !== e.url) {
                                throw new Error('scriptId and url mismatch');
                            }
                            // filter out non-local non-js files
                            // file://[any_char]+.js
                            // TODO: does it work for webapps running on localhost?
                            var regex_macos = new RegExp(/file:\/\/\S+\.js/g);
                            if (!scripts.has(e.scriptId) && e.url.match(regex_macos)) {
                                scripts.set(e.scriptId, e.url);
                            }
                        }
                    });
                    // Wait for window.onload before doing stuff.
                    Page.on('loadEventFired', function () { return __awaiter(_this, void 0, void 0, function () {
                        var watchedEvents, bodyID, html, screenshot, last, lastCallStack, htmls, newHTMLs, lastEvent, lastTarget, lastTargetId, lastIdx, docId, i, mockEvent;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    watchedEvents = new Set();
                                    return [4 /*yield*/, Runtime.evaluate({ expression: "document.body" })];
                                case 1:
                                    bodyID = (_a.sent()).result.objectId;
                                    return [4 /*yield*/, DOM.getOuterHTML({ objectId: bodyID })];
                                case 2:
                                    html = (_a.sent()).outerHTML;
                                    return [4 /*yield*/, Page.captureScreenshot({ format: 'png' })];
                                case 3:
                                    screenshot = (_a.sent()).data;
                                    last = screenshot;
                                    lastCallStack = [];
                                    htmls = [{ start: true, html: html, events: [], screenshot: screenshot }];
                                    newHTMLs = [];
                                    Debugger.on('paused', function (e) { return __awaiter(_this, void 0, void 0, function () {
                                        var html, screenshot, newTargetId, currCallStack, i, frame;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, DOM.getOuterHTML({ objectId: bodyID })];
                                                case 1:
                                                    html = (_a.sent()).outerHTML;
                                                    return [4 /*yield*/, Page.captureScreenshot({ format: 'png' })];
                                                case 2:
                                                    screenshot = (_a.sent()).data;
                                                    return [4 /*yield*/, DOM.querySelector({
                                                            nodeId: docId,
                                                            selector: lastTarget
                                                        })];
                                                case 3:
                                                    newTargetId = (_a.sent()).nodeId;
                                                    if (lastCallStack.length > 0) {
                                                        if (last !== screenshot) {
                                                            newHTMLs = __spreadArray(__spreadArray([], newHTMLs, true), [
                                                                {
                                                                    html: html,
                                                                    events: [
                                                                        {
                                                                            idx: lastIdx,
                                                                            name: lastEvent,
                                                                            target: lastTarget,
                                                                            targetExists: lastTargetId === newTargetId
                                                                        },
                                                                    ],
                                                                    locations: lastCallStack,
                                                                    screenshot: screenshot
                                                                }
                                                            ], false);
                                                        }
                                                    }
                                                    last = screenshot;
                                                    currCallStack = [];
                                                    for (i = 0; i < e.callFrames.length; i++) {
                                                        frame = e.callFrames[i];
                                                        if (scripts.has(frame.location.scriptId)) {
                                                            currCallStack.push({
                                                                script: scripts.get(frame.location.scriptId),
                                                                lineno: frame.location.lineNumber + 1
                                                            });
                                                        }
                                                    }
                                                    lastCallStack = currCallStack;
                                                    // console.log(html);
                                                    return [4 /*yield*/, Debugger.stepInto({})];
                                                case 4:
                                                    // console.log(html);
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    if (events.length !== target_selectors.length) {
                                        throw new Error('events and target_selectors must have the same length');
                                    }
                                    return [4 /*yield*/, DOM.getDocument({})];
                                case 4:
                                    docId = (_a.sent()).root.nodeId;
                                    i = 0;
                                    _a.label = 5;
                                case 5:
                                    if (!(i < events.length)) return [3 /*break*/, 11];
                                    if (!!watchedEvents.has(events[i])) return [3 /*break*/, 7];
                                    return [4 /*yield*/, DOMDebugger.setEventListenerBreakpoint({ eventName: events[i] })];
                                case 6:
                                    _a.sent();
                                    watchedEvents.add(events[i]);
                                    _a.label = 7;
                                case 7:
                                    lastIdx = i;
                                    // TODO: the following can be refactored
                                    lastEvent = events[i];
                                    lastTarget = target_selectors[i];
                                    return [4 /*yield*/, DOM.querySelector({
                                            nodeId: docId,
                                            selector: lastTarget
                                        })];
                                case 8:
                                    lastTargetId = (_a.sent()).nodeId;
                                    mockEvent = "new MouseEvent('".concat(events[i], "', {\n                bubbles: true,\n                cancelable: true,\n                view: window\n              })");
                                    return [4 /*yield*/, Runtime.evaluate({
                                            expression: "document.querySelector('".concat(target_selectors[i], "').dispatchEvent(").concat(mockEvent, ");")
                                        })];
                                case 9:
                                    _a.sent();
                                    if (i === 0) { // record the first event info to the start HTMl record
                                        if (!htmls[0].start) {
                                            throw new Error('first record is not start'); // assertion check
                                        }
                                        htmls[0].events.push({
                                            idx: i,
                                            name: events[i],
                                            target: target_selectors[i],
                                            targetExists: true
                                        });
                                    }
                                    else {
                                        htmls[htmls.length - 1].events.push({
                                            idx: i,
                                            name: events[i],
                                            target: target_selectors[i],
                                            targetExists: true
                                        });
                                    }
                                    htmls = __spreadArray(__spreadArray([], htmls, true), newHTMLs, true);
                                    newHTMLs = []; // reset new htmls
                                    _a.label = 10;
                                case 10:
                                    i++;
                                    return [3 /*break*/, 5];
                                case 11:
                                    // setTimeout(async () => {
                                    process_1.stdout.write(JSON.stringify({ result: htmls }));
                                    // stdout.write(String(htmls.length));
                                    return [4 /*yield*/, protocol.close()];
                                case 12:
                                    // stdout.write(String(htmls.length));
                                    _a.sent();
                                    return [4 /*yield*/, chrome.kill()];
                                case 13:
                                    _a.sent(); // Kill Chrome.
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
// entry point
(function () {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, main()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    process_1.stderr.write(e_1.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
})();
