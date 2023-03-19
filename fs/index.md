# Look What Came Along For The Ride With WebR!

> I should have looked at the size of the ZIP file that this exercise works with live.
>
> You may need to wait a few seconds (or more) for the output blocks to fill up.
>
> I'll fix that in a bit.

<div id="message"></div>

## a.k.a. Working With The WebR Filesystem

WebR is, at the core, a full base R distribution compiled to WebAssembly. Base R comes with batteries included. All the base R 🔋! Including base R 📦 like `{grid}` and `{stats}`.

This is the entire filesystem:

<textarea id="allfiles"></textarea>	

We had R do the heavy lifting for us rather than use the WebR FS API:

<div class="microlight">webR.evalR("list.files('/', full = TRUE, recursive = TRUE)")</div>

Keen-eyed readers will have noticed there are two files that do not come with the base R distribution in that list. 

- `/home/web_user/roboto-condensed-regular.ttf`
- `/home/web_user/webr-packages.json`

That's because _we_ put them there!

We can also just focus on the default/home directory:

<div class="microlight">webR.evalR("list.files(full = TRUE, recursive = TRUE)")</div>

<textarea id="localfiles"></textarea>	

How did they get there?

First, we had R download a file for us:

<div class="microlight">webR.evalRVoid("download.file('https://rud.is/data/webr-packages.json', 'webr-packages.json')");</div>

Next, we used the built-in `fetch` to copy a font into the filesystem from javascript[^1]:

<div class="microlight">await fetch("./f/roboto-condensed-regular.ttf").then(async (d) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Response
  const fil = await d.arrayBuffer()
  await webR.FS.writeFile("roboto-condensed-regular.ttf", fil);
});</div>

WebR has core [filesystem ops](https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebR.WebRFS.html) that wrap the [Emscripten filesystem API](https://emscripten.org/docs/api_reference/Filesystem-API.html). You've seen this if you've played with the [the WebR Console](https://rud.is/webr/). We have ops we can make from JavaScript, and R filesystem functions like `dir.create()` and `list.files()` work perfectly. To prove it, let's just look at the R source code files:

<textarea id="rfiles"></textarea>	

Let's pull one at random and view the contents[^3]:

<div class="microlight">const randomRFilePath = await webR.evalRString(
  "sample(list.files('/', pattern = '\\\\.R$', full = TRUE, recursive = TRUE), 1)"
);
const randomRFileRaw = await webR.FS.readFile(randomRFilePath);
const decoder = new TextDecoder();
decoder.decode(randomRFileRaw)
</div>

<p id="random-r-filename" style="font-family: monospace"></p>
<div id="random-r-file" class="microlight"></div>

We have to use `TextDecoder()` since `readFile()` returns a javascript `Uint8Array` because it cannot assume contents is a text file.	

## Why Should I Care About This?

I think a big use-case for WebR is removing the need for a server to show examples to folks learning some topic centered around R. You're going to want to have the examples mimic what folks would do IRL.

The following is a toy example, but let's say Battelle wanted to de-static-ify one (or more) of [their R tutorials](https://www.neonscience.org/resources/learning-hub/tutorials/dc-convert-date-time-posix-r). Having an R environment right in the browser that learners could use to run the exercises and then mess around a bit on their own would be a real upgrade to the learning experience. Right now, there's a big "Download Dataset" at the top of the page for that lesson. What if it was "just there" in a live R environment?

<div class="microlight">webR.evalRVoid('download.file("https://ndownloader.figshare.com/files/3701572", "NEONDSMetTimeSeries.zip")')
webR.evalRVoid('unzip("NEONDSMetTimeSeries.zip")')

await webR.evalR('list.files("./NEON-DS-Met-Time-Series/", full.names = TRUE,  recursive = TRUE)')</div>

<textarea id="neonfiles"></textarea>	

We can also do that the hard way[^2]:

```js
const daylengthFiles = [ "DayLength_Petersham_Mass_2009.txt",
  "DayLength_Petersham_Mass_2011.txt",
  "DayLength_Petersham_Mass_2015.txt",
  "DayLength_Petersham_Mass_2010.txt",
  "DayLength_PetershamMass_2015.csv",
  "DayLengthSource_MetaData.txt"
];

await globalThis.webR.evalRVoid("dir.create('./NEON-DS-Met-Time-Series/HARV/Daylength', recursive = TRUE)")
for (const daylengthFile of daylengthFiles) {
  await fetch(`./f/NEON-DS-Met-Time-Series/HARV/Daylength/${daylengthFile}`).then(async (d) => {
    console.log(`writing file: ${daylengthFile}`)
    const fil = await d.arrayBuffer()
    await webR.FS.writeFile(`./NEON-DS-Met-Time-Series/HARV/Daylength/${daylengthFile}`, fil);
  });
}
```

After that, you can have a place in the examples that does something like:

<div class="microlight">read.csv('./NEON-DS-Met-Time-Series/HARV/Daylength/DayLength_PetershamMass_2015.csv')</div>

<textarea id="read-csv-output"></textarea>	

You need to use `captureR()` to get the `stdout` stream of the auto-printed `read.csv()`:

<div class="microlight">const readCsvShelter = await new webR.Shelter();
res = await readCsvShelter.captureR(
  "read.csv('./NEON-DS-Met-Time-Series/HARV/Daylength/DayLength_PetershamMass_2015.csv')", {
  withAutoprint: true,
  captureStreams: true,
  captureConditions: false,
  env: webR.objs.emptyEnv,
});</div>

### FIN

Hopefully that was both fun and informative.

I've added this to my ongoing log book of [webr-examples](https://github.com/hrbrmstr/webr-experiments/tree/batman).

You may want to poke at this one for more than just WebR stuff.

Fiddling with `document.getElementById()` stuff is a pain. So I'm using a super tiny reactive framework called [Reef](https://reefjs.com/getting-started/). 

I also really hate writing HTML so I spent some time jury rigging a system that lets me write these in Markdown. Just look at the source and drop questions (if you have any) in the issues of `webr-experiments`.

Reef + Markdown-It means I've _kind of made a mini reactive notebook/Shiny environment for WebR_.

[^1]: Yes, this means I'm going to try to use user-supplied fonts on the R side at some point.
[^2]: Apologies for the unstylized code. It seems relying on a **too** minimalitic syntax highlighter might not have been the best of plans. `microlight` does not seem to grok `for` with parens.
[^3]: Refresh the page to prove it's random!# Look What Came Along For The Ride With WebR!

> I should have looked at the size of the ZIP file that this exercise works with live.
>
> You may need to wait a few seconds (or more) for the output blocks to fill up.
>
> I'll fix that in a bit.

<div id="message"></div>

## a.k.a. Working With The WebR Filesystem

WebR is, at the core, a full base R distribution compiled to WebAssembly. Base R comes with batteries included. All the base R 🔋! Including base R 📦 like `{grid}` and `{stats}`.

This is the entire filesystem:

<textarea id="allfiles"></textarea>	

We had R do the heavy lifting for us rather than use the WebR FS API:

<div class="microlight">webR.evalR("list.files('/', full = TRUE, recursive = TRUE)")</div>

Keen-eyed readers will have noticed there are two files that do not come with the base R distribution in that list. 

- `/home/web_user/roboto-condensed-regular.ttf`
- `/home/web_user/webr-packages.json`

That's because _we_ put them there!

We can also just focus on the default/home directory:

<div class="microlight">webR.evalR("list.files(full = TRUE, recursive = TRUE)")</div>

<textarea id="localfiles"></textarea>	

How did they get there?

First, we had R download a file for us:

<div class="microlight">webR.evalRVoid("download.file('https://rud.is/data/webr-packages.json', 'webr-packages.json')");</div>

Next, we used the built-in `fetch` to copy a font into the filesystem from javascript[^1]:

<div class="microlight">await fetch("./f/roboto-condensed-regular.ttf").then(async (d) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Response
  const fil = await d.arrayBuffer()
  await webR.FS.writeFile("roboto-condensed-regular.ttf", fil);
});</div>

WebR has core [filesystem ops](https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebR.WebRFS.html) that wrap the [Emscripten filesystem API](https://emscripten.org/docs/api_reference/Filesystem-API.html). You've seen this if you've played with the [the WebR Console](https://rud.is/webr/). We have ops we can make from JavaScript, and R filesystem functions like `dir.create()` and `list.files()` work perfectly. To prove it, let's just look at the R source code files:

<textarea id="rfiles"></textarea>	

Let's pull one at random and view the contents[^3]:

<div class="microlight">const randomRFilePath = await webR.evalRString(
  "sample(list.files('/', pattern = '\\\\.R$', full = TRUE, recursive = TRUE), 1)"
);
const randomRFileRaw = await webR.FS.readFile(randomRFilePath);
const decoder = new TextDecoder();
decoder.decode(randomRFileRaw)
</div>

<p id="random-r-filename" style="font-family: monospace"></p>
<div id="random-r-file" class="microlight"></div>

We have to use `TextDecoder()` since `readFile()` returns a javascript `Uint8Array` because it cannot assume contents is a text file.	

## Why Should I Care About This?

I think a big use-case for WebR is removing the need for a server to show examples to folks learning some topic centered around R. You're going to want to have the examples mimic what folks would do IRL.

The following is a toy example, but let's say Battelle wanted to de-static-ify one (or more) of [their R tutorials](https://www.neonscience.org/resources/learning-hub/tutorials/dc-convert-date-time-posix-r). Having an R environment right in the browser that learners could use to run the exercises and then mess around a bit on their own would be a real upgrade to the learning experience. Right now, there's a big "Download Dataset" at the top of the page for that lesson. What if it was "just there" in a live R environment?

<div class="microlight">webR.evalRVoid('download.file("https://ndownloader.figshare.com/files/3701572", "NEONDSMetTimeSeries.zip")')
webR.evalRVoid('unzip("NEONDSMetTimeSeries.zip")')

await webR.evalR('list.files("./NEON-DS-Met-Time-Series/", full.names = TRUE,  recursive = TRUE)')</div>

<textarea id="neonfiles"></textarea>	

We can also do that the hard way[^2]:

```js
const daylengthFiles = [ "DayLength_Petersham_Mass_2009.txt",
  "DayLength_Petersham_Mass_2011.txt",
  "DayLength_Petersham_Mass_2015.txt",
  "DayLength_Petersham_Mass_2010.txt",
  "DayLength_PetershamMass_2015.csv",
  "DayLengthSource_MetaData.txt"
];

await globalThis.webR.evalRVoid("dir.create('./NEON-DS-Met-Time-Series/HARV/Daylength', recursive = TRUE)")
for (const daylengthFile of daylengthFiles) {
  await fetch(`./f/NEON-DS-Met-Time-Series/HARV/Daylength/${daylengthFile}`).then(async (d) => {
    console.log(`writing file: ${daylengthFile}`)
    const fil = await d.arrayBuffer()
    await webR.FS.writeFile(`./NEON-DS-Met-Time-Series/HARV/Daylength/${daylengthFile}`, fil);
  });
}
```

After that, you can have a place in the examples that does something like:

<div class="microlight">read.csv('./NEON-DS-Met-Time-Series/HARV/Daylength/DayLength_PetershamMass_2015.csv')</div>

<textarea id="read-csv-output"></textarea>	

You need to use `captureR()` to get the `stdout` stream of the auto-printed `read.csv()`:

<div class="microlight">const readCsvShelter = await new webR.Shelter();
res = await readCsvShelter.captureR(
  "read.csv('./NEON-DS-Met-Time-Series/HARV/Daylength/DayLength_PetershamMass_2015.csv')", {
  withAutoprint: true,
  captureStreams: true,
  captureConditions: false,
  env: webR.objs.emptyEnv,
});</div>

### FIN

Hopefully that was both fun and informative.

I've added this to my ongoing log book of [webr-examples](https://github.com/hrbrmstr/webr-experiments/tree/batman).

You may want to poke at this one for more than just WebR stuff.

Fiddling with `document.getElementById()` stuff is a pain. So I'm using a super tiny reactive framework called [Reef](https://reefjs.com/getting-started/). 

I also really hate writing HTML so I spent some time jury rigging a system that lets me write these in Markdown. Just look at the source and drop questions (if you have any) in the issues of `webr-experiments`.

Reef + Markdown-It means I've _kind of made a mini reactive notebook/Shiny environment for WebR_.

[^1]: Yes, this means I'm going to try to use user-supplied fonts on the R side at some point.
[^2]: Apologies for the unstylized code. It seems relying on a **too** minimalitic syntax highlighter might not have been the best of plans. `microlight` does not seem to grok `for` with parens.
[^3]: Refresh the page to prove it's random!