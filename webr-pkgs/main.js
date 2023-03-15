/**
 * Main app module
 * 
 * @module main
 */

import { format } from "https://cdn.skypack.dev/d3-format@3";
import * as HelpR from './modules/webr-helpers.js'; // WebR-specific helpers
import * as App from './modules/webr-app.js'; // our app's functions

console.time('Execution Time'); // keeps on tickin'

import { WebR } from '/webr/webr.mjs'; // service workers == full path starting with /

globalThis.webR = new WebR({
	WEBR_URL: "/webr/",
	SW_URL: "/w/webr-pkgs/"
}); 

console.log("Initializing WebR")
await globalThis.webR.init(); 
console.log("WebR Initialized")


// WebR is ready to use. So, brag about it!

const timerEnd = performance.now();

await HelpR.sourceRScript(globalThis.webR, "https://rud.is/w/webr-pkgs/r/support.r")

document.getElementById('loading').innerText = `WebR Loaded!`;

App.packagesToGrid(globalThis.webR, "tbl");