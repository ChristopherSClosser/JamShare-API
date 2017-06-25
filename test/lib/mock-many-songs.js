'use strict';

const debug = require('debug')('jamshare-api:song-mock');
const artistMock = require('./artist-mock.js');
const Song = require('../../model/song.js');
const lorem = require('lorem-ipsum');

module.exports = function(count, done){
  debug(`mock ${count}songs`);

  artistMock.call(this, err => {
    if (err) return done(err);

    let songMocks = [];
    let userID = this.tempArtist._id.toString();
    let username = this.tempArtist.username;

    for(var i=0; i<count; i++){
      songMocks.push(mockASong(userID, username));
    }

    Promise.all(songMocks)
    .then(tempSongs => {
      this.tempSongs = tempSongs;
      done();
    })
    .catch(done);
  });
}

function mockASong(userID, username){
  let name = lorem({count: 2, units: 'word'});
  let desc = lorem({count: 2, units: 'sentence'});
  let exampleSong = { name, desc , userID, username};

  return new Song(exampleSong).save();
}
