const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Genre', genreSchema);
