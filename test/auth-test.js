'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Promise = require('bluebird');
const mongoose = require('mongoose');

mongoose.Promise = Promise

describe('testing auth-router', function(){
  it('should pass', (done) => {
    expect(false).to.equal(false);
    done();
  });
});
