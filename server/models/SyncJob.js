const mongoose = require('mongoose');

const syncJobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['movies', 'tvshows', 'genres', 'users', 'all']
  },
  status: {
    type: String,
    required: true,
    enum: ['idle', 'running', 'completed', 'failed', 'paused'],
    default: 'idle'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastRun: {
    type: Date,
    default: null
  },
  nextRun: {
    type: Date,
    default: null
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedTime: {
    type: String,
    default: 'Unknown'
  },
  itemsProcessed: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  lastError: {
    type: Date,
    default: null
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
syncJobSchema.index({ type: 1, status: 1 });
syncJobSchema.index({ isEnabled: 1 });

module.exports = mongoose.model('SyncJob', syncJobSchema);
