'use strict'

const debug = require('debug')('jamshare-api:mock-many-users');
const Artist = require('../../model/artist.js');
const lorem = require('lorem-ipsum');

module.exports = function(count, done){
  debug(`creating ${count} users`);
  let artistMocks = [];

  for(var i=0; i<count; i++){
    artistMocks.push(mockAUser());
  }

  Promise.all(artistMocks)
  .then( tempUsers => {
    this.tempUsers = tempUsers;
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
  let tempUser, tempToken;
  return new Artist(exampleArtist)
  .generatePasswordHash(exampleArtist.password)
  .then( user => user.save())
  .then( user => {
    tempUser = user;
    return user.generateToken();
  })
  .then( token => {
    tempToken = token;
    return {
      tempUser,
      tempToken,
      tempPassword,
    };
  });
}
