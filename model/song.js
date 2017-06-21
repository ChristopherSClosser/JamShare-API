'use strict';

const mongoose = require('mongoose');

const songSchema = mongoose.Schema({
  title: {type: String, required: true},
  desc: {type: String, required: true},
  username: {type: String, required: true},
  created: {type: Date, required: true, default: Date.now},
  userID: {type: mongoose.Schema.Types.ObjectId, required: true},
  elements: [{type: mongoose.Schema.Types.ObjectId, ref: 'element'}],
});

module.exports = mongoose.model('song', songSchema);
