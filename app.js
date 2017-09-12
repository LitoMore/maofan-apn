'use strict'

// Requirement
const Koa = require('koa')
const chalk = require('chalk')
const log = require('fancy-log')
const koaBody = require('koa-body')
const Router = require('koa-router')
const mongoose = require('mongoose')

const Streamer = require('fanfou-streamer')
const APN = require('./utils/apn')
const ClientModel = require('./models/client')

const config = require('./config')
const {
  PORT,
  CONSUMER_KEY,
  CONSUMER_SECRET
} = config

// =========================
// Database connection
// =========================
const database = `mongodb://${config.DB.HOST}:${config.DB.PORT}/${config.DB.DATABASE}`
let connOptions = {
  useMongoClient: true
}
// Attach user and pass info if present to operate on the secured collection
if (config.DB.USER && config.DB.PASS) {
  connOptions.user = config.DB.USER
  connOptions.pass = config.DB.PASS
}

mongoose.connect(database, connOptions)
mongoose.connection.on('connected', () => {
  console.log(`Database connected to ${database}`)
})
mongoose.connection.on('error', (err) => {
  console.log(`Database connection to ${database} error: ${err}`)
})
mongoose.connection.on('disconnected', () => {
  console.log(`Database disconnected from ${database}`)
})
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log(`Database disconnected from ${database} due to server app termination`)
    process.exit(0)
  })
})

// Clients
process.clients = {}

function createStreamer (id, deviceToken, oauthToken, oauthTokenSecret) {
  process.clients[id] = {}
  process.clients[id].streamer = new Streamer({
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET,
    oauthToken,
    oauthTokenSecret
  })
  process.clients[id].streamer.start()
  process.clients[id].user = {
    deviceToken,
    oauthToken,
    oauthTokenSecret
  }

  // Mentions
  process.clients[id].streamer.on('message.mention', res => {
    log('mention event')
    APN.send(`@${res.source.screen_name} 提到了你：\n${res.object.text}`, deviceToken)
  })

  // Reply
  process.clients[id].streamer.on('message.reply', res => {
    log('reply event')
    APN.send(`@${res.source.screen_name} 回复了你：\n${res.object.text}`, deviceToken)
  })

  // Repost
  process.clients[id].streamer.on('message.repost', res => {
    log('repost event')
    APN.send(`@${res.source.screen_name} 转发了：\n${res.object.text}`, deviceToken)
  })

  // Add fav
  process.clients[id].streamer.on('fav.create', res => {
    log('add-fav event')
    APN.send(`@${res.source.screen_name} 收藏了：\n${res.object.text}`, deviceToken)
  })

  // Del fav
  process.clients[id].streamer.on('fav.delete', res => {
    log('del-fav event')
    APN.send(`@${res.source.screen_name} 取消收藏了：\n${res.object.text}`, deviceToken)
  })
}

// Restore all existing states from DB
(async function restoreClients () {
  let result
  try {
    result = await ClientModel.find()
  } catch (err) {
    log(`Failed to find client states from DB: ${err.toString()}`)
  }
  if (!Array.isArray(result)) return false
  for (let client of result) {
    createStreamer(
      client.clientId,
      client.deviceToken,
      client.oauthToken,
      client.oauthTokenSecret
    )
  }
})()

// Koa
const app = new Koa()
const router = new Router()

// Router
router.post('/notifier/on', koaBody(), async (ctx, next) => {
  log('POST /notifier/on')
  const deviceToken = ctx.request.body.device_token
  const oauthToken = ctx.request.body.oauth_token
  const oauthTokenSecret = ctx.request.body.oauth_token_secret
  const id = `${deviceToken}${oauthToken}`

  // Validate
  if (!(deviceToken && oauthToken && oauthTokenSecret)) {
    log('invalid parameters')
    ctx.body = 'invalid'
  } else if (process.clients[id] && process.clients[id].streamer && process.clients[id].streamer.isStreaming) {
    log('streamer already on')
    ctx.body = 'on'
  } else {
    log('create streamer')
    // Save the client to DB
    const dbParams = {
      clientId: id,
      deviceToken,
      oauthToken,
      oauthTokenSecret
    }
    const dbHandle = new ClientModel(dbParams)
    try {
      await dbHandle.save()
    } catch (err) {
      log(`Failed to save Client state to DB: ${err.toString()}`)
    }
    // Start a streamer
    createStreamer(id, deviceToken, oauthToken, oauthTokenSecret)

    ctx.body = 'on'
  }
})

router.post('/notifier/off', koaBody(), async (ctx, next) => {
  const deviceToken = ctx.request.body.device_token
  const oauthToken = ctx.request.body.oauth_token
  const id = `${deviceToken}${oauthToken}`

  if (!(deviceToken && oauthToken)) ctx.body = 'invalid'
  else if (process.clients[id] && process.clients[id].streamer && process.clients[id].streamer.isStreaming) {
    process.clients[id].streamer.stop()
    delete process.clients[id]
    ctx.body = 'off'
  } else ctx.body = 'off'
  // Remove the client from DB
  await ClientModel.deleteByClientId(id)
})

router.get('/notifier/check', async (ctx, next) => {
  const deviceToken = ctx.query.device_token
  const oauthToken = ctx.query.oauth_token
  const id = `${deviceToken}${oauthToken}`

  if (!(deviceToken && oauthToken)) ctx.body = 'invalid'
  else if (process.clients[id] && process.clients[id].streamer) {
    if (!process.clients.streamer.isStreaming) {
      process.clients[id].streamer._start()
    }
    ctx.body = 'on'
  } else ctx.body = 'off'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(PORT)

// Log
log(chalk.green(`Maofan notifier startup, listening on ${PORT}`))
