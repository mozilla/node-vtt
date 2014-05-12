/**
 * Copyright 2013 node-vtt Contributors
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

var assert = Object.create(require("assert")),
    path = require("path"),
    fs = require("fs"),
    vttFile = path.join(__dirname, "/basic.vtt"),
    NodeVTT = require("../lib/node-vtt.js"),
    nodeVTT = new NodeVTT();

describe("basic tests", function(){

  before(function(onDone) {
    nodeVTT.init(onDone);
  });

  after(function() {
    nodeVTT.shutdown();
  });

  it("api", function() {
    ( "cues regions errors ready vtt phantom " +
      "flush clear parse parseFile processFile " + 
      "processParsedData" ).split(" ").forEach(function(key) {
        assert.ok(key in nodeVTT, "NodeVTT should have the " + key + " property.");
      });
  });

  it("parse", function(onDone) {
    var vtt = fs.readFileSync(vttFile);
    nodeVTT.parse(vtt, function(error) {
      assert.ok(!error, "parse should succeed.");
      assert.equal(nodeVTT.cues.length, 2, "We should have one cue.");
      assert.equal(nodeVTT.regions.length, 1, "We should have one region.");
      assert.equal(nodeVTT.errors.length, 1, "We should have one error.");
      onDone();
    });
  });

  it("flush", function(onDone) {
    nodeVTT.flush(function(error) {
      assert.ok(!error, "flush should succeed.");
      assert.equal(nodeVTT.cues.length, 2, "We should have two cues.");
      assert.equal(nodeVTT.regions.length, 1, "We should have one region.");
      assert.equal(nodeVTT.errors.length, 1, "We should have one error.");
      onDone();
    });
  })

  it("processParsedData", function(onDone) {
    nodeVTT.processParsedData(function(error, data) {
      assert.ok(!error, "processParsedData should succeed.");
      assert.ok(data.length, 2, "Two elements should have been returned.");
      onDone();
    });
  });

  it("clear", function(onDone) {
    nodeVTT.clear(function(error) {
      assert.ok(!error, "clear should succeed.");
      assert.equal(nodeVTT.cues.length, 0, "We should have zero cues.");
      assert.equal(nodeVTT.regions.length, 0, "We should have zero regions.");
      assert.equal(nodeVTT.errors.length, 0, "We should have zero errors.");
      onDone();
    });
  });

  it("parseFile", function(onDone) {
    nodeVTT.parseFile(vttFile, function(error) {
      assert.ok(!error, "parseFile should succeed.");
      assert.equal(nodeVTT.cues.length, 2, "We should have two cues.");
      assert.equal(nodeVTT.regions.length, 1, "We should have one region.");
      assert.equal(nodeVTT.errors.length, 1, "We should have one error.");
      onDone();
    });
  });

  it("second clear", function(onDone) {
    nodeVTT.clear(function(error) {
      assert.ok(!error, "clear should succeed.");
      assert.equal(nodeVTT.cues.length, 0, "We should have zero cues.");
      assert.equal(nodeVTT.regions.length, 0, "We should have zero regions.");
      assert.equal(nodeVTT.errors.length, 0, "We should have zero errors.");
      onDone();
    });
  });

  it("processFile", function(onDone) {
    nodeVTT.processFile(vttFile, function(error, data) {
      assert.ok(!error, "processFile should succeed.");
      assert.ok(data.length, 2, "Two elements should have been returned.");
      onDone();
    });
  });

  it("setupParser", function(onDone) {
    nodeVTT.setupParser("string", function(error) {
      assert.ok(!error, "setupParser should succeed.");
      assert.equal(nodeVTT.cues.length, 0, "We should have zero cues.");
      assert.equal(nodeVTT.regions.length, 0, "We should have zero regions.");
      assert.equal(nodeVTT.errors.length, 0, "We should have zero errors.");
      onDone();
    })
  });

  it("parse string data", function(onDone) {
    var vtt = fs.readFileSync(vttFile, { encoding: "utf8" });
    nodeVTT.parse(vtt, function(error) {
      assert.ok(!error, "parsing string data should succeed.");
      assert.equal(nodeVTT.cues.length, 2, "We should have one cue.");
      assert.equal(nodeVTT.regions.length, 1, "We should have one region.");
      assert.equal(nodeVTT.errors.length, 1, "We should have one error.");
      onDone();
    });
  });

});
