"use strict";

const path = require("path")
const semver = require("semver")
const colors = require('colors/safe')
const userHome = require("user-home")
const pathExists = require("path-exists").sync
const log = require('@weijia-cli/log')
const constant = require('./const')
const pkg = require('../package.json')



async function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    // log.verbose('debug', 'test debug log')
    checkEnv()
    await checkGlobalUpdate()
  } catch (e) {
    log.error(e.message)
  }
}

function checkPkgVersion() {
  log.notice('当前脚手架版本号', pkg.version)
}

function checkNodeVersion() {
  // 获取当前 Node 版本号
  const currentVersion = process.version
  log.notice('当前 Node 版本号', currentVersion)
  // 比对最低版本号
  const lowsetVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowsetVersion)) {
    throw new Error(colors.red(`weijia-cli 需要安装 v${lowsetVersion} 或以上版本的 Node.js`))
  }
}

// 如果是超级用户，将降级为普通用户，保证体验的一致性
function checkRoot() {
  const p = import('root-check')
  p.then((rootCheck) => {
    rootCheck?.default()
  })
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在'))
  }
}

let args

function checkInputArgs() {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  // 2. 调用 npm API，获取所有版本号
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号
  // 4. 获取最新的版本号，提示用户更新到该版本
  const currentVersion = pkg.version
  const npmName = pkg.name
  const {
    getNpmSemverVersions
  } = require('@weijia-cli/get-npm-info')
  const lastVersion = await getNpmSemverVersions(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn('更新提示信息', colors.yellow(`请手动更新 ${npmName}, 当前版本: ${currentVersion}, 最新版本: ${lastVersion}, 更新命令: npm install -g ${npmName}`))
  }
}

module.exports = core