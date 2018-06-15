# botkit_myjson_storage

Use myjson.com to store data for your BotKit bot. 

## Usage

To use this, first add it to your project by doing

`npm install --save botkit_myjson_storage` or `yarn add botkit_myjson_store`

Once it's installed, go to myjson.com and enter and save `[]`. In the URL you'll be directed to, copy the bin ID. For example, the bin ID for `http://myjson.com/mAy5q` would be `mAy5q`.

Use it as demonstrated by the following example:

```
var yourController = Botkit.slackbot({
  storage: require('botkit_myjson_storage')({
    bin_id: 'THE_BIN_ID'
  })
})
```

From there, you should be able to use [Botkit's documented storage functionality](https://botkit.ai/docs/storage.html)!

If you're actually going to end up using this for something fairly active -- and don't wanna overload/overtrust http://myjson.com, you can feel free to self-host an API that follows [their specifications](http://myjson.com/api) exactly, and then specify that you've done so by using it like:

```
var yourController = Botkit.slackbot({
  storage: require('botkit_myjson_storage')({
    endpoint: 'http://api.mycustomendpoint.com',
    bin_id: 'THE_BIN_ID'
  })
})
```

## Contribution

Pull requests welcome! Just make sure it passes the tests prescribed by Botkit by running `npm run test` or `yarn run test`.

