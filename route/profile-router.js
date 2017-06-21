'use strict';

const Router = require('express').Router;
const createError = require('http-errors');
// const Artist = require('../model/artist.js');
const debug = require('debug')('jamshare-api:profile-router');
const bearerAuth = require('../lib/bearer-auth-middleware');

const profileRouter = module.exports = Router();

profileRouter.get('/api/profile', bearerAuth, (req, res) => {
  debug('#profile-router');

  if(!req.artist) return createError(400, 'Bad request!'); // create an http error and send the error and status back
  res.json(req.artist);
});
