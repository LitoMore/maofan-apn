'use strict'

const apn = require('apn')
const log = require('fancy-log')
const symbols = require('log-symbols')

const {
  KEY_ID,
  TEAM_ID
} = require('../config')

const APN = {}

const options = {
  token: {
    key: 'apn_cert/key.p8',
    keyId: KEY_ID,
    teamId: TEAM_ID
  },
  production: true
}

// APN Provider

APN.send = (message, deviceToken) => {
  const apnProvider = new apn.Provider(options)
  const note = new apn.Notification()
  note.badge = 0
  note.topic = 'me.catt.maofan'
  note.alert = message
  apnProvider
    .send(note, deviceToken)
    .then(result => {
      if (result.failed.length > 0) {
        log(` ${symbols.error} ${deviceToken} error.`)
        console.log(result.failed)
      } else {
        log(` ${symbols.success} ${deviceToken} sent.`)
      }

      apnProvider.shutdown()
    })
}

module.exports = APN
