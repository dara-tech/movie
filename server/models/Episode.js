const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: false
  },
  imdbId: {
    type: String,
    required: false
  },
  tvShow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TvShow',
    required: true
  },
  seasonNumber: {
    type: Number,
    required: true
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  overview: {
    type: String
  },
  airDate: {
    type: Date
  },
  stillPath: {
    type: String
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  runtime: {
    type: Number
  },
  vidsrcUrl: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

episodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for efficient queries
episodeSchema.index({ tvShow: 1, seasonNumber: 1, episodeNumber: 1 });

module.exports = mongoose.model('Episode', episodeSchema);
