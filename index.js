'use strict'

// Requirement
const Koa = require('koa')
const chalk = require('chalk')
const Router = require('koa-router')
const koaBody = require('koa-body')
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
  const deviceToken = ctx.request.body.device_token
  const oauthToken = ctx.request.body.oauth_token
  const oauthTokenSecret = ctx.request.body.oauth_token_secret
  const id = `${deviceToken}${oauthToken}`

  // Validate
  if (!(deviceToken && oauthToken && oauthTokenSecret)) ctx.body = 'invalid'
  else if (process.clients[id] && process.clients[id].streamer) ctx.body = 'on'
  else {
    process.clients[id] = {}
    process.clients[id].streamer = new Streamer({oauthToken, oauthTokenSecret})
    process.clients[id].streamer.deviceToken = deviceToken

    // Mentions
    process.clients[id].streamer.on('mention', res => {
      APN.send(`@${res.by} 提到了你 ${res.status.text}`, deviceToken)
    })

    // Reply
    process.clients[id].streamer.on('reply', res => {
      APN.send(`@${res.by} 回复了你 ${res.status.text}`, deviceToken)
    })

    // Add fav
    process.clients[id].streamer.on('add-fav', res => {
      APN.send(`@${res.by} 收藏了 ${res.status.text}`, deviceToken)
    })

    // Del fav
    process.clients[id].streamer.on('del-fav', res => {
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
  else if (process.clients[id] && process.clients[id].streamer) {
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
    process.clients[id].streamer.renew()
    ctx.body = 'on'
  } else ctx.body = 'off'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(PORT)

// Log
console.log(chalk.green(`Maofan notifier startup, listening on ${PORT}`))
