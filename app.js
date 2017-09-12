'use strict'

// Requirement
const Koa = require('koa')
const chalk = require('chalk')
const log = require('fancy-log')
const koaBody = require('koa-body')
const Router = require('koa-router')

const Streamer = require('fanfou-streamer')
const APN = require('./utils/apn')

const {
  PORT,
  CONSUMER_KEY,
  CONSUMER_SECRET
} = require('./config')

// Clients
process.clients = {}

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
      APN.send(`@${res.source.screen_name} 提到了你 ${res.object.text}`, deviceToken)
    })

    // Reply
    process.clients[id].streamer.on('message.reply', res => {
      log('reply event')
      APN.send(`@${res.source.screen_name} 回复了你 ${res.object.text}`, deviceToken)
    })

    // Repost
    process.clients[id].streamer.on('message.repost', res => {
      log('repost event')
      APN.send(`@${res.source.screen_name} 转发了 ${res.object.text}`, deviceToken)
    })

    // Add fav
    process.clients[id].streamer.on('fav.create', res => {
      log('add-fav event')
      APN.send(`@${res.source.screen_name} 收藏了 ${res.object.text}`, deviceToken)
    })

    // Del fav
    process.clients[id].streamer.on('fav.delete', res => {
      log('del-fav event')
      APN.send(`@${res.source.screen_name} 取消收藏了 ${res.object.text}`, deviceToken)
    })

    ctx.body = 'on'
  }
})

router.post('/notifier/off', koaBody(), async (ctx, next) => {
  const deviceToken = ctx.request.body.device_token
  const oauthToken = ctx.request.body.oauth_token
  const id = `${deviceToken}${oauthToken}`

  if (!(deviceToken && oauthToken)) ctx.body = 'invalid'
  else if (process.clients[id] && process.clients[id].streamer && process.clients.streamer.isStreaming) {
    process.clients[id].streamer.stop()
    delete process.clients[id]
    ctx.body = 'off'
  } else ctx.body = 'off'
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
