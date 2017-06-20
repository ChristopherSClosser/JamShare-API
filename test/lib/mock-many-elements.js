
'use strict'

const Element = require('../../model/element.js')
const debug = require('debug')('jamshare-api:song-mock')
const songMock = require('./song-mock.js')
const lorem = require('lorem-ipsum')

// create a uesr, token, pass, song
// create a bunch of elements
// add element ids to song
// save song
// done
module.exports = function(count, done){
  debug(`mock ${count}songs`)
  songMock.call(this, err => {
    if (err) return done(err)
    let elementMocks = []
    let userID = this.tempArtist._id.toString()
    let username = this.tempArtist.username
    for(var i=0; i<count; i++){
      elementMocks.push(mockAElement(userID, username))
    }
    Promise.all(elementMocks)
    .then(tempElements => {
      tempElements.forEach(element => {
        let elementID = element._id.toString()
        this.tempSong.elements.push(elementID)
      })
      this.tempElements = tempElements
      return this.tempSong.save()
    })
    .then(() => done())
    .catch(done)
  })
}

function mockAElement(userID, username){
  let name = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let uri = lorem({count: 5, units: 'word'}).split(' ').join('-')
  let objectKey = lorem({count: 5, units: 'word'}).split(' ').join('')
  let imageURI = `https://${uri}/${objectKey}`
  let exampleElementData = {
    name,
    desc,
    userID,
    username,
    imageURI,
    objectKey,
    created: new Date(),
  }
  return new Element(exampleElementData).save()
}
