'use strict';

const debug = require('debug')('jamshare-api:clean-db');
const Element = require('../../model/element.js');
const Artist = require('../../model/artist.js');
const Song = require('../../model/song.js');

module.exports = function(done){
  debug('clean up database');

  Promise.all([
    Element.remove({}),
    Artist.remove({}),
    Song.remove({}),
  ])
  .then( () => done())
  .catch(done);
}
