node-vtt
========

[![Build Status](https://travis-ci.org/mozilla/node-vtt.svg?branch=master)](https://travis-ci.org/mozilla/node-vtt) [![npm-version](http://img.shields.io/npm/v/node-vtt.svg)](https://www.npmjs.org/package/node-vtt) [![Dependency Status](https://david-dm.org//mozilla/node-vtt.svg?theme=shields.io)](https://david-dm.org//mozilla/node-vtt)
[![devDependency Status](https://david-dm.org/mozilla/node-vtt/dev-status.svg?theme=shields.io)](https://david-dm.org/mozilla/node-vtt#info=devDependencies)

A node wrapper for [vtt.js](https://github.com/mozilla/vtt.js). It runs `vtt.js`
on [PhantomJS](http://phantomjs.org/) from Node.

### Table of Contents

- [Install](#install)
- [API](#api)
  - [NodeVTT's Web Page](#nodevtts-web-page)
  - [ready](#ready)
  - [cues](#cues)
  - [regions](#regions)
  - [vtt](#vtt)
  - [errors](#errors)
  - [init(options, onInit)](#initoptions-oninit)
  - [shutdown()](#shutdown)
  - [parse(data, onParsed)](#parsedata-onparsed)
  - [parseFile(file, onParsed)](#parsefilefile-onparsed)
  - [flush(onFlush)](#flushonflush)
  - [processParsedData(data, onProcessed)](#processparseddatadata-onprocessed)
  - [processFile(file, onProcessed)](#processfilefile-onprocessed)
  - [clear(onClear)](#clearonclear)
  - [setupParser(encoding, onSetup)](#setupparserencoding-onsetup)
  - [error](#error)
- [License](#license)

Install
=======

`node-vtt` is on `npm`. To install run:

```bash
$ npm install node-vtt
```

You'll need to install `PhantomJS` if you haven't already. You can download
it from its [website](http://phantomjs.org/download.html) or simply use npm:

```bash
$ npm install -g phantomjs
```

Or include it in your `package.json` dependencies.

API
===

`node-vtt` has a simple async API:

```js
var NodeVTT = require("node-vtt"),
    nodeVTT = new NodeVTT();

nodeVTT.init(function() {
  nodeVTT.parseFile("someVTTFile", function(error) {
    if (error) {
      // Do something with error.
    }
    // Do something with the vtt we parsed.
    var vtt = nodeVTT.vtt;
    nodeVTT.processParsedData(function(error, divs) {
      if (error) {
        // Do something with error.
      }
      console.log(divs);
    });
  });
});
```

#### NodeVTT's Web Page

`node-vtt` uses [PhantomJS](http://phantomjs.org/) to run `vtt.js` on a web
page. Therefore, you need to have a simple HTML file for `node-vtt` to load. There
is a default one provided for you, so read no further if you're not interested in
customizing the page it uses.

If you provide your own page the page must have a few things.

* It must have the `WebVTT`, `VTTCue`, and `VTTRegion` shims provided by
[vtt.js](https://github.com/mozilla/vtt.js). Doing this is most easily accomplished
by using the `vtt.js` bower distributable and including it as a script on the
page. However, if you want more granularity in what is included on the page from
`vtt.js` you can also `npm install vtt.js` and have access to the individual
source files through that.

* The page must also have the `vttcue-extended` and `vttregion-extended` versions
of the `VTTCue` and `VTTRegion` shims on the page.

* If you'd like to run the processing model the page must have a `div` element on it
with an `id` property of `overlay` and a positioning of `relative`. `node-vtt` uses
this div as the container to display subtitles.

See the [default page](https://github.com/mozilla/node-vtt/blob/master/lib/basic.html)
provided for you for more information.

Once you've created your own customized page check out how you can load it with the
[init](#initoptions-oninit) function.

#### ready

The `ready` property describes whether or not `node-vtt` is ready to parse or process
WebVTT. To get `node-vtt` ready you must call [init](#initoptions-oninit). It will become "un-ready"
when you all [shutdown](#shutdown).

#### cues

The `cues` property contains an array of the aggregated `VTTCues` that have been
parsed from a WebVTT file. Calling [clear](#clearonclear) will empty the `cues` array.

```js
var cues = nodeVTT.cues;
```

#### regions

The `regions` property contains an array of the aggregated `VTTRegions` that have been
parsed from a WebVTT file. Calling [clear](#clearonclear) will empty the `regions` array.

```js
var regions = nodeVTT.regions;
```

#### vtt

The `vtt` property contains an object that is the `cues` and `regions` properties.
This provides an easy way to get all the `VTTCues` and `VTTRegions` data parsed
from a file.

```js
var vtt = nodeVTT.vtt,
    cues = vtt.cues,
    regions = vtt.regions;
```

#### errors

The `errors` property contains an array of the aggregated
[ParsingErrors](https://github.com/mozilla/vtt.js#parsingerror) from `vtt.js`
that have been received while parsing some WebVTT file. Calling
[clear](#clearonclear) will empty the `errors` array.

```js
var errors = nodeVTT.errors;
```

#### init(options, onInit)

Initializes the `node-vtt` object. It optionally takes an options object that
can contain two config properties&mdash;`uri` and `encoding`. `uri` points at a custom
page that you want `node-vtt` to load and run on. The page must have the WebVTT
shim from `vtt.js` included on the page as well as the shims for VTTCue
(extended) and VTTRegion (extended). If you don't want to  pass a `uri` a default
page will be provided for you. The `encoding` property specifies the encoding of the
data that you want to parse. `node-vtt` currently supports two types&mdash;`string` or `utf8`.

If you'd like to make a custom page for `node-vtt` to work with then check out
more information on that [here](#nodevtts-web-page).

Using the default config of type `utf8` and the basic page provided for you.

```js
nodeVTT.init(function(error) {
  if (error) {
    return console.log(error.message);
  }
  // Run some node-vtt code.
});
```

Or with an options object:

```js
nodeVTT.init({ uri: "my-web-page.html", encoding: "string" }, function(error) {
  if (error) {
    return console.log(error.message);
  }
  // Run some node-vtt code
});
```

#### shutdown()

Shuts `node-vtt` down. This is necessary as `node-vtt` will keep a `PhantomJS`
instance alive until this method is called.

```js
nodeVTT.shutdown();
```

#### parse(data, onParsed)

Parses `data` as a chunk of WebVTT data. `data` can either be a UTF8 Node ArrayBuffer
or a string. Make sure to call [init](#initoptions-oninit) or
[setupParser](#setupparserencoding-onsetup) with the appropriate encoding specified
before calling this function. `onParsed` will return an [error](#error) object that
has a `message` property if an error occurred. The parsed VTTCues and VTTRegions are
aggregated on the `node-vtt` object itself and can be accessed via the [vtt](#vtt),
[cues](#cues), or [regions](#regions) properties.

```js
var fs = require("fs"),
    data = fs.readFileSync("vtt-file");

nodeVTT.parse(data, function(error) {
  if (error) {
    return console.log(error.message);
  }
  var vtt = nodeVTT.vtt;
});
```

#### parseFile(file, onParsed)

A version of [parse(data, onParsed)](#parsedata-onparsed) that will read the
WebVTT from a file for you and call [flush](#flushonflush) where needed.

```js
nodeVTT.parseFile("vtt-file", function(error) {
  if (error) {
    // Do something
  }
  var vtt = nodeVTT.vtt;
});
```

#### flush(onFlush)

Flushes the parser. This indicates that no more data will be coming to the parser
and so it should parse any unparsed data it may have. This is necessary when parsing
stream data. See [flush](https://github.com/mozilla/vtt.js#flush) on `vtt.js` for
more information. `onFlush` will return an [error](#error) if something went
wrong, otherwise, it will return nothing.

```js
nodeVTT.parse(data, function(){
  nodeVTT.parse(moreData, function() {
    nodeVTT.flush(function(error) {
      if (error) {
        console.log(error.message);
      }
      var vtt = nodeVTT.vtt;
    });
  });
});
```

#### processParsedData(data, onProcessed)

Runs the [processing level](http://dev.w3.org/html5/webvtt/#processing-model)
steps of the WebVTT specification over the cues contained in `data`. `data` should
be an object with a `cues` property on it that is an array
of the `VTTCues` that should be processed. This turns the cues and regions into a
series of `div` elements that have CSS and positioning applied to them and are ready
to be shown on a video. These divs will be returned through the `onProcessed`
callback and will also be automatically added as child elements to the `overlay` div.
The `overlay` div is a div used as a container for the subtitles. This overlay
div comes from the page that `node-vtt` loaded with the [init](#inituri-oninit)
function. The div on the page must have an `id` property set to 'overlay'.

```js
var data = {
  cuse: [ /* VTTCues go in here */ ]
};
nodeVTT.processParsedData(data, function(error, divs) {
  if (error) {
    return console.log(error.message);
  }
  // Do something with divs.
});
```

**Note:** Processing regions isn't supported yet by `vtt.js`. It will be in the
future though.

If you have just used the same instance of `node-vtt` to parse some data you
can leave out the `data` parameter. The default is for it to use the `cues`
and `regions` that it has aggregated already.

```js
nodeVTT.parseFile("vtt-file", function() {
  // Leave out that 'data' parameter as we just parsed some WebVTT and we can use
  // the VTTCues and VTTRegions aggregated by this nodeVTT instance in its cues
  // and regions properties.
  nodeVTT.processParsedData(function(error, divs) {
    if (error) {
      return console.log(error.message);
    }
    // Do something with divs.
  });
});
```

#### processFile(file, onProcessed)

A version of [processParsedData](#processparseddatadata-onprocessed) except that
it will read and parse the WebVTT data contained within the file and process it for
you in one go.

```js
nodeVTT.processFile("vtt-file", function(error, divs) {
  if (error) {
    return console.log(error);
  }
  // Do something with divs
});
```

#### clear(onClear)

Clears the state of `node-vtt`. This will create a fresh parser and empty the
[vtt](#vtt), [cues](#cues), [regions](#regions), and [errors](#errors) arrays.
`onClear` will be called with an [error](#error) if something went wrong.

This enables you to start parsing a new set of WebVTT data without creating a
whole new `node-vtt` object which is epensive since it has to start `PhantomJS`
and establish a connection.

```js
nodeVTT.clear(function(error) {
  if (error) {
    console.log(error.message);
  }
  // Ready to do some more parsing.
});
```

**Note:** Calling `clear` is only necessary if you want to parse a new set of
WebVTT data. You do not need to call it if you're just calling the processing
functions.

#### setupParser(encoding, onSetup)

Clears the current state of `node-vtt`, see [clear](#clearonclear), and sets up a
new parser that is configured to parse the `encoding` specified. Only `string`
and `utf8` are currently supported for encodings. If you don't pass `encoding`
this function has the exact same behaviour as [clear](#clearonclear).

```js
nodeVTT.setupParser("string", function() {
  var data = "WEBVTT\n00:00.000 --> 00:01.000\nI'm a Cue!";
  nodeVTT.parse(data, function() {
    console.log(nodeVTT.vtt);
  });
});
```

#### error

The error objects returned by `node-vtt` are simple JS objects with a `message` property
on them describing the error.

```js
nodeVTT.parseFile("wrong-file", function(error) {
  if (error) {
    console.log(error.message);
  }
});
```

License
=======

Apache v2.0. See [LICENSE](https://github.com/mozilla/node-vtt/blob/master/LICENSE).
