'use strict'

require('./lib/test-env.js')
require('./lib/aws-mocks.js')

// npm
const expect = require('chai').expect
const request = require('superagent')
const mongoose = require('mongoose')
const Promise = require('bluebird')

// app
const Artist = require('../model/artist.js')
const server = require('../server.js')
const cleanDB = require('./lib/clean-db.js')
const mockArtist = require('./lib/artist-mock.js')
const serverCtrl = require('./lib/server-ctrl.js')
const fuzzyRegex = require('../lib/fuzzy-regex.js')
const mockSong = require('./lib/song-mock.js')
const mockManyElements = require('./lib/mock-many-elements.js')
const mockManySongs = require('./lib/mock-many-songs.js')
//const mockManyEverything = require('./lib/mock-many-everything.js')
const mockManyEverything = require('./lib/everything-mock.js')

// const
const url = `http://localhost:${process.env.PORT}`
  // config
mongoose.Promise = Promise
let exampleSong = {
  name: 'beach adventure',
  desc: 'not enough sun screen ouch',
}

describe('test /api/song', function(){
  // start server at for this test file
  before(done => serverCtrl.serverUp(server, done))
  // stop server after this test file
  after(done => serverCtrl.serverDown(server, done))
  // clean all models from db after each test
  afterEach(done => cleanDB(done))

  describe('testing POST to /api/song', () => {
    // create this.tempArtist and this.tempToken
    describe('with valid token and body', () => {
      before(done => mockArtist.call(this, done))
      it('should return a song', done => {
        request.post(`${url}/api/song`)
        .send(exampleSong)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          let date = new Date(res.body.created).toString()
          expect(date).to.not.equal('Invalid Date')
          done()
        })
      })
    })

    describe('with invalid token', () => {
      before(done => mockArtist.call(this, done))
      it('should respond with status 401', done => {
        request.post(`${url}/api/song`)
        .send(exampleSong)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid Bearer auth', () => {
      before(done => mockArtist.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song`)
        .send(exampleSong)
        .set({Authorization: 'not bearer auth'})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no Authorization header', () => {
      before(done => mockArtist.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song`)
        .send(exampleSong)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no name', () => {
      before(done => mockArtist.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .send({ desc: exampleSong.desc})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no desc', () => {
      before(done => mockArtist.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/song`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .send({ name: exampleSong.name})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing GET to /api/song/:id', () => {
    // create this.tempToken, this.tempArtist, this.tempSong
    describe('with valid token and id', function(){
      before(done => mockSong.call(this, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          done()
        })
      })
    })

    describe('with many elementtures', function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(100)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[i]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[i].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[i].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[i].imageURI)
          }
          done()
        })
      })
    })

    describe('with ?itemcount=10&itempage=2',  function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}?itemcount=10&itempage=2`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[i + 10 ]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[i + 10].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[i + 10].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[i + 10].imageURI)
          }
          done()
        })
      })
    })

    describe('with many elementtures and ?itemcount=10', function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}?itemcount=10`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[i]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[i].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[i].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many elementtures and ?itemcount=10&itemsort=dsc', function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}?itemcount=10&itemsort=dsc`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          let tempElementsLength = this.tempElements.length
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[tempElementsLength - 1 - i]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[tempElementsLength - 1 - i].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[tempElementsLength - 1 - i].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[tempElementsLength - 1 - i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many elementtures and ?itemcount=10&itemsort=dsc?itemoffset=1', function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}?itemcount=10&itemsort=dsc&itemoffset=1`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          let tempElementsLength = this.tempElements.length
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[tempElementsLength - 2 - i]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[tempElementsLength - 2 - i].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[tempElementsLength - 2 - i].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[tempElementsLength - 2 - i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many elementtures and ?itemcount=10&itemoffset=1', function(){
      before(done => mockManyElements.call(this, 100, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}?itemcount=10&itemoffset=1`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleSong.name)
          expect(res.body.desc).to.equal(exampleSong.desc)
          expect(res.body.userID).to.equal(this.tempArtist._id.toString())
          expect(Array.isArray(res.body.elements)).to.equal(true)
          expect(res.body.elements.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempSong.created.toString())
          for (let i=0; i< res.body.elements.length; i++){
            expect(res.body.elements[i]._id.toString()).to.equal(this.tempElements[i + 1]._id.toString())
            expect(res.body.elements[i].name).to.equal(this.tempElements[i + 1].name)
            expect(res.body.elements[i].desc).to.equal(this.tempElements[i + 1].desc)
            expect(res.body.elements[i].imageURI).to.equal(this.tempElements[i + 1].imageURI)
          }
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => mockSong.call(this, done))
      it('should respond with status 401', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}bad`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid Bearer auth', function(){
      before(done => mockSong.call(this, done))
      it('should respond with status 400', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({ Authorization: 'bad request' })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no Authorization header', function(){
      before(done => mockSong.call(this, done))
      it('should respond with status 400', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid id', function(){
      before(done => mockSong.call(this, done))
      it('should return a song', done => {
        request.get(`${url}/api/song/${this.tempSong._id}bad`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with user whos been removed', function(){
      before(done => mockSong.call(this, done))
      before(done => {
        Artist.remove({})
        .then(() => done())
        .catch(done)
      })

      it('should respond with status 401', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with wrong artist', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      // overwrite username, password, and token with new artist
      before(done => mockArtist.call(this, done))

      it('should respond with status 401', done => {
        request.get(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })
  })

  describe('testing PUT /api/song/:songID', function(){
    describe('update name ande desc', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should return a song', done => {
        request.put(`${url}/api/song/${this.tempSong._id}`)
        .send({
          name: 'hello',
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal('hello')
          expect(res.body.desc).to.equal('cool')
          done()
        })
      })
    })

    describe('update name ande desc', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      before(done => mockArtist.call(this, done))

      it('should return a song', done => {
        request.put(`${url}/api/song/${this.tempSong._id}`)
        .send({
          name: 'hello',
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })

    describe('update name', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should return a song', done => {
        request.put(`${url}/api/song/${this.tempSong._id}`)
        .send({
          name: 'hello',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal('hello')
          expect(res.body.desc).to.equal(this.tempSong.desc)
          done()
        })
      })
    })

    describe('update desc', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should return a song', done => {
        request.put(`${url}/api/song/${this.tempSong._id}`)
        .send({
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal(this.tempSong.name)
          expect(res.body.desc).to.equal('cool')
          done()
        })
      })
    })

    describe('with bad songID', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should return a song', done => {
        request.put(`${url}/api/song/${this.tempSong._id}bad`)
        .send({
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with bad token', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should respond with status 401', done => {
        request.put(`${url}/api/song/${this.tempSong._id}`)
        .send({
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}bad`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('witn no auth', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))

      it('should respond with status 400', done => {
        request.put(`${url}/api/song/${this.tempSong._id}bad`)
        .send({
          desc: 'cool',
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing DELETE /api/song/:songID', function(){
    describe('should respond with status 204', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      it('should return a song', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(204)
          done()
        })
      })
    })

    describe('with invalid songID', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      it('should return a song', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}bad`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with invalid songID', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      before(done => mockArtist.call(this, done))
      it('should return a song', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })

    describe('with invalid token', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      it('should respond with status 401', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}bad`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('witn no auth', function(){
      // mock artist, password, token, and song
      before(done => mockSong.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/song/${this.tempSong._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing GET /api/song', function(){
    describe('with valid request', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should respond with status 400', done => {
        request.get(`${url}/api/song`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          done()
        })
      })
    })

    describe('with ?pagesize=10', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?pagesize=5`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(5)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i].name)
          }
          done()
        })
      })
    })

    describe('with ?sort=dsc', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?sort=dsc`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[this.tempSongs.length - i - 1].name)
          }
          done()
        })
      })
    })

    describe('with ?sort=dsc?offset=3', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?sort=dsc&offset=3`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            let index = this.tempSongs.length - i - 4
            expect(res.body[i].name).to.equal(this.tempSongs[index].name)
          }
          done()
        })
      })
    })

    describe('with offset=1', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?offset=1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i + 1].name)
          }
          done()
        })
      })
    })

    describe('with ?page=2', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?page=2`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i + 50].name)
          }
          done()
        })
      })
    })

    describe('with ?page=3&?offset=1', function(){
      before( done => mockManySongs.call(this, 150, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?page=3&offset=1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(49)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i + 101].name)
          }
          done()
        })
      })
    })

    describe('with ?page=-1', function(){
      before( done => mockManySongs.call(this, 150, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?page=-1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i].name)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=-1', function(){
      before( done => mockManySongs.call(this, 50, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?pagesize=-1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(1)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i].name)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=300', function(){
      before( done => mockManySongs.call(this, 300, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/song?pagesize=250`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(250)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempSongs[i].name)
          }
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before( done => mockManySongs.call(this, 50, done))
      it('should respond with status 401', done => {
        request.get(`${url}/api/song`)
        .set({ Authorization: `Bearer ${this.tempToken}bad` })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with ?name=co', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/song?name=co`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          console.log('matching notes', res.body.length)
          let fuzzyName = fuzzyRegex('co')
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzyName)
          }
          done()
        })
      })
    })

    describe('with ?desc=co', function(){
      before( done => mockManySongs.call(this, 100, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/song?desc=co`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          console.log('matching notes', res.body.length)
          let fuzzyName = fuzzyRegex('co')
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].desc).to.match(fuzzyName)
          }
          done()
        })
      })
    })
  })

  describe('testing GET /api/public/song', function(){
    describe('with valid request', function(){
      let options = {
        artists: 4,
        songs: 3,
        elements: 4,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/public/song`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
      })
    })

    describe('with ?username=lu', function(){
      let options = {
        artists: 30,
        songs: 1,
        elements: 1,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match lu', done => {
        request.get(`${url}/api/public/song?username=lu`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lu')
          console.log('matches found', res.body.length)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].username).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?name=lu', function(){
      let options = {
        artists: 5,
        songs: 10,
        elements: 1,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match lu', done => {
        request.get(`${url}/api/public/song?name=lu`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lu')
          console.log('matches found', res.body.length)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?itemcount=4', function(){
      let options = {
        artists: 2,
        songs: 5,
        elements: 10,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('each song should have 4 elements', done => {
        request.get(`${url}/api/public/song?itemcount=4`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].elements.length).to.equal(4)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=4', function(){
      let options = {
        artists: 2,
        songs: 5,
        elements: 10,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('show top 4 songs with 10 elements', done => {
        request.get(`${url}/api/public/song?pagesize=4`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(4)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].elements.length).to.equal(10)
          }
          done()
        })
      })
    })
  })
})
