'use strict'

// Requirement
const Koa = require('koa')
const chalk = require('chalk')
const Router = require('koa-router')
const koaBody = require('koa-body')
const Streamer = require('./utils/streamer')
const APN = require('./utils/apn')

// Clients
process.clients = {}

// Koa
const app = new Koa()
const router = new Router()

// Router
router.post('/notifier/off', async (ctx, next) => {
  // const deviceToken = ctx.request.body.device_token
  // const oauthToken = ctx.request.body.oauth_token
})

router.post('/notifier/on', koaBody(), async (ctx, next) => {
  const deviceToken = ctx.request.body.device_token
  const oauthToken = ctx.request.body.oauth_token
  const oauthTokenSecret = ctx.request.body.oauth_token_secret

  // Validate
  if (!(deviceToken && oauthToken && oauthTokenSecret)) ctx.body = 'invalid'

  else if (process.clients[`${deviceToken}${oauthToken}`]) ctx.body = 'on'

  else {
    const streamer = new Streamer({oauthToken, oauthTokenSecret})
    streamer.deviceToken = deviceToken

    // Mentions
    streamer.on('mention', res => {
      APN.send(`@${res.by} 提到了你`, deviceToken)
    })

    // Reply
    streamer.on('reply', res => {
      APN.send(`@${res.by} 回复了你`, deviceToken)
    })

    streamer.on('connected', () => [
    ])

    streamer.on('close', () => {
    })

    streamer.on('err', () => {
    })

    console.log(streamer)
    ctx.body = 'on'
  }
})

router.get('/notifier/check', async (ctx, next) => {
  const deviceToken = ctx.query.device_token
  const oauthToken = ctx.query.oauth_token

  if (!(deviceToken && oauthToken)) ctx.body = 'invalid'

  else if (process.clients[`${deviceToken}${oauthToken}`]) ctx.body = 'on'

  else ctx.body = 'off'
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)

// Log
console.log(chalk.green('Maofan notifier startup, listening on 3000'))
