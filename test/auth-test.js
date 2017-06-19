'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const serverCtrl = require('./lib/server-ctrl.js');

mongoose.Promise = Promise

const server = require('../server.js');
const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'chris',
  password: '12345678',
  email: 'c@c.com',
}

describe('testing auth-router', function(){
  before(done => serverCtrl.serverUp(server, done));
  after(done => serverCtrl.serverDown(server, done);
  afterEach(done => cleanDB(done));

  describe('testing POST /api/signup', function(){
    describe('with valid body', function(){
      it('should return a token', (done) => {
        request.post(`${url}/api/signup`)
        .send(exampleUser)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(!!res.text).to.equal(true)
          done()
        })
      })
    })
  })
})
