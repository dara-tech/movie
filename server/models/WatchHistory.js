const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
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
  }
});

// Index for efficient queries
watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ user: 1, movie: 1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
