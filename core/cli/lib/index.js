"use strict";

module.exports = core;

const pkg = require('../package.json')

function core() {

}

function checkPkgVersion() {
  console.log(pkg.version)
}