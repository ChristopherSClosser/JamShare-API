'use strict'

const Router = require('express').Router
const createError = require('http-errors')
const jsonParser = require('body-parser').json()
const debug = require('debug')('jamshare-api:auth-router')
const basicAuth = require('../lib/basic-auth-middleware.js')
const Artist = require('../model/artist.js')

// module constants
const authRouter = module.exports = Router()

authRouter.post('/api/signup', jsonParser, function(req, res, next){
  debug('POST /api/signup')

  let password = req.body.password
  delete req.body.password
  let artist = new Artist(req.body)

  // checkfor password before running generatePasswordHash
  if (!password)
    return next(createError(400, 'requires password'))
  if (password.length < 8)
    return next(createError(400, 'password must be 8 characters'))

  artist.generatePasswordHash(password)
  .then( artist => artist.save()) // check for unique username with mongoose unique
  .then( artist => artist.generateToken())
  .then( token => res.send(token))
  .catch(next)
})

authRouter.get('/api/login', basicAuth, function(req, res, next){
  debug('GET /api/login')

  Artist.findOne({username: req.auth.username})
  .then( artist => artist.comparePasswordHash(req.auth.password))
  .catch(err => Promise.reject(createError(401, err.message)))
  .then( artist => artist.generateToken())
  .then( token => res.send(token))
  .catch(next)
})
