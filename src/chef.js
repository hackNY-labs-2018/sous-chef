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
  
  controller.hears(['if i say'], (bot, message) => {
    const msgText = message.text;

    if (!msgText.includes('you say')) {
      return bot.reply(message, 'can u not ☹️')
    }

    const trigger = msgText.split('if i say')[1].split('you say')[0].trim()
    const response = msgText.split('if i say')[1].split('you say')[1].trim()

    controller.storage.commands.save({
      trigger: trigger,
      response: response, 
      id: `${message.user}--${message.ts}`,
    })

    bot.reply(message, 'aight 😏')
  })

  if (controller.storage.commands) {
    controller.storage.commands.all((err, commands) => {
      commands.forEach(command => {
        controller.hears([command.trigger], (bot, message) => {
          bot.reply(message, command.response)
        })
      })
    })
  }
}

main()