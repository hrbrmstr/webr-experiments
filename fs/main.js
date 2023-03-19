/**
 * Main app module
 * 
 * @module main
 */

console.log(`Are we cross-origin isolated? ${crossOriginIsolated}`);

import { store, component, render } from './js/reef.es.min.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import microlight from 'https://cdn.jsdelivr.net/npm/microlight@0.0.7/+esm';
import MarkdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/+esm';
import markdownItFootnote from 'https://cdn.jsdelivr.net/npm/markdown-it-footnote@3.0.3/+esm'

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

// setup code highlighting
microlight.reset();

// setup reactive values
let fileTree = store({ files: [] });
let rFileTree = store({ files: [] });
let localFileTree = store({ files: [] });
let neonFileTree = store({ files: [] });
let readCsvOutput = store({ text: [] })
let message = store({ text: "Executing WebR chunks…" })

function showDirectoryTree() {
	const { files } = fileTree;
	const list = files.map((d) => d.replace(/^\//, "")).join("\n");	
	return `${list}`;
}

function showRDirectoryTree() {
	const { files } = rFileTree;
	const list = files.map((d) => d.replace(/^\//, "")).join("\n");
	return `${list}`;
}

function showLocalDirectoryTree() {
	const { files } = localFileTree;
	const list = files.map((d) => d.replace(/^\//, "")).join("\n");
	return `${list}`;
}

function showNeonDirectoryTree() {
	const { files } = neonFileTree;
	const list = files.map((d) => d.replace(/^\//, "")).join("\n");
	return `${list}`;
}

function showReadCsvOutput() {
	const { text } = readCsvOutput;
	const list = text.map((d) => d.replace(/^\//, "")).join("\n");
	return `${list}`;
}

function showMessage() {
	const { text } = message;
	return `${text}`
}

component('#allfiles', showDirectoryTree);
component('#rfiles', showRDirectoryTree);
component('#localfiles', showLocalDirectoryTree);
component('#neonfiles', showNeonDirectoryTree);
component('#read-csv-output', showReadCsvOutput);
component('#message', showMessage);

message.text = "Loading WebR…";

// get to work!
console.time('Execution Time');

import { WebR } from '/webr/webr.mjs';

globalThis.webR = new WebR({
	WEBR_URL: "/webr/",
	SW_URL: "/w/fs/",
});

console.log("Initializing WebR…")
await globalThis.webR.init();
console.log("WebR Initialized!")

message.text = "WebR Initialized!";

console.timeEnd('Execution Time');

let res = await globalThis.webR.evalR("getwd()");
let out = await res.toJs();
console.log(out);

message.text = "Storing JSON in WebR FS…";

// store some stuff in the WebR filesystem
res = await globalThis.webR.evalRVoid("download.file('https://rud.is/data/webr-packages.json', 'webr-packages.json')");

message.text = "Storing a font in WebR FS…";

await fetch("./f/roboto-condensed-regular.ttf").then(async (d) => {
	console.log("writing file")
	const fil = await d.arrayBuffer()
	await webR.FS.writeFile("roboto-condensed-regular.ttf", fil);
});

// this gets the entire WebR directory tree
res = await globalThis.webR.evalR("list.files('/', full = TRUE, recursive = TRUE)");
out = await res.toJs();
fileTree.files = out.values;
console.log(out);

// this gets the local WebR directory tree
res = await globalThis.webR.evalR("list.files(full = TRUE, recursive = TRUE)");
out = await res.toJs();
localFileTree.files = out.values;
console.log(out);

// this gets just the files ending in '.R'
res = await globalThis.webR.evalR("list.files('/', pattern = '\\\\.R$', full = TRUE, recursive = TRUE)");
out = await res.toJs();
rFileTree.files = out.values;
console.log(out);

// sample one file
const randomRFilePath = await globalThis.webR.evalRString("sample(list.files('/', pattern = '\\\\.R$', full = TRUE, recursive = TRUE), 1)");
document.getElementById("random-r-filename").innerText = randomRFilePath;
const randomRFileRaw = await webR.FS.readFile(randomRFilePath);
const decoder = new TextDecoder();
document.getElementById("random-r-file").innerText = decoder.decode(randomRFileRaw);
console.log(randomRFilePath)

message.text = "Loading an egregiously large ZIP file of CSVs into WebR FS…";

// load up a bunch of files for a course/tutorial
webR.evalRVoid('download.file("https://ndownloader.figshare.com/files/3701572", "NEONDSMetTimeSeries.zip")')
webR.evalRVoid('unzip("NEONDSMetTimeSeries.zip")')

res = await globalThis.webR.evalR('list.files("./NEON-DS-Met-Time-Series", full.names = TRUE,  recursive = TRUE)')
out = await res.toJs();
neonFileTree.files = out.values;
console.log(out);

// capture the output of read.csv
const readCsvShelter = await new webR.Shelter();
res = await readCsvShelter.captureR(
  "read.csv('./NEON-DS-Met-Time-Series/HARV/Daylength/DayLength_PetershamMass_2015.csv')", {
  withAutoprint: true,
  captureStreams: true,
  captureConditions: false,
  env: webR.objs.emptyEnv,
});

readCsvOutput.text = res.output.filter(d => d.type == "stdout").map(d => d.data)

message.text = "Ready!";
