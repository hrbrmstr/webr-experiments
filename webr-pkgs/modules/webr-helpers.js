/**
 * Utility functions for WebR module.
 * 
 * @module webr-helpers
 */

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; // the helpers use D3

/**
 * Make R data frames more useful in JS
 * 
 * Converts a WebR R data frame JS object  JS format of a data frame into
 * something more usable by lots of JS libraries; `simpleDataFrameTable`
 * in this module is also one of them.
 * 
 * @param {RObject} obj the result of a call to WebR's toJs() on an R data frame object.
 * @returns {Object[]} an array of JS dictionaries in typical JS "data frame" format.
 * @examples
 * let result = await globalThis.webR.evalR(`mtcars`);
 * let output = await result.toJs();
 * let usable = webRDataFrameToJS(output);
 */
export function webRDataFrameToJS(obj) {
	return d3.range(0, obj.values[0].values.length).map((ridx) => {
		let m = {};
		for (var cidx = 0; cidx < obj.names.length; cidx++) {
			m[obj.names[cidx]] = obj.values[cidx].values[ridx];
		}
		return m;
	});
}

/**
 * Simple HTML table generator
 * 
 * Takes a WebR data frame in the format provided by {@link webRDataFrameToJS}
 * 
 * @param {string} sel HTML element selector usable by D3's `select` function.
 * @param {Object[]} data an array of JS dictionaries in typical JS "data frame" format.
 * @param {string[]} columns to include; if undefined or `null`, `Object.keys(data[0])` 
 *                   will be used.
 * @param {string} tableClass class to assign to the table; if undefined or `null`, 
 *                 a class of `webr-table` will be used.
 * @returns the reference to the created table object
 */
export function simpleDataFrameTable(sel, data, columns = Object.keys(data[0]), tableClass = "webr-table") {

	const table = d3.select(sel).append('table')
	table.classed(tableClass, true);
	const thead = table.append('thead')
	const tbody = table.append('tbody');

	thead.append('tr')
		.selectAll('th')
		.data(columns).enter()
		.append('th')
		.text(function (column) { return column; });

	const rows = tbody.selectAll('tr')
		.data(data)
		.enter()
		.append('tr');

  rows.selectAll('td')
		.data(function (row) {
			return columns.map(function (column) {
				return { column: column, value: row[column] };
			});
		})
		.enter()
		.append('td')
		.text(function (d) { return d.value; });

	return table;

}

/**
 * Retrieve a data frame from WebR
 * 
 * Evaluates R code in the provided WebR contacts and returns
 * a JS object that has been processed by a helper function;
 * 
 * @param {WebR::WebR} ctx a working WebR context
 * @param {string} rEvalCode R code to evaluate in `ctx`
 * @returns {Object[]} an array of JS dictionaries in typical JS "data frame" format.
 */
export async function getDataFrame(ctx, rEvalCode) {
	let result = await ctx.evalR(`${rEvalCode}`);
	let output = await result.toJs();
	return (Promise.resolve(webRDataFrameToJS(output)));
}

/**
 * Evaluate R code in a supplied WebR context
 * 
 * Calls evalR and then calls toJS on the result, and returns a WebRDataJs object.
 * 
 * @param {WebR::WebR} ctx a working WebR context
 * @param {string} rEvalCode R code to evaluate in `ctx`
 * @returns {WebR::WebRDataJs} the result of calling `toJs()` on the `result` of the call to `base::source()`
 * @link https://docs.r-wasm.org/webr/v0.1.0/api/js/modules/RObject.html#webrdatajs
 */
export async function evalRToJs(ctx, rEvalCode) {
	let result = await ctx.evalR(`${rEvalCode}`);
	let output = await result.toJs();
	return (Promise.resolve(await result.toJs()));
}

/**
 * Source R code from a URL
 * 
 * Executes `base::source(url)`.
 * 
 * @param {WebR::WebR} ctx a working WebR context
 * @param {string} url R code to evaluate in `ctx`
 * @returns {WebR::WebRDataJs} the result of calling `toJs()` on the `result` of the call to `base::source()`
 * @link https://docs.r-wasm.org/webr/v0.1.0/api/js/modules/RObject.html#webrdatajs
 */
export async function sourceRScript(ctx, url) {
	let result = await ctx.evalR(`source("${url}")`);
	if (!(result.obj === undefined)) return (Promise.resolve(await result.toJs()));
}