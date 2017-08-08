'use strict'

const apn = require('apn')

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
      console.log(result)
      apnProvider.shutdown()
    })
}

module.exports = APN
