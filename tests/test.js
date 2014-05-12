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

var expect = require("chai").expect,
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
        expect(nodeVTT).to.have.property(key);
      });
  });

  it("parse", function(onDone) {
    var vtt = fs.readFileSync(vttFile);
    nodeVTT.parse(vtt, function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(2);
      expect(nodeVTT.regions).to.have.length(1);
      expect(nodeVTT.errors).to.have.length(1);
      onDone();
    });
  });

  it("flush", function(onDone) {
    nodeVTT.flush(function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(2);
      expect(nodeVTT.regions).to.have.length(1);
      expect(nodeVTT.errors).to.have.length(1);
      onDone();
    });
  })

  it("processParsedData", function(onDone) {
    nodeVTT.processParsedData(function(error, data) {
      expect(error).to.not.exist;
      expect(data).to.have.length(2);
      onDone();
    });
  });

  it("clear", function(onDone) {
    nodeVTT.clear(function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(0);
      expect(nodeVTT.regions).to.have.length(0);
      expect(nodeVTT.errors).to.have.length(0);
      onDone();
    });
  });

  it("parseFile", function(onDone) {
    nodeVTT.parseFile(vttFile, function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(2);
      expect(nodeVTT.regions).to.have.length(1);
      expect(nodeVTT.errors).to.have.length(1);
      onDone();
    });
  });

  it("second clear", function(onDone) {
    nodeVTT.clear(function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(0);
      expect(nodeVTT.regions).to.have.length(0);
      expect(nodeVTT.errors).to.have.length(0);
      onDone();
    });
  });

  it("processFile", function(onDone) {
    nodeVTT.processFile(vttFile, function(error, data) {
      expect(error).to.not.exist;
      expect(data).to.have.length(2);
      onDone();
    });
  });

  it("setupParser", function(onDone) {
    nodeVTT.setupParser("string", function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(0);
      expect(nodeVTT.regions).to.have.length(0);
      expect(nodeVTT.errors).to.have.length(0);
      onDone();
    })
  });

  it("parse string data", function(onDone) {
    var vtt = fs.readFileSync(vttFile, { encoding: "utf8" });
    nodeVTT.parse(vtt, function(error) {
      expect(error).to.not.exist;
      expect(nodeVTT.cues).to.have.length(2);
      expect(nodeVTT.regions).to.have.length(1);
      expect(nodeVTT.errors).to.have.length(1);
      onDone();
    });
  });

});
