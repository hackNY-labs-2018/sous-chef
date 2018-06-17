const botkit = require('botkit')
const config = require('../config')
const certs = require('../certs')
const storage = require('botkit_myjson_storage')({
  bin_id: config.binId 
})


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
  
  controller.hears(['if i say'], ['direct_mention'], (bot, message) => {
    const msgText = message.text;

    if (!msgText.includes('you say')) {
      return bot.reply(message, 'can u not ☹️')
    }

    const [trigger, response] = msgText.split('if i say')[1].split('you say').map(s => s.trim());

    storage.items.save({
      trigger: trigger,
      response: response, 
      id: `${message.user}--${message.ts}`,
    })

    bot.reply(message, 'aight 😏')
  })

  if (storage.items) {
    storage.items.all((err, commands) => {
      commands.forEach(command => {
        controller.hears([command.trigger], (bot, message) => {
          bot.reply(message, command.response)
        })
      })
    })
  }
}

main()
