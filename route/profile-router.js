'use strict';

const Router = require('express').Router;
const debug = require('debug')('jamshare-api:profile-router');
const bearerAuth = require('../lib/bearer-auth-middleware');

const profileRouter = module.exports = Router();

profileRouter.get('/api/profile/', bearerAuth, (req, res) => {
  debug('#profile-router');
  console.log(req);
  res.json(req.artist)
});
