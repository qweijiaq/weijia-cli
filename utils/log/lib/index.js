'use strict'

const log = require('npmlog')

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info' // 判断 debug 模式

log.heading = 'weijia-cli' // 修改前缀
log.headingStyle = { // 修改前缀样式
  fg: 'blue',
  bold: true
}

log.addLevel('success', 2000, { // 添加自定义命令
  fg: 'green',
  bold: true
})

module.exports = log