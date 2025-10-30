const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout',
      'user_create', 'user_update', 'user_delete', 'user_activate', 'user_deactivate',
      'movie_create', 'movie_update', 'movie_delete', 'movie_availability',
      'tvshow_create', 'tvshow_update', 'tvshow_delete', 'tvshow_availability',
      'genre_create', 'genre_update', 'genre_delete',
      'sync_start', 'sync_stop', 'sync_configure',
      'settings_update',
      'system_backup', 'system_restore',
      'api_key_create', 'api_key_delete'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'movie', 'tvshow', 'genre', 'watchlist', 'watch_history', 'system', 'settings', 'api', 'sync']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceRef'
  },
  resourceRef: {
    type: String,
    enum: ['User', 'Movie', 'TvShow', 'Genre', null]
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
adminActivitySchema.index({ admin: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });
adminActivitySchema.index({ resource: 1, createdAt: -1 });
adminActivitySchema.index({ createdAt: -1 });

// Populate admin details automatically
adminActivitySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'admin',
    select: 'username email role'
  });
  next();
});

module.exports = mongoose.model('AdminActivity', adminActivitySchema);

