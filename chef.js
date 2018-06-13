const botkit = require('botkit')
const config = require('./config')
const certs = require('./certs')

function main() {
  const env = process.env.NODE_ENV || 'development'
  const controller = botkit.slackbot(config.dev)
  const bot = controller.spawn(Object.assign({ token: certs.token }, config.bot))
}

main()
