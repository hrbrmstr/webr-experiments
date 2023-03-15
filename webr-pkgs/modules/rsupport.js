/**
 * Supporting functions for `webr-app`
 * 
 * @module rsupport
 */

import * as HelpR from "./webr-helpers.js"

/**
 * Wrapper for the `get_webr_packages()` function in `support.r`
 * 
 * @returns {WebR::WebRDataJs} the result of calling `toJs()` on the `result` of the call to `base::source()`
 *          In this case, the result is in the shape of a data frame.
 * @link https://docs.r-wasm.org/webr/v0.1.0/api/js/modules/RObject.html#webrdatajs
 */
export async function getWebrPackages(ctx) {
	return (Promise.resolve(await HelpR.evalRToJs(ctx, 'get_webr_packages()')))
}
