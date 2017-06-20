'use strict'

const debug = require('debug')('jamshare-api:mock-many-artists');
const Artist = require('../../model/artist.js');
const lorem = require('lorem-ipsum');

module.exports = function(count, done){
  debug(`creating ${count} artists`);
  let artistMocks = [];

  for(var i=0; i<count; i++){
    artistMocks.push(mockAUser());
  }

  Promise.all(artistMocks)
  .then( tempArtists => {
    this.tempArtists = tempArtists;
    done();
  })
  .catch(done);

}

function mockAUser(){
  let username = lorem({count: 2, units: 'word'}).split(' ').join('-');
  let password = lorem({count: 2, units: 'word'}).split(' ').join('-');
  let email= lorem({count: 2, units: 'word'}).split(' ').join('-');
  let exampleArtist = {
    username,
    password,
    email: `${email}@jammer.com`,
  };
  let tempPassword = password;
  let tempArtist, tempToken;
  return new Artist(exampleArtist)
  .generatePasswordHash(exampleArtist.password)
  .then( artist => artist.save())
  .then( artist => {
    tempArtist = artist;
    return artist.generateToken();
  })
  .then( token => {
    tempToken = token;
    return {
      tempArtist,
      tempToken,
      tempPassword,
    };
  });
}
