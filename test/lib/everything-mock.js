'use strict'

const Promise = require('bluebird')
const lorem = require('lorem-ipsum')
const debug = require('debug')('jamshare-api:song-mock-everything')

const Element = require('../../model/element.js')
const Artist = require('../../model/artist.js')
const Song = require('../../model/song.js')

module.exports = function(options, done){
  debug('mocking artists, songs, and elements')
  if(!checkOptions)
    return done('bad options')

  // make usercount
  // make songcount for each user
  // make elementtures for each song
  this.tempArtistData = []
  this.tempSongs = []
  this.tempElements = []

  let makeArtists = []
  for(var i=0; i<options.users; i++){
    makeArtists.push(mockAUser())
  }

  Promise.all(makeArtists)
  .map( userdata => {
    this.tempArtistData.push(userdata)
    let makeArtistSongs = []
    let userID = userdata.tempUser._id.toString()
    let username  = userdata.tempUser.username
    for(var i=0; i<options.songs; i++){
      makeArtistSongs.push(mockASong(userID, username))
    }
    return Promise.all(makeArtistSongs)
  })
  .map(artistSongs => {
    return Promise.resolve(artistSongs)
    .map(song => {
      let makeSongElements = []
      let userID = song.userID.toString()
      let username = song.username
      for(var i=0; i<options.elements; i++){
        makeSongElements.push(mockAElement(userID, username))
      }
      return Promise.all(makeSongElements)
      .map( element => {
        this.tempElements.push(element)
        let elementID = element._id.toString()
        song.elements.push(elementID)
        return song.save()
      })
      .each(song => this.tempSongs.push(song))
    })
  })
  .then(() => done())
  .catch(done)
}

function checkOptions(options){
  if (!options.users)
    return false
  if (!options.songs)
    return false
  if (!options.elements)
    return false
  return true
}

function mockAUser(){
  let username = lorem({count: 4, units: 'word'}).split(' ').join('-')
  let password = lorem({count: 4, units: 'word'}).split(' ').join('-')
  let email= lorem({count: 4, units: 'word'}).split(' ').join('-')
  let exampleArtist = {
    username,
    password,
    email: `${email}@jammer.com`,
  }
  let tempPassword = password
  let tempUser, tempToken
  return new Artist(exampleArtist)
  .generatePasswordHash(tempPassword)
  .then( user => {
    tempUser = user
    return user.generateToken()
  })
  .then( token => {
    tempToken = token
    return {
      tempUser,
      tempToken,
      tempPassword,
    }
  })
}

function mockASong(userID, username){
  let name = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let exampleSong = { name, desc , userID, username}
  return new Song(exampleSong).save()
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
