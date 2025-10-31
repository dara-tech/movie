const mongoose = require('mongoose');

const tvShowSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    trim: true
  },
  overview: {
    type: String,
    trim: true
  },
  firstAirDate: {
    type: Date
  },
  lastAirDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Returning Series', 'Planned', 'In Production', 'Ended', 'Canceled', 'Pilot'],
    default: 'Returning Series'
  },
  type: {
    type: String,
    enum: ['Scripted', 'Reality', 'Documentary', 'News', 'Talk Show', 'Miniseries', 'Video', 'Animation', 'Anime'],
    default: 'Scripted'
  },
  genres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre'
  }],
  networks: [{
    id: Number,
    name: String,
    logoPath: String,
    originCountry: String
  }],
  productionCompanies: [{
    id: Number,
    name: String,
    logoPath: String,
    originCountry: String
  }],
  createdBy: [{
    id: Number,
    creditId: String,
    name: String,
    gender: Number,
    profilePath: String
  }],
  seasons: [{
    airDate: Date,
    episodeCount: Number,
    id: Number,
    name: String,
    overview: String,
    posterPath: String,
    seasonNumber: Number,
    voteAverage: Number
  }],
  numberOfSeasons: {
    type: Number,
    default: 1
  },
  numberOfEpisodes: {
    type: Number,
    default: 0
  },
  episodeRunTime: [Number],
  averageRuntime: {
    type: Number
  },
  posterPath: {
    type: String
  },
  backdropPath: {
    type: String
  },
  voteAverage: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  originCountry: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  streamingUrl: {
    type: String
  },
  vidsrcUrl: {
    type: String
  },
  imdbId: {
    type: String
  },
  externalIds: {
    imdbId: String,
    freebaseId: String,
    freebaseMid: String,
    tvdbId: Number,
    tvrageId: Number,
    wikidataId: String,
    facebookId: String,
    instagramId: String,
    twitterId: String
  },
  keywords: [String],
  watchProviders: {
    flatrate: [{
      providerId: Number,
      providerName: String,
      logoPath: String
    }],
    buy: [{
      providerId: Number,
      providerName: String,
      logoPath: String
    }],
    rent: [{
      providerId: Number,
      providerName: String,
      logoPath: String
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
// tmdbId index is automatically created by unique: true
tvShowSchema.index({ name: 'text', originalName: 'text', overview: 'text' });
tvShowSchema.index({ genres: 1 });
tvShowSchema.index({ firstAirDate: 1 });
tvShowSchema.index({ voteAverage: -1 });
tvShowSchema.index({ popularity: -1 });
tvShowSchema.index({ isAvailable: 1 });
tvShowSchema.index({ status: 1 });
tvShowSchema.index({ type: 1 });
tvShowSchema.index({ 'networks.name': 1 });

// Compound indexes for common queries
tvShowSchema.index({ isAvailable: 1, genres: 1 });
tvShowSchema.index({ isAvailable: 1, firstAirDate: -1 });
tvShowSchema.index({ isAvailable: 1, voteAverage: -1 });
tvShowSchema.index({ isAvailable: 1, popularity: -1 });
tvShowSchema.index({ isAvailable: 1, status: 1 });

module.exports = mongoose.model('TvShow', tvShowSchema);