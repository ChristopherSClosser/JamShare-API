'use strict'

// mock third party services
require('./lib/test-env.js')
const awsMocks = require('./lib/aws-mocks.js')

// npm modules
const expect = require('chai').expect
const request = require('superagent')

// app modules

const elementMock = require('./lib/element-mock.js')
const cleanDB = require('./lib/clean-db.js')
const artistMock = require('./lib/artist-mock.js')
let fuzzyRegex = require('../lib/fuzzy-regex.js')
const serverCtrl = require('./lib/server-ctrl.js')
const songMock = require('./lib/song-mock.js')
const mockManyElements = require('./lib/mock-many-elements.js')
const mockManyEverything = require('./lib/everything-mock.js')

// module constants
const server = require('../server.js')
const url = `http://localhost:${process.env.PORT}`

const exampleElement = {
  name: 'sunburn',
  desc: 'owie no thank you',
  file: `${__dirname}/data/shield.png`,
}

describe('testing element-router', function(){
  // start server before all tests
  before( done => serverCtrl.serverUp(server, done))
  // stop server before all tests
  after(done => serverCtrl.serverDown(server, done))
  // remove all models from database after every test
  afterEach(done => cleanDB(done))

  describe('testing post /api/song/:id/element', function(){
    describe('with valid token and data', function(){
      before(done => songMock.call(this, done))
      it('should return a element', done => {
        request.post(`${url}/api/song/${this.tempSong._id}/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('name', exampleElement.name)
        .field('desc', exampleElement.desc)
        .attach('file', exampleElement.file)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal(exampleElement.name)
          expect(res.body.desc).to.equal(exampleElement.desc)
          expect(res.body.imageURI).to.equal(awsMocks.uploadMock.Location)
          expect(res.body.objectKey).to.equal(awsMocks.uploadMock.Key)
          done()
        })
      })
    })

    describe('with no name', function(){
      before(done => songMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song/${this.tempSong._id}/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', exampleElement.desc)
        .attach('file', exampleElement.file)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no desc', function(){
      before(done => songMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song/${this.tempSong._id}/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('name', exampleElement.name)
        .attach('file', exampleElement.file)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no file', function(){
      before(done => songMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song/${this.tempSong._id}/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', exampleElement.desc)
        .field('name', exampleElement.name)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => songMock.call(this, done))
      it('should respond with status 401', done => {
        request.post(`${url}/api/song/${this.tempSong._id}/element`)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .field('desc', exampleElement.desc)
        .field('name', exampleElement.name)
        .attach('file', exampleElement.file)
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid songID', function(){
      before(done => songMock.call(this, done))
      it('should respond with status 404', done => {
        request.post(`${url}/api/song/${this.tempSong._id}bad/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', exampleElement.desc)
        .field('name', exampleElement.name)
        .attach('file', exampleElement.file)
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })
  })

  describe('testing DELETE /api/song/:gallryID/element/:elementID', function(){
    describe('with valid token and ids', function(){
      before(done => elementMock.call(this, done))

      it('should respond with status 204', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(204)
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => elementMock.call(this, done))
      it('should respond with status 401', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}`)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('should resond with 401', function(){
      before(done => elementMock.call(this, done))
      before(done => artistMock.call(this, done))

      it('should respond with status 401', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })

    describe('no auth header', function(){
      before(done => elementMock.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no bearer auth', function(){
      before(done => elementMock.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}`)
        .set({Authorization: 'lul this is bad'})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid songID', function(){
      before(done => elementMock.call(this, done))
      it('should respond with status 404', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}bad/element/${this.tempElement._id}`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with invalid elementID', function(){
      before(done => elementMock.call(this, done))
      it('should respond with status 404', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}/element/${this.tempElement._id}bad`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })
  })

  describe('testing GET /api/public/element', function(){
    describe('with valid request', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i]._id.toString()).to.equal(this.tempElements[i]._id.toString())
          }
          done()
        })
      })
    })

    describe('with ?name=do', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element?name=do`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('do')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?desc=lorem', function(){
      before(done => mockManyElements.call(this, 50, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element?desc=lorem`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lorem')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].desc).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?desc=lorem%20ip', function(){
      before(done => mockManyElements.call(this, 50, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element?desc=lorem%20ip`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lorem ip')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].desc).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?desc=lo&name=do', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element?desc=lorem&name=do`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzyName = fuzzyRegex('do')
          let fuzzyDesc = fuzzyRegex('lo')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzyName)
            expect(res.body[i].desc).to.match(fuzzyDesc)
          }
          done()
        })
      })
    })

    describe('with ?username=lop', function(){
      let options = {
        artists: 20,
        songs: 2,
        elements: 5,
      }
      before(done => mockManyEverything.call(this, options, done))
      //before(function(done){
        //this.timeout(5000)
        //mockManyEverything.call(this, 20, function(err){
          //if(err) return done(err)
          //done()
        //})
      //})

      it ('should return an array of elements', done => {
        request.get(`${url}/api/public/element?username=lop`)
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzyuser = fuzzyRegex('lo')
          console.log('elements in response', res.body.length)
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].username).to.match(fuzzyuser)
          }
          done()
        })
      })
    })
  })

  describe('testing GET /api/element', function(){
    describe('with valid token', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/element`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempElements[i].name)
          }
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/element`)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })


    describe('with ?name=do', function(){
      before(done => mockManyElements.call(this, 100, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/element?name=do`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(200)
          let fuzzyName = fuzzyRegex('do')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzyName)
          }
          done()
        })
      })
    })

    describe('with ?desc=do', function(){
      before(done => mockManyElements.call(this, 10, done))
      it ('should return an array of elements', done => {
        request.get(`${url}/api/element?desc=do`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(200)
          let fuzzyName = fuzzyRegex('do')
          for(let i=0; i<res.body.length; i++){
            expect(res.body[i].desc).to.match(fuzzyName)
          }
          done()
        })
      })
    })
  })
})
