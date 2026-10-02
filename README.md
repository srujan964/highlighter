# Highlighter

A small browser source to highlight messages of importance from Twitch chat. Highlights messages tagged with `!highlight`, `!ht` or `ht: ` from moderators by default.

## Building

Bundle the project via:

```
vite build
```

The generated file is available under `dist/`.

## Usage

The HTML file can be served in two ways --- directly as a `file:///` URL or served by a web server as localhost.

The `file:///` URL scheme is the easiest but does not allow for query params, so the configuration needs to be hard-coded in such cases:
- Create a dock in OBS and set the URL as `file:///<path to html file>`

- If serving via a web-server, set the query params as follows: `?channel=<channel_name>&size=18&feedSize=5&interval=4500&hideAfter=10`


The configuration options are:

|Field|Description|
|-----|-----------|
|channel|The channel to listen to|
|size|Font size|
|feedSize|Max messages allowed in the feed|
|interval|Flash animation duration on the latest message in ms|
|hideAfter|How long a message stays in the feed in minutes|
