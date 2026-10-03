# Highlighter

A small browser source to highlight messages of importance from Twitch chat. Highlights messages tagged with `!highlight`, `!ht` or `ht: ` from moderators by default.

## Building

Bundle the project via:

```shell
vite build
```

The generated file is available under `dist/`.

## Usage

The HTML file can be served in two ways --- directly as a `file:///` URL or served by a web server as localhost.

The `file:///` URL scheme is the easiest to set up but does not allow for query params, so the configuration needs to be defined in an `.env` file. See [here](#local) for more details.

Create a custom dock in OBS and set the URL as `file:///<path to html file>`.

> Note: If serving via a web-server, set the query params as follows: `?channel=<channel_name>&size=18&feedSize=5&interval=4500&hideAfter=10`.

## Configuration

The configuration options are:

|Field|Type|Description|
|-----|---|-----------|
|channel|string|The channel to listen to|
|size|number|Font size|
|feedSize|number|Max messages allowed in the feed|
|interval|number|Flash animation duration on the latest message in ms|
|hideAfter|number|How long a message stays in the feed in minutes|
|isDemo|boolean|Start the dock with some prepopulated messages for testing|

### Local 

Vite lets you define variables in an `.env` file and bakes it into the bundled HTML at build time.

Create a `.env.local` and define the following:
```env
VITE_CHANNEL=test
VITE_FEED_SIZE=5
VITE_FONT_SIZE=18
VITE_INTERVAL_MS=4500
VITE_HIDE_AFTER=10
VITE_DEMO_ENABLED=false
```
