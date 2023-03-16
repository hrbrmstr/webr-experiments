/**
 * Main app module
 * 
 * @module main
 */

// is our header working?
console.log(`are we cross-origin isolates? ${crossOriginIsolated}`);

console.time('Execution Time'); // keeps on tickin'

import { WebR } from '/webr/webr.mjs';

globalThis.webR = new WebR({
	WEBR_URL: "/webr/",
	SW_URL: "/w/ggwebr/", // keep your friend close and your service workers closer
});

console.log("Initializing WebR…")
await globalThis.webR.init();
console.log("WebR Initialized!")

console.timeEnd('Execution Time');

document.getElementById('loading').innerText = `WebR Loaded!`;

// ===== NOW WE CAN START WORK ===== //

globalThis.webRCodeShelter = await new globalThis.webR.Shelter();

const webR = globalThis.webR; // rly got sick of typing `globalThis`

// yeah, totally not using ggplot2 
//
// document.getElementById('packages').innerText = `Installing packages…`;
// console.log("Installing packages…")
//await webR.installPackages([ 'ggplot2' ])
// console.log("Packages installed!")
//document.getElementById('packages').innerText = `Packages installed!`;

/**
 * Wrapper function to make it easier to plot stuff to a `<canvas>`
 * 
 * @param {WebR::WebR} webR context
 * @param {string} plot_code R code to execute to generate a plot
 * @param {number} width plot width
 * @param {number} height plot height
 * @param {string} id `<canvas>` id to use  
 */
async function plottR(webR, plot_code = "plot(mtcars, col='blue')", width = 400, height = 400, id = "base-canvas") {
	
	// we need to actually setup a short-lifetime separate store for the plot output object.
	const webRCodeShelter = await new webR.Shelter();

	// setup an R canvas() graphics device
	await webR.evalRVoid(`canvas(width=${width}, height=${height})`);

	// Evaluate the plot code in our shelter
	// LOOK AT THESE FANCY PARAMETERS!
	// https://docs.r-wasm.org/webr/latest/evaluating.html#evaluating-r-code-and-capturing-output-with-capturer
	// https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebRChan.EvalROptions.html
	const result = await webRCodeShelter.captureR(`${plot_code}`, {
		withAutoprint: true,
		captureStreams: true,
		captureConditions: false,
		env: webR.objs.emptyEnv,
	});

	// we be done
	await webR.evalRVoid("dev.off()");

	// 🚽
	// this generates SO MUCH STUFF
	// I'll be explaining this over the wekeend.
	const msgs = await webR.flush();

	// the `<canvas>` in our HTML DOM
	const canvas = document.getElementById(id)
	canvas.setAttribute("width", 2 * width); // i still need to read why this is 2x
	canvas.setAttribute("height", 2 * height);

	// SO CRAZY
	// We literally shove all the drawing commands using this
	msgs.forEach(msg => {
		if (msg.type === "canvasExec") Function(`this.getContext("2d").${msg.data}`).bind(canvas)()
	});

}

/**
 * Event handler for the popup
 */
async function changePlot() {

	var sel = document.getElementById("plot-sel");
	var text = sel.options[ sel.selectedIndex ].text;

	Promise.resolve(await plottR(webR, text))

}

const plotSel = document.getElementById("plot-sel");
plotSel.addEventListener("change", changePlot);

// init the plot
await plottR(webR, `plot(mtcars, col='steelblue')`)