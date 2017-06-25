'use strict';

// :::: npm modules :::: //
const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');
const createError = require('http-errors');
const debug = require('debug')('sulgram:element-router');

// :::: app modules :::: //
const Element = require('../model/element.js');
const Song = require('../model/song.js');
const fuzzyQuery = require('../lib/fuzzy-query.js');
const bearerAuth = require('../lib/bearer-auth-middleware.js');
const pageQuery = require('../lib/page-query-middleware.js')

AWS.config.setPromisesDependency(require('bluebird'));

// :::: module constants :::: //
const s3 = new AWS.S3();
const dataDir =`${__dirname}/../data`;
const upload = multer({dest: dataDir });
const s3UploadPromise = require('../lib/s3-upload-promise.js');
const elementRouter = module.exports = require('express').Router();

elementRouter.post('/api/song/:songID/element', bearerAuth, upload.single('file'), function(req, res, next){
  debug('POST /api/song/:songID/element');

  if(!req.file) return next(createError(400, 'no file found'));

  let ext = path.extname(req.file.originalname);
  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path),
  }

  // first check that the song exists
  // then upload image
  // remove the image that multer stored on the local disk
  // then store mongo Element
  // then respond to artist

  let tempSong, tempElement;
  Song.findById(req.params.songID)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(song  => {
    tempSong = song;
    return s3UploadPromise(params);
  })
  .catch(err => err.status ? Promise.reject(err) : Promise.reject(createError(500, err.message)))
  .then(s3data => {
    del([`${dataDir}/*`]);
    let elementData = {
      name: req.body.name,
      username: req.artist.username,
      desc: req.body.desc,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userID: req.artist._id,
    }
    return new Element(elementData).save();
  })
  .then(element => {
    tempElement = element;
    tempSong.elements.push(element._id);
    return tempSong.save();
  })
  .then(() => res.json(tempElement))
  .catch(err => {
    del([`${dataDir}/*`]);
    next(err);
  });
});

elementRouter.delete('/api/song/:songID/element/:elementID', bearerAuth, function(req, res, next){
  debug('DELETE /api/song/:songID/element/:elementID')

  //check that the element exists if not 404
  //make sure there userID matches the element.userID if not 401
  //check that song id is correct if not 404
  //remove the elementID from the song
  //delete the elementture from aws
  //delete the element from mongo
  //respond to the client

  let tempElement;
  Element.findById(req.params.elementID)
  .then( element => {
    if(element.userID.toString() !== req.artist._id.toString())
      return Promise.reject(createError(401, 'artist not authorized to delete this element'));
    tempElement = element;
    return Song.findById(req.params.songID);
  })
  .catch(err => err.status? Promise.reject(err) : Promise.reject(createError(404, err.message)))
  .then( song => {
    song.elements = song.elements.filter( id => {
      if (id === req.params.elementID) return false;
      return true;
    });
    return song.save();
  })
  .then(() => {
    let params = {
      Bucket: process.env.AWS_BUCKET,
      Key: tempElement.objectKey,
    }
    return s3.deleteObject(params).promise();
  })
  .then(() => {
    return Element.findByIdAndRemove(req.params.elementID);
  })
  .then(() => res.sendStatus(204))
  .catch(next);
});

elementRouter.get('/api/public/element', pageQuery, function(req, res, next){
  let fields = ['username', 'name', 'desc'];
  let query = fuzzyQuery(fields, req.query);

  Element.find(query)
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(elements => res.json(elements))
  .catch(next);
});

 // this route is private and only returns an artist's elements
elementRouter.get('/api/element', bearerAuth, pageQuery, function(req, res, next){
  let fuzzyFields = [ 'name', 'desc' ];
  let query = fuzzyQuery(fuzzyFields, req.query);

  query.userID = req.artist._id.toString();

  Element.find(query)
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(elements => res.json(elements))
  .catch(next);
});
