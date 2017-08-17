'use strict'

// Requirement
const Koa = require('koa')
const chalk = require('chalk')
const log = require('fancy-log')
const koaBody = require('koa-body')
const Router = require('koa-router')
const symbols = require('log-symbols')
const schedule = require('node-schedule')

const Streamer = require('./utils/streamer')
const APN = require('./utils/apn')

const {PORT} = require('./config')

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
    process.clients[id].streamer = new Streamer({oauthToken, oauthTokenSecret})
    process.clients[id].streamer.deviceToken = deviceToken
    process.clients[id].user = {
      deviceToken,
      oauthToken,
      oauthTokenSecret
    }

    // Mentions
    process.clients[id].streamer.on('mention', res => {
      log('mention event')
      APN.send(`@${res.by} 提到了你 ${res.status.text}`, deviceToken)
    })

    // Reply
    process.clients[id].streamer.on('reply', res => {
      log('reply event')
      APN.send(`@${res.by} 回复了你 ${res.status.text}`, deviceToken)
    })

    // Add fav
    process.clients[id].streamer.on('add-fav', res => {
      log('add-fav event')
      APN.send(`@${res.by} 收藏了 ${res.status.text}`, deviceToken)
    })

    // Del fav
    process.clients[id].streamer.on('del-fav', res => {
      log('del-fav event')
      APN.send(`@${res.by} 取消收藏了 ${res.status.text}`, deviceToken)
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
  else if (process.clients[id] && process.clients[id].streamer && process.clients.streamer.isStreaming) {
    process.clients[id].streamer.renew()
    ctx.body = 'on'
  } else ctx.body = 'off'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(PORT)

// Log
log(chalk.green(`Maofan notifier startup, listening on ${PORT}`))

// Schedule - Check every minute
process.job1 = schedule.scheduleJob('* * * * *', () => {
  for (let key in process.clients) {
    const client = process.clients[key]
    if (client.streamer.isStreaming) {
      log(` ${symbols.success} ${client.streamer.id} is streaming`)
    } else {
      log(` ${symbols.error} ${client.streamer.id} is not streaming`)
    }
  }
})

process.job2 = schedule.scheduleJob('*/15 * * * *', () => {
  for (let key in process.clients) {
    const client = process.clients[key]
    const {deviceToken} = client.streamer
    if (client.streamer.isStreaming) {
      APN.send('[测试消息] Streaming 正常', deviceToken)
    } else {
      APN.send('[测试消息] Streaming 断开', deviceToken)
    }
  }
})
