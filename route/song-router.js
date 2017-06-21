'use strict'

// npm
const AWS = require('aws-sdk')
const Router = require('express').Router
const jsonParser = require('body-parser').json()
const createError = require('http-errors')
const debug = require('debug')('jamshare-api:song-router')

// app
const Element = require('../model/element.js')
const Song = require('../model/song.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const pageQueries = require('../lib/page-query-middleware.js')
const itemQueries = require('../lib/item-query-middleware.js')
const fuzzyQuery = require('../lib/fuzzy-query.js')

// constants
const s3 = new AWS.S3()
const songRouter = module.exports = Router()

songRouter.post('/api/song', bearerAuth, jsonParser, function(req, res, next){
  debug('POST /api/song')
  req.body.userID = req.artist._id
  req.body.username = req.artist.username
  new Song(req.body).save()
  .then( song => res.json(song))
  .catch(next)
})


songRouter.get('/api/song/:id', bearerAuth, itemQueries,  function(req, res, next){
  debug('GET /api/song/:id')
  Song.findById(req.params.id)
  .populate({
    path: 'elements',
    options: {
      sort: {_id: req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .catch(err => Promise.reject(createError(400, err.message)))
  .then(song => {
    if (song.userID.toString() !== req.artist._id.toString())
      return Promise.reject(createError(401, 'invalid userid'))
    res.json(song)
  })
  .catch(next)
})

songRouter.put('/api/song/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT /api/song/:id')
  Song.findById(req.params.id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(song => {
    if (song.userID.toString() !== req.artist._id.toString())
      return Promise.reject(createError(401, 'artist\'s song'))
    let options = { runValidators: true, new: true}
    return Song.findByIdAndUpdate(req.params.id, req.body, options)
  })
  .then(song => res.json(song))
  .catch(next)
})

songRouter.delete('/api/song/:id', bearerAuth, function(req, res, next){
  debug('DELETE /api/song/:id')
  let tempGallrey = null
  Song.findById(req.params.id)
  .populate('elements')
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(song => {
    tempGallrey = song
    if (song.userID.toString() !== req.artist._id.toString())
      return Promise.reject(createError(401, 'not artist\'s song'))
    let deletePhotos = []

    song.elements.forEach(element => {
      let params = {
        Bucket: process.env.AWS_BUCKET,
        Key: element.objectKey,
      }
      deletePhotos.push(Element.findByIdAndRemove(element._id))
      deletePhotos.push(s3.deleteObject(params).promise())
    })

    return Promise.all(deletePhotos)
  })
  .then(() => tempGallrey.remove())
  .then(() => res.sendStatus(204))
  .catch(next)
})

songRouter.get('/api/song', bearerAuth, pageQueries, itemQueries, function(req, res, next){
  debug('GET /api/song')

  let fields = ['name', 'desc']
  let query = fuzzyQuery(fields, req.query)
  query.userID = req.artist._id.toString()
  Song.find(query)
  .populate({
    path: 'elements',
    options: {
      sort: {_id: req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})

// public anyone can call
songRouter.get('/api/public/song', pageQueries, itemQueries, function(req, res, next){
  let fields = ['username', 'name', 'desc']
  let query = fuzzyQuery(fields, req.query)
  console.log('req.query.itemcount', req.query.itemcount)
  Song.find(query)
  .populate({
    path: 'elements',
    options: {
      sort: {_id: req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})
