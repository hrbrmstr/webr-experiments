# hrbrmstr's WebR (webR?) Experiments

>Before you read this, please reconsider your life choices and wait for WASM Shiny to support WebR like it does Pyodide if you really want Reactive apps.
>
>If you're still reading, also consider using React. George (et al.) has an example of that in the docs and in the WebR repo. I despise giant web frameworks and always try to do what I can in VanillaJS and D3 (or Observable) if at all possible. But, I'm also pretty messed up.
>
>If you are _still_ reading, consider [using this awesome WebR Quarto extension](https://github.com/coatless/quarto-webr) instead.
>
>If you are _stil_, _still_ reading, def don't do the "everything in one directory" madness I did on my deployed examples. I'll be adding more to this repo to provide a better strategy for managing these projects.

I went bonkers over the release of WebR on Thursday. These are some of my experiments. I'll continue to add some, and also make some that aren't as "toy"ish.
 
They are _not_ complete, working things. Just some stuff to show folks some concepts. But, if you download the various JS and CSS components referenced in the HTML docs, you might be able to get it working before I get a chance to pretty up this whole mess over the next couple days. 

The associated directories are named pretty obviously.

The `file` references are where the code lives. Honesty, you can just view-source in your browser, too.

I was lazy and had like _everything_ in the same directory (WebR, JS, CSS, CSV, etc). That's pretty dumb, but I've only got so much energy these days thanks to everyone in the U.S. pretending the pandemic is over (yay long covid). 

## Days 1 & 2 

`index.html`

Small demo that uses D3 to build a list from R object output — <https://rud.is/webr-d3-demo/>

`pkgs.html`

Plot `mtcars` with Vega-Lite. <https://rud.is/webr-d3-demo/pkgs.html>

The file is named badly (it no longer relies on any R pkgs) but it's too late to change it now

Just showing how to pass data to Vega from R. Chosen b/c Vega is super lightweight and the Vega specs are dope.

`plot.html`

Observable Plot demo — <https://rud.is/webr-d3-demo/plot.html>

- loads {jsonlite} (b/c I was too lazy that day to write a function you'll see in a bit) 
- yanks `mtcars` from R
- reads a CSV from my server
- Uses Observable Plot to make a lot

`plot-moar`

"Reactive" sans React/Shiny demo that also includes WebR reading from a remote CSV — <https://rud.is/webr-d3-demo/plot-moar.html>

The dropdown list is made from R data and the plot and janky table change by pulling the associated data from R each time.

It also includes this JS function to make data frames returned to JS from WebR more user-friendly (it's what I was using {jsonlite} for):

```js
function webRDFToJS(obj) {
  return d3.range(0, obj.values[0].values.length).map((ridx) => {
	let m = {};
	  for (var cidx = 0; cidx < obj.names.length; cidx++) {
		  m[obj.names[cidx]] = obj.values[cidx].values[ridx];
  	}
  	return m;
  });
}
```

I went back and re-added that to these to make them faster.

## Day 3

`index.html` + `support.r`

"Dashboard" b/c someone requested it. — <https://rud.is/webr-dash/no-dplyr.html>

This one uses {dplyr}++ and was originally _super slow_ until George gave me a hack that I'll show in a bit. All the R code for it the support file.

R does tons more heavy lifting in this, and there are JS wrappers to WebR calls to pull things from R. Def a poor dude's Shiny/React setup.

`no-dplyr.html` + `support-no-dplyr.r`

Same Dashboard but it's much faster, but that's kind of meaningless b/c the both load stupid fast now.

## TIL

### Headers

IT IS REALLY IMPORTANT TO GO HERE AND READ IT: <https://docs.r-wasm.org/webr/latest/serving.html>

I'm kind of new to web workers, but know abt shared array buffers and these HTTP server headers are SUPER IMPORANT b/c they make WebR apps 10-100x faster to load, esp if you use pkgs.

```plain
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## "Pro"tips

Yeah, "pro". _Sure._ More like "hrbrhacks". 

### JavaScript Modules

WebR is a [JavaScript module](https://www.w3schools.com/js/js_modules.asp), and you need to make sure that files with an `mjs` extension have a [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of `text/javascript`. A typical way for web servers to know how to communicate this is via a `mime.types` file. That is not true for all web servers, and I'll add steps for ones that use a different way to configure this. The entry should look like this:

```
text/javascript  mjs;
```

### Your DevTools Console Is Also Your R Console

Once WebR is initialized into `globalThis` (that's only one way to do it and that idiom is used in other examples), you can use it in the DevTools console:

```js
let jsobj = await (await globalThis.webR.evalR("mtcars")).toJs()
```

Obviously, you can call anything, and even source random R scripts from the internet (_don't_ do that).

But, it can be handy having R around.