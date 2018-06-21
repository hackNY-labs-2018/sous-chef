'use strict'

const token = process.env.SLACK_API_TOKEN || require('../certs').token
const botkit = require('botkit') // remove this eventually
const config = require('../config')
const request = require('request-promise')
const storage = require('botkit_myjson_storage')({
  bin_id: config.binId 
})

const reacc_storage = require('botkit_myjson_storage')({
  bin_id: config.reaccBinId 
})

const api_storage = require('botkit_myjson_storage')({
  bin_id: config.apiBinId 
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

function resolve(path, obj) { // https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
  return path.split('.').reduce(function(prev, curr) {
      return prev ? prev[curr] : undefined
  }, obj || self)
}


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

  loadAll(reacc_storage, bindReacc)
  
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

  loadAll(storage, bindCommand)

  controller.hears(['if i ask'], ['direct_mention'], (bot, message) => {
    const msgText = message.text;

    if (!msgText.includes('you get')) {
      return bot.reply(message, replies.rejection) 
    }

    const [trigger, response] = msgText.split('if i ask')[1].split('you get').map(s => s.trim());

    let response_url, keysStr;

    if (response.includes('at')) {
      [response_url, keysStr] = response.split('at').map(s => s.trim())
    } else {
      response_url = response
      keysStr = 0
    }

    // eg: response = 'http://hackny.org/thing.json at a.b.c'
    // response_url = 'http://hackny.org/thing.json'
    // keysStr = 'a.b.c'

    api_storage.items.save({
      trigger: trigger,
      response_url: response_url,
      keysStr: keysStr || 0,
      author: message.user,
      timestamp: message.ts,
    })

    if (trigger.includes(" ") || trigger.length >= 5) {
      bindQuery(trigger, response_url, keysStr)
      bot.reply(message, replies.confirmation)
    }
    else {
      bot.reply(message, 'u can do better than that lol')
    }
  })

  loadQueries(api_storage, bindQuery)
}

function bindQuery(trigger, response_url, keysStr) {
  controller.hears([trigger], ['direct_mention', 'ambient'], (bot, message) => {
    console.log('heard: '+trigger)
    const urlToReq = response_url.replace('&amp;', '&').replace('<','').replace('>', '')
    console.log(`requesting ${urlToReq}`)
    request.get(urlToReq)
      .then(response => {
        console.log('got a response')
        console.log(response)
        if (keysStr) {
          if (typeof response != 'object') {
            response = JSON.parse(response)
          }
          const answer = JSON.stringify(resolve(keysStr, response))
          console.log('answer:',answer)
          bot.reply(message, answer)
        } else {
          bot.reply(message, JSON.stringify(response))
        }
      })
      .catch(err => {
        console.log(err)
        bot.reply(message, 'the ay pee eye didnt give me the yum yums :(((((((')
      })
  })
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

function loadAll(store, bindfunc) {
  if (store.items) {
    store.items.all((err, entries) => {
      entries = entries.reverse()
      entries.forEach(entry => {
        bindfunc(entry.trigger, entry.response)
      })
    })
  }
}

function loadQueries(store, bindfunc) {
  if (store.items) {
    store.items.all((err, entries) => {
      entries = entries.reverse()
      entries.forEach(entry => {
        bindQuery(entry.trigger, entry.response_url, entry.keysStr)
      });
    })
  }
}

main()
