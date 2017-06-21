'use strict';

const debug = require('debug')('jamshare-api:artist-mock');
const Artist = require('../../model/artist.js');
const lorem = require('lorem-ipsum');

module.exports = function(done){
  debug('create mock artist');
  let username = lorem({count: 2, units: 'word'}).split(' ').join('-');
  let password = lorem({count: 2, units: 'word'}).split(' ').join('-');
  let email= lorem({count: 2, units: 'word'}).split(' ').join('-');
  let exampleArtist = {
    username,
    password,
    email: `${email}@jammer.com`,
  }
  this.tempPassword = password;
  new Artist(exampleArtist)
  .generatePasswordHash(exampleArtist.password)
  .then( artist => artist.save())
  .then( artist => {
    this.tempArtist = artist;
    return artist.generateToken();
  })
  .then( token => {
    this.tempToken = token;
    done();
  })
  .catch(done);
}
