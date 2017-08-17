'use strict'

const {EventEmitter} = require('events')
const Fanfou = require('fanfou-sdk')
const log = require('fancy-log')

const {
  CONSUMER_KEY,
  CONSUMER_SECRET
} = require('../config')

class Streamer extends EventEmitter {
  constructor (tokens) {
    super()
    tokens = tokens || {}
    this.isStreaming = false
    this.oauthToken = tokens.oauthToken
    this.oauthTokenSecret = tokens.oauthTokenSecret
    this._init()
  }

  _init () {
    this.ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      oauth_token: this.oauthToken,
      oauth_token_secret: this.oauthTokenSecret
    })
    this.ff.get('/account/verify_credentials', {}, (err, res) => {
      if (err) log(err)
      else {
        this.id = res.id
        this.proto = this.ff.stream()
        if (this.ff.is_streaming) this.isStreaming = true
        this._reg()
      }
    })
  }

  _reg () {
    this.proto.on('close', () => {
      this.isStreaming = false
      this.emit('close')
    })

    this.proto.on('message', data => {
      if (data.is_mentioned && this.id !== data.source.id) {
        this.emit('mention', {
          by: data.mentioned_by,
          status: data.object
        })
      }

      if (data.is_replied && this.id !== data.source.id) {
        this.emit('reply', {
          by: data.replied_by,
          status: data.object
        })
      }
    })

    this.proto.on('fav', data => {
      if (data.action === 'create') {
        this.emit('add-fav', {
          by: data.source.name,
          status: data.object
        })
      }
      if (data.action === 'delete') {
        this.emit('del-fav', {
          by: data.source.name,
          status: data.object
        })
      }
    })

    this.proto.on('error', data => {
      this.isStreaming = false
      log(this.id, 'error')
    })

    this.proto.on('close', data => {
      this.isStreaming = false
      log(this.id, 'streaming closed')
    })
  }

  renew () {
    this._init()
  }

  stop () {
    this.proto.stop()
    log(this.id, 'stop')
  }
}

module.exports = Streamer
