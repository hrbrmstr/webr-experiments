/**
 * Main app module
 * 
 * @module main
 */

/**
 * Main app module
 * 
 * @module main
 */

console.log(`are we cross-origin isolates? ${crossOriginIsolated}`);

console.time('Execution Time'); // keeps on tickin'

import { WebR } from '/webr/webr.mjs'; // service workers == full path starting with /

globalThis.webR = new WebR({
	WEBR_URL: "/webr/",
	SW_URL: "/w/ggwebr/",
});

console.log("Initializing WebR…")
await globalThis.webR.init();
console.log("WebR Initialized!")

console.timeEnd('Execution Time');

document.getElementById('loading').innerText = `WebR Loaded!`;

// ===== NOW WE CAN START WORK ===== //

const baseThemePackage = [ "basetheme.R", "coltools.R", "themes.R", "utils.R" ];

for (const rSource of baseThemePackage) {
	console.log(`Sourcing: ${rSource}…`)
	await globalThis.webR.evalRVoid(`source("https://rud.is/w/ggwebr/r/${rSource}")`)
}

await globalThis.webR.evalRVoid(`
x <- seq(-1.95, 1.95, length = 30)
y <- seq(-1.95, 1.95, length = 35)
z <- outer(x, y, function(a, b) a*b^2)
`)

// 
globalThis.webRCodeShelter = await new globalThis.webR.Shelter();

const webR = globalThis.webR; // rly got sick of typing `globalThis`

// yeah, totally not using ggplot2 
//
// document.getElementById('packages').innerText = `Installing packages…`;
// console.log("Installing packages…")
//await webR.installPackages([ 'ggplot2' ])
// console.log("Packages installed!")
//document.getElementById('packages').innerText = `Packages installed!`;

async function plottR(webR, plot_code = "plot(mtcars, col='blue')", width = 400, height = 400, id = "base-canvas") {
	
	const webRCodeShelter = await new webR.Shelter();

	await webR.evalRVoid(`canvas(width=${width}, height=${height})`);

	const result = await webRCodeShelter.captureR(`${plot_code}`, {
		withAutoprint: true,
		captureStreams: true,
		captureConditions: false,
		env: webR.objs.emptyEnv,
	});

	await webR.evalRVoid("dev.off()");

	const msgs = await webR.flush();

	const canvas = document.getElementById(id)
	canvas.setAttribute("width", 2 * width);
	canvas.setAttribute("height", 2 * height);

	msgs.forEach(msg => {
		if (msg.type === "canvasExec") Function(`this.getContext("2d").${msg.data}`).bind(canvas)()
	});

}

async function changePlot() {

	var sel = document.getElementById("plot-sel");
	var text = sel.options[ sel.selectedIndex ].text;

	Promise.resolve(await plottR(webR, text))

}

const plotSel = document.getElementById("plot-sel");

plotSel.addEventListener("change", changePlot);

await plottR(webR, `basetheme("dark"); persp(x, y, z, theta=-45)`)