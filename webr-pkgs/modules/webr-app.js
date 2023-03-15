/**
 * Supporting functions for `webr-app`
 * 
 * @module webr-app
 */

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; // the helpers use D3
import { Grid } from "https://unpkg.com/gridjs?module";
import * as HelpR from './webr-helpers.js'; // WebR-specific helpers
import * as RSupport from "./rsupport.js";

function webRDataJsDfToGrid(obj) {
	return d3
		.range(0, obj.values[ 0 ].values.length)
		.map((ridx) =>
			d3
				.range(0, obj.values.length)
				.flatMap((cidx) => obj.values[ cidx ].values[ ridx ])
	)
}

/**
 * Initialize our table.
 * 
 * @param {WebR::WebR} ctx an initialized WebR context
 * @param {string} id element id
 */
export async function packagesToGrid(ctx, id) {

	const obj = await RSupport.getWebrPackages(ctx)

	const gridObj = webRDataJsDfToGrid(obj);

	new Grid({
		columns: obj.names,
		data: gridObj,
		pagination: {
			limit: 20,
			summary: true
		},
		fixedHeader: true,
		search: true,
		language: {
			'search': {
				'placeholder': '🔍 📦 Search...'
			}
		}
	}).render(document.getElementById(id));

}
