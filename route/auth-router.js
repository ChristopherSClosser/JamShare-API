'use strict'

const Router = require('express').Router
const createError = require('http-errors')
const rp = require('request-promise')
const jsonParser = require('body-parser').json()
const debug = require('debug')('jamshare-api:auth-router')
const basicAuth = require('../lib/basic-auth-middleware.js')
const Artist = require('../model/artist.js')

// module constants
const authRouter = module.exports = Router()

authRouter.post('/signup', jsonParser, function(req, res, next){
  debug('POST /signup')

  let password = req.body.password
  delete req.body.password
  let artist = new Artist(req.body)
  let route = 'http://github.com/login/oauth/authorize/allow_signup'

  rp(route)
  .then(data =>  {
    console.log(data);
    return JSON.parse(data);
  })
  .then(body => {
    console.log(body);
    res.json(body);
  })
  .catch(err => res.status(err.status).send(err.message));
    // rp(route, function(data) {
    //   console.log(data);
    //   return data;
    // });

  // check for password before running generatePasswordHash
  if (!password)
    return next(createError(400, 'requires password'))
  if (password.length < 8)
    return next(createError(400, 'password must be 8 characters'))

  artist.generatePasswordHash(password)
  .then( artist => artist.save()) // check for unique username with mongoose unique
  .then( artist => artist.generateToken())
  .then( token => res.send(token))
  .catch(next)

});

authRouter.get('/login', basicAuth, function(req, res, next){
  debug('GET /login')

  Artist.findOne({username: req.auth.username})
  .then( artist => artist.comparePasswordHash(req.auth.password))
  .catch(err => Promise.reject(createError(401, err.message)))
  .then( artist => artist.generateToken())
  .then( token => res.send(token))
  .catch(next)
})

// {
// current_user_url: "https://api.github.com/user",
// current_user_authorizations_html_url: "https://github.com/settings/connections/applications{/client_id}",
// authorizations_url: "https://api.github.com/authorizations",
// code_search_url: "https://api.github.com/search/code?q={query}{&page,per_page,sort,order}",
// commit_search_url: "https://api.github.com/search/commits?q={query}{&page,per_page,sort,order}",
// emails_url: "https://api.github.com/user/emails",
// emojis_url: "https://api.github.com/emojis",
// events_url: "https://api.github.com/events",
// feeds_url: "https://api.github.com/feeds",
// followers_url: "https://api.github.com/user/followers",
// following_url: "https://api.github.com/user/following{/target}",
// gists_url: "https://api.github.com/gists{/gist_id}",
// hub_url: "https://api.github.com/hub",
// issue_search_url: "https://api.github.com/search/issues?q={query}{&page,per_page,sort,order}",
// issues_url: "https://api.github.com/issues",
// keys_url: "https://api.github.com/user/keys",
// notifications_url: "https://api.github.com/notifications",
// organization_repositories_url: "https://api.github.com/orgs/{org}/repos{?type,page,per_page,sort}",
// organization_url: "https://api.github.com/orgs/{org}",
// public_gists_url: "https://api.github.com/gists/public",
// rate_limit_url: "https://api.github.com/rate_limit",
// repository_url: "https://api.github.com/repos/{owner}/{repo}",
// repository_search_url: "https://api.github.com/search/repositories?q={query}{&page,per_page,sort,order}",
// current_user_repositories_url: "https://api.github.com/user/repos{?type,page,per_page,sort}",
// starred_url: "https://api.github.com/user/starred{/owner}{/repo}",
// starred_gists_url: "https://api.github.com/gists/starred",
// team_url: "https://api.github.com/teams",
// user_url: "https://api.github.com/users/{user}",
// user_organizations_url: "https://api.github.com/user/orgs",
// user_repositories_url: "https://api.github.com/users/{user}/repos{?type,page,per_page,sort}",
// user_search_url: "https://api.github.com/search/users?q={query}{&page,per_page,sort,order}"
// }
