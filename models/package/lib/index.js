"use strict";

const path = require("path");
const { isObject } = require("@weijia-cli/utils");
const formatPath = require("@weijia-cli/format-path");
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const { getDefaultRegistry } = require("@weijia-cli/get-npm-info");

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package 类的 options 参数不能为空");
    }
    if (!isObject(options)) {
      throw new Error("Package 类的 options 参数必须是对象");
    }
    // package 的路径
    this.targetPath = options.targetPath;
    // package 的缓存路径
    this.storeDir = options.storeDir;
    // package 的 name
    this.packageName = options.packageName;
    // package 的 version
    this.packageVersion = options.packageVersion;
  }

  //  判断当前 Package 是否存在
  exists() {}

  // 安装 Package
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }

  // 更新 Package
  update() {}

  // 获取入口文件的路径
  getRootFilePath() {
    // 1. 获取 package.json 所在目录 -- pkg-dir
    const dir = pkgDir(this.targetPath);
    console.log(dir);
    if (dir) {
      // 2. 读取 package.json -- require()
      const pkgFile = require(path.resolve(dir, "package.json"));
      // 3. 寻找 main / lib
      if (pkgFile && pkgFile.main) {
        // 4. 路径的兼容 Mac / Windows
        return formatPath(path.resolve(dir, pkgFile.main));
      }
    }
    return null;
  }
}

module.exports = Package;
