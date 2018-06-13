const botkit = require('botkit')
const config = require('../config')
const certs = require('../certs')

function main() {
  const env = process.env.NODE_ENV || 'development'
  const controller = botkit.slackbot(config.dev)
  const bot = controller.spawn(Object.assign({ token: certs.token }, config.bot))
  bot.startRTM()

  controller.hears(['food'], ['ambient'], (bot, event) => {
  	bot.reply(event, 'im hungry')
  })

  controller.on(['bot_channel_join', 'direct_mention'], (bot, event) => {
  	bot.reply(event, 'hey gang')
  })
}

main()
