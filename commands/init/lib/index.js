"use strict";

function init(projectName, cmdObj) {
  // console.log(projectName, cmdObj.force, cmdObj.parent.opts().targetPath);
  console.log(projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
}

module.exports = init;
