'use strict'

const token = process.env.SLACK_API_TOKEN || require('../certs').token
const botkit = require('botkit') // remove this eventually
const config = require('../config')
const storage = require('botkit_myjson_storage')({
  bin_id: config.binId 
})

const env = process.env.NODE_ENV || 'development'
const controller = botkit.slackbot(config.dev)
const bot = controller.spawn(Object.assign({ 'token': token }, config.bot))

function main() {
  // fyi: apparently node + botkit does not break on undefined errors.
  // consider removing botkit or switching to python.
  // how is botkit doing this?????? botkit is garbage and so is node
  bot.startRTM()

  controller.hears(['food'], ['ambient'], (bot, event) => {
  	bot.reply(event, 'im hungry')
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
      author: message.user,
      timestamp: message.ts,
    })

    bot.reply(message, 'aight 😏')
    bindCommand(trigger, response)
  })

  loadAllCommands()
}

function bindCommand(trigger, response) {
  console.log(trigger, response)
  console.log('hey: ' + (typeof controller))

  controller.hears([trigger], ['direct_mention', 'ambient'], (bot, message) => {
    console.log('heard: '+trigger)
    bot.reply(message, response)
  })
}

function loadAllCommands() {
    if (storage.items) {
    storage.items.all((err, commands) => {
      commands.forEach(command => {
        bindCommand(command.trigger, command.response)
      })
    })
  }
}

main()
