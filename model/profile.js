'use strict';

const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
  name: {type: String, required: true},
  bio: {type: String, required: false},
});

module.exports = mongoose.model('profile', profileSchema);
