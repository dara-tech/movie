const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  },
  tvShow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TvShow'
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastPosition: {
    type: Number, // in seconds
    default: 0
  },
  season: {
    type: Number,
    default: 1
  },
  episode: {
    type: Number,
    default: 1
  }
});

// Ensure either movie or tvShow is provided
watchHistorySchema.pre('validate', function(next) {
  if (!this.movie && !this.tvShow) {
    return next(new Error('Either movie or tvShow must be provided'));
  }
  if (this.movie && this.tvShow) {
    return next(new Error('Cannot have both movie and tvShow'));
  }
  next();
});

// Index for efficient queries
watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ user: 1, movie: 1 });
watchHistorySchema.index({ user: 1, tvShow: 1, season: 1, episode: 1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
