/**
 * Copyright 2013 vtt.js and node-vtt Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Phantom = require("node-phantom"),
    WebVTT = require("vtt.js"),
    VTTCue = WebVTT.VTTCue,
    VTTRegion = WebVTT.VTTRegion,
    fs = require("fs"),
    path = require("path");

// Check the ready state. If it's not ready then report an init error.
function checkReady(ready, onCheck) {
  !ready && onCheck({ message: "You must call init before calling anything else." });
  return ready;
}

// Sets up a new parser on the page.
function setupParser(page, encoding, onSetup) {
  page.evaluate(function(encoding) {
    window.p = new WebVTT.Parser(window);
    if (encoding === "string") {
      window.p.decoder = new WebVTT.StringDecoder();
    } else if (!Object.toUint8Array) {
      Object.prototype.toUint8Array = function() {
        var len = this.length,
            uint8Array = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
          uint8Array[i] = this[i];
        }
        return uint8Array;
      };
    }
    p.oncue = function(cue) {
      window.callPhantom({ cue: cue });
    };
    p.onregion = function(region) {
      window.callPhantom({ region: region });
    };
    p.onparsingerror = function(e) {
      window.callPhantom({ error: e });
    };
  }, onSetup, encoding);
}

// NodeVTT is a NodeJS wrapper for vtt.js that runs on an instance of PhantomJS.
// Aggregates the parsed cues, regions, and errors.
function NodeVTT() {
  this.cues = [];
  this.regions = [];
  this.errors = [];
  Object.defineProperties(this, {
    "ready": {
      get: function() { return this.phantom && this.page; }
    },
    "vtt": {
      get: function() { return { regions: this.regions, cues: this.cues }; }
    }
  });
}

// Spin up a new PhantomJS instance that NodeVTT can use to run vtt.js on. The
// options object can contain a URI that points to a customized page that
// NodeVTT will run on. The page must have the WebVTT, VTTCue, and VTTRegion
// shims included on them. The options object can also contain an encoding property
// that tells what kind of data the parser should expect to be streaming.
// Supported types are 'string' and 'utf8'.
NodeVTT.prototype.init = function(options, onInit) {
  if (typeof options === "function") {
    onInit = options;
    options = {};
  }
  options.uri = options.uri || path.join(__dirname, "/basic.html");
  options.encoding = options.encoding || "utf8";
  this.options = options;

  var self = this;
  Phantom.create(function(error, ph) {
    if (error) {
      return onInit(error);
    }
    ph.createPage(function(error, page) {
      if (error) {
        return onInit(error);
      }
      page.open(options.uri, function(error, status) {
        if (error || status === "fail") {
          return onInit({ message: "Unable to open a page for " + options.uri +
                                    ". " + (error ? error.message : "") });
        }
        self.page = page;
        // Redirect console messages in PhantomJS to the command line.
        self.page.onConsoleMessage = function (msg) {
          console.log(msg);
        };
        // Redirect error message in PhantomJS to the command line.
        self.page.onError = function(message) {
          console.error(message);
        };
        // Aggregate the parsed cues and regions.
        self.page.onCallback = function(data) {
          data.error && self.errors.push(data.error);
          data.cue && self.cues.push(VTTCue.create(data.cue));
          data.region && self.regions.push(VTTRegion.create(data.region));
        };
        self.phantom = ph;
        // Call clear which will make sure our state is clean and that an
        // instance of WebVTT.Parser is attached to the pages window.
        setupParser(self.page, self.options.encoding, onInit);
      });
    });
  });
};

// Shutdown the PhantomJS instance that NodeVTT runs vtt.js on.
NodeVTT.prototype.shutdown = function() {
  if (this.phantom) {
    this.phantom.exit();
    // Set to null so we don't mistakenly think we've been inited somewhere later.
    this.page = null;
    this.phantom = null;
  }
};

// Clears the state of NodeVTT.
NodeVTT.prototype.clear = function(onClear) {
  if(!checkReady(this.ready, onClear)) {
    return;
  }
  this.cues = [];
  this.regions = [];
  setupParser(this.page, this.options.encoding, onClear);
};

// Sets up node-vtt with a new parser, optionally with a new decoder. The type
// parameter should be the encoding of data being passed in. string and utf8 are
// the only ones currently supported. Will clear the state of node-vtt as well.
NodeVTT.prototype.setupParser = function(type, onSetup) {
  if (!checkReady(this.ready, onSetup)) {
    return;
  }
  (typeof type === "function" && (onSetup = type)) || (this.options.encoding = type);
  this.clear(onSetup);
};

// Parse VTT within the context of a PhantomJS page. data can either be a
// string or a utf8 Node ArrayBuffer. The parser on the page must be
// setup first with the correct decoder for either of these by passing the
// encoding of the data into either the init or setupParser public functions.
NodeVTT.prototype.parse = function(data, onParsed) {
  if (!checkReady(this.ready, onParsed)) {
    return;
  }
  this.page.evaluate(function(data) {
    return p.parse(typeof data === "string" ? data : data.toUint8Array());
  }, onParsed, data);
};

// Parse VTT data from a file.
NodeVTT.prototype.parseFile = function(vttFile, onParsed) {
  var data;
  try {
    data = fs.readFileSync(vttFile);
  } catch (error) {
    return onParsed({ message: "Unable to read the file at " + vttFile +
                               ". Error: " + error.message });
  }
  var self = this;
  self.parse(data, function(error) {
    if (error) {
      return onParsed(error);
    }
    self.flush(onParsed);
  });
};

// Flush the parser. This will finish parsing what it has and clear the state of
// the parser.
NodeVTT.prototype.flush = function(onFlush) {
  if (!checkReady(this.ready, onFlush)) {
    return;
  }
  this.page.evaluate(function() {
    return p.flush();
  }, onFlush);
};

// Run the processing model on parsed VTT data. If no data is passed it will
// process the cues and regions that it has in its state.
NodeVTT.prototype.processParsedData = function(data, onProcessed) {
  if (!checkReady(this.ready, onProcessed)) {
    return;
  }

  if (typeof data === "function") {
    onProcessed = data;
    data = null;
  }

  var cues = (data && ("cues" in data)) ? data.cues : this.cues;
  this.page.evaluate(function(cues) {
    cues = cues.map(function(cue) {
      return VTTCue.create(cue);
    });
    var overlay = document.getElementById("overlay");
    WebVTT.processCues(window, cues, overlay);

    var divs = [];
    // The first child of overlay will be the padded overlay div, which we
    // don't want to return, so just take the child nodes of the padded overlay.
    var nodes = (overlay.childNodes && overlay.childNodes[0] &&
                 overlay.childNodes[0].childNodes) || [];
    for (var i = 0, l = nodes.length; i < l; i++) {
      divs.push(filterElement(nodes[i]));
    }

    return divs;
  }, onProcessed, cues);
};

// Run the processing model on parsed VTT data from a file.
NodeVTT.prototype.processFile = function(vttFile, onProcessed) {
  var self = this;
  self.parseFile(vttFile, function(error) {
    if (error) {
      return onProcessed(error);
    }
    self.processParsedData(onProcessed);
  });
};

module.exports = NodeVTT;
