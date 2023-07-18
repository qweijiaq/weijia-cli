"use strict";

const path = require("path");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const log = require("@weijia-cli/log");
const constant = require("./const");
const pkg = require("../package.json");
const commander = require("commander");
const init = require("@weijia-cli/init");
const exec = require("@weijia-cli/exec");

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (process.env.NODE_ENV === "verbose") {
      console.log(e);
    }
  }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

function checkPkgVersion() {
  log.notice("当前脚手架版本号", pkg.version);
}

function checkNodeVersion() {
  // 获取当前 Node 版本号
  const currentVersion = process.version;
  log.notice("当前 Node 版本号", currentVersion);
  // 比对最低版本号
  const lowsetVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowsetVersion)) {
    throw new Error(
      colors.red(`weijia-cli 需要安装 v${lowsetVersion} 或以上版本的 Node.js`)
    );
  }
}

// 如果是超级用户，将降级为普通用户，保证体验的一致性
function checkRoot() {
  const p = import("root-check");
  p.then((rootCheck) => {
    rootCheck?.default();
  });
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在"));
  }
}

function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  // 2. 调用 npm API，获取所有版本号
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号
  // 4. 获取最新的版本号，提示用户更新到该版本
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersions } = require("@weijia-cli/get-npm-info");
  const lastVersion = await getNpmSemverVersions(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      "更新提示信息",
      colors.yellow(
        `请手动更新 ${npmName}, 当前版本: ${currentVersion}, 最新版本: ${lastVersion}, 更新命令: npm install -g ${npmName}`
      )
    );
  }
}

const program = new commander.Command();
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  program
    .command("init [projectName]")
    .option("-f, --force", "是否强制初始化项目")
    .action(exec);

  program.on("option:debug", () => {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
  });

  program.on("option:targetPath", () => {
    process.env.CLI_TARGET_PATH = program.opts().targetPath; // 环境变量实现解耦
  });

  // 对未知命令进行监听
  program.on("command:*", (obj) => {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.error(colors.red("未知的命令: " + obj[0]));
    if (availableCommands.length > 0) {
      log.info(colors.red("可用命令:" + availableCommands.join(", ")));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

module.exports = core;
