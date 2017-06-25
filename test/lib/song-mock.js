'use strict';

const debug = require('debug')('jamshare-api:song-mock');
const artistMock = require('./artist-mock.js');
const Song = require('../../model/song.js');


module.exports = function(done){
  debug('create mock song');
  let exampleSong = {
    name: 'beach adventure',
    desc: 'not enough sun screen ouch',
  };
  artistMock.call(this, err => {
    if (err)
      return done(err);
    exampleSong.userID = this.tempArtist._id.toString();
    exampleSong.username = this.tempArtist.username;
    new Song(exampleSong).save()
    .then( song => {
      this.tempSong = song;
      done();
    })
    .catch(done);
  });
};
