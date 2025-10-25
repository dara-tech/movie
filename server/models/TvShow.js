const mongoose = require('mongoose');

const tvShowSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: false
  },
  imdbId: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    required: true
  },
  firstAirDate: {
    type: Date,
    required: true
  },
  lastAirDate: {
    type: Date
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
  numberOfSeasons: {
    type: Number,
    default: 1
  },
  numberOfEpisodes: {
    type: Number,
    default: 0
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
  originalName: {
    type: String
  },
  popularity: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Returning Series', 'Planned', 'In Production', 'Ended', 'Canceled', 'Pilot'],
    default: 'Returning Series'
  },
  type: {
    type: String,
    enum: ['Scripted', 'Reality', 'Documentary', 'News', 'Talk Show', 'Miniseries'],
    default: 'Scripted'
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

tvShowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TvShow', tvShowSchema);
