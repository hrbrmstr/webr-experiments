# ReefR Less Complex Example

## A Simple WebR `datasets` Explorer

<div id="message"></div>

The [WebR Filesystem demo](https://rud.is/w/fs/) was a tad large to get a quick overview of this crazy framework (ReefR?) I accidentally hacked together. This one is a bit less complex. It's a small app that:

- loads a list of all datasets in the `datasets` package and shoves it into a `<select>` list.
- when a dataset is selected, the `str()` output of it is displayed below the popup menu.

If you view `index.md`, you'll see it's just some light markdown and a couple bits of HTML for the:

- reactive `#message` `<div>` that will show anything we assign to it
- reactive `#selected-dataset` `<select>` list which will get automagically populated on load and, when changed, will cause the value of the next item in this list to change
- reactive `#dataset-output` which will hold a `str()` of the selected dataset. 

The `index.html` file is really just a shell for opengraph tags plus an element to put this app into. `main.js` does all the work.

<label for='selected-dataset'>
Select dataset: <select id='selected-dataset'></select>
</label>

<div id="dataset-output"></div>