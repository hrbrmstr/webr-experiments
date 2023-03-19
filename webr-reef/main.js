/**
 * Good day, and welcome to main.js.
 * 
 * @module main
 */

console.log(`Are we cross-origin isolated? ${crossOriginIsolated}`);

import { store, component, render } from './modules/reef.es.min.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import microlight from './modules/microlight.min.js';
import MarkdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/+esm';
import markdownItFootnote from 'https://cdn.jsdelivr.net/npm/markdown-it-footnote@3.0.3/+esm'

console.log(d3)

// Get the markdown into the DOM
const md = new MarkdownIt({ html: true }).use(markdownItFootnote);
const mdContent = await d3.text("./index.md");
const readHTML = new DOMParser();
const contentParsed = readHTML.parseFromString(md.render(mdContent), "text/html");
const bodyContent = contentParsed.getElementsByTagName("body")[ 0 ];
const content = document.getElementById("content")
while (bodyContent.childNodes.length > 0) {
	content.appendChild(bodyContent.childNodes[ 0 ]);
}

// setup code highlighting (none in this one, yet, tho)
microlight.reset();

// utility functions which would likely go into a separate module in a real app

const slugify = str =>
	str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

// SET UP REACTIVE VALUES

// this one is for the loading message you see below the title.
// the blue dot == proper headers are in place
let message = store({ text: "Executing WebR chunks…" })

function showMessage() {
	const { text } = message;
	return `${text}`
}

// whenever we message.text = "something", that "something" will be put in the div in index.md
component('#message', showMessage);

// ====== 

// we're going to populate this after WebR fires up; just a string array of dataset names

let datasets = store({ list: [] })

// this will populate the `<select>` placeholder in `index.md`
function showDatasetList() {
	const { list } = datasets;
	return `${list.map(function (d) {
		return `<option id='${slugify(d)}'>${d}</option>`;
	}).join('')}`;
}

component('#selected-dataset', showDatasetList, { events: true })

// =======

let dataoutput = store({ dataset: "" })

function showData() {
	const { dataset } = dataoutput;
	return `<pre>${dataset}</pre>`
}

component('#dataset-output', showData);

// I'm using d3.select vs take advantage of some of reef's reactivity because
// I think it simplifies the async work. YMMV
d3.select("#selected-dataset").on('change', async () => {

	// get the selected dataset
	const selectedDataset = d3.select("#selected-dataset").property('value')

	// we're capturing console output so we need to do some work evalR cannot do
	const dataShelter = await new webR.Shelter();

	res = await dataShelter.captureR(`data("${selectedDataset}");str(${selectedDataset})`, {
		withAutoprint: true,
		captureStreams: true,
		captureConditions: false,
		env: webR.objs.emptyEnv,
	});

	// get only stdout messages and make a big string and assign it
	// to dataoutput.dataset which will automagically update the dataset-output div
	dataoutput.dataset = res.output
		.filter(d => d.type == "stdout").map(d => d.data).join("\n")

})

// done setting up reactive values

message.text = "Loading WebR…";

// the normal WebR dance

console.time('Execution Time'); // yeah i still care about this
import { WebR } from '/webr/webr.mjs';

globalThis.webR = new WebR({
	WEBR_URL: "/webr/",
	SW_URL: "/w/webr-reef/",
});

console.log("Initializing WebR…")
await globalThis.webR.init();
console.log("WebR Initialized!")
console.timeEnd('Execution Time');

// done dancing

message.text = `${crossOriginIsolated ? '🔵' : '❌'} WebR Initialized!`;

// get the datasets so we can get to work!
let res = await globalThis.webR.evalR(`data(package = "datasets", verbose = FALSE)$results[,"Item"]`);
let out = await res.toJs();
datasets.list = out.values

