'use strict'

const debug = require('debug')('jamshare-api:clean-db')

const Pic = require('../../model/pic.js')
const Artist = require('../../model/artist.js')
const Gallery = require('../../model/gallery.js')

module.exports = function(done){
  debug('clean up database')
  Promise.all([
    Pic.remove({}),
    Artist.remove({}),
    Gallery.remove({}),
  ])
  .then( () => done())
  .catch(done)
}
