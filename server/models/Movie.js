const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: false
  },
  imdbId: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  posterPath: {
    type: String,
    required: true
  },
  backdropPath: {
    type: String
  },
  genres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre'
  }],
  runtime: {
    type: Number
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  adult: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  originalTitle: {
    type: String
  },
  popularity: {
    type: Number,
    default: 0
  },
  video: {
    type: Boolean,
    default: false
  },
  streamingUrl: {
    type: String
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

movieSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Movie', movieSchema);
