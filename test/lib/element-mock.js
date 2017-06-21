'use strict'

// npm modules
const debug = require('debug')('jamshare-api:element-mock')

// app modules
const Element = require('../../model/element.js')
const awsMocks = require('./aws-mocks.js')
const songMock = require('./song-mock.js')
const lorem = require('lorem-ipsum')

module.exports = function(done){
  debug('creating mock element')
  let title = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let exampleElementData = {
    title,
    desc,
    created: new Date(),
    elementURI: awsMocks.uploadMock.Location,
    objectKey: awsMocks.uploadMock.Key,
  }

  songMock.call(this, err => {
    if (err) return done(err)
    exampleElementData.username = this.tempArtist.username
    exampleElementData.userID = this.tempArtist._id.toString()
    exampleElementData.songID = this.tempSong._id.toString()
    new Element(exampleElementData).save()
    .then( element => {
      this.tempElement = element
      done()
    })
    .catch(done)
  })
}
