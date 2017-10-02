'use strict'
/*
 * State persistence model for stream clients
 */

const mongoose = require('mongoose')

mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const Client = new Schema({
  clientId: {type: String, required: true, index: {unique: true}},
  deviceToken: {type: String, required: true},
  oauthToken: {type: String, required: true},
  oauthTokenSecret: {type: String, required: true}
}, {minimize: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}, retainKeyOrder: true})

Client.set('toJSON', {
  transform (doc, ret) {
    delete ret.__v
    return ret
  }
})

Client.statics.findByClientId = async function (clientId) {
  let result
  try {
    result = await this.model('Client').findOne({clientId}).exec()
    return result
  } catch (err) {
    return null
  }
}

Client.statics.deleteByClientId = async function (clientId) {
  let result
  try {
    result = await this.model('Client').remove({clientId}).exec()
    return result
  } catch (err) {
    throw new Error(`Client remove failed: ${err.toString()}`)
  }
}

module.exports = mongoose.model('Client', Client)
