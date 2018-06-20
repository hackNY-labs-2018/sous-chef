'use strict'

const token = process.env.SLACK_API_TOKEN || require('../certs').token
const botkit = require('botkit') // remove this eventually
const config = require('../config')
const storage = require('botkit_myjson_storage')({
  bin_id: config.binId 
})

const reacc_storage = require('botkit_myjson_storage')({
  bin_id: config.reaccBinId 
})

const env = process.env.NODE_ENV || 'development'
const controller = botkit.slackbot(config.dev)
const bot = controller.spawn(Object.assign({ 'token': token }, config.bot))

const replies = {
  confirmation: 'sure dude 😏',
  rejection: 'can u not 🤨'
}

String.prototype.replaceAll = function (find, replace) {
  var str = this;
  return str.replace(new RegExp(find, 'g'), replace);
};

function main() {
  // fyi: apparently node + botkit does not break on undefined errors.
  // consider removing botkit or switching to python.
  // how is botkit doing this?????? botkit is garbage and so is node
  bot.startRTM()

  controller.hears(['food'], ['ambient'], (bot, event) => {
  	bot.reply(event, 'im hungry')
  })

  controller.hears(['react with'], ['direct_mention'], (bot, message) => {
    const msgText = message.text;

    if (!msgText.includes('to')) {
      return bot.reply(message, replies.rejection)
    }

    let [response, trigger] = msgText.split('react with')[1].split('to').map(s => s.trim());

    console.log('trigger:', trigger);
    console.log('response:', response);

    response = response.replaceAll(':', '');

    reacc_storage.items.save({
      trigger: trigger,
      response: response, 
      author: message.user,
      timestamp: message.ts,
    });

    
    bindReacc(trigger, response)
    bot.reply(message, replies.confirmation)
  })

  loadAllReaccs()
  
  controller.hears(['if i say'], ['direct_mention'], (bot, message) => {
    const msgText = message.text;

    if (!msgText.includes('you say')) {
      return bot.reply(message, replies.rejection) 
    }

    const [trigger, response] = msgText.split('if i say')[1].split('you say').map(s => s.trim());

    storage.items.save({
      trigger: trigger,
      response: response, 
      author: message.user,
      timestamp: message.ts,
    })

    if (trigger.includes(" ") || trigger.length >= 5) {
      bindCommand(trigger, response)
      bot.reply(message, replies.confirmation)
    }
    else {
      bot.reply(message, 'u can do better than that lol')
    }
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

function bindReacc(trigger, response) {
  controller.hears([trigger], ['direct_mention', 'ambient'], (bot, message) => {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: response,
    }, function(err, res) {
      if (err) {
          bot.botkit.log('Failed to add emoji reaction :(', err);
      }
    });
  })
}

function loadAllCommands() {
  if (storage.items) {
    storage.items.all((err, commands) => {
      commands = commands.reverse()
      commands.forEach(command => {
        bindCommand(command.trigger, command.response)
      })
    })
  }
}

function loadAllReaccs() {
  if (reacc_storage.items) {
    reacc_storage.items.all((err, reaccs) => {
      reaccs = reaccs.reverse()
      reaccs.forEach(reacc => {
        bindReacc(reacc.trigger, reacc.response)
      })
    });
  }
}

main()
