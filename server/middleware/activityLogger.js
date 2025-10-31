const AdminActivity = require('../models/AdminActivity');

/**
 * Middleware to log admin activities
 * @param {Object} options - Configuration options
 * @param {String} options.action - Action type (e.g., 'user_update', 'movie_delete')
 * @param {String} options.resource - Resource type (e.g., 'user', 'movie')
 * @param {Function} options.getDescription - Function to generate description from req
 * @param {Function} options.getResourceId - Function to get resource ID from req
 * @param {Function} options.getDetails - Function to get additional details from req
 */
const logActivity = (options = {}) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalStatus = res.status;

    let activityLogged = false;

    // Override res.json to capture response
    res.json = function(data) {
      const success = data.success !== false;

      if (!activityLogged) {
        // Log the activity
        logActivityInternal(req, res, {
          ...options,
          success,
          errorMessage: success ? null : data.message || 'Unknown error'
        }).catch(err => {
          console.error('Failed to log activity:', err);
        });
        
        activityLogged = true;
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    // Override res.status to capture error status
    res.status = function(statusCode) {
      if (statusCode >= 400 && !activityLogged) {
        // Log failed activity
        logActivityInternal(req, res, {
          ...options,
          success: false,
          errorMessage: `HTTP ${statusCode}`
        }).catch(err => {
          console.error('Failed to log activity:', err);
        });
        
        activityLogged = true;
      }
      return originalStatus.call(this, statusCode);
    };

    next();
  };
};

/**
 * Internal function to log activity to database
 */
async function logActivityInternal(req, res, options) {
  try {
    const {
      action,
      resource,
      getDescription,
      getResourceId,
      getDetails,
      success = true,
      errorMessage
    } = options;

    // Get admin info from req.user (set by adminAuth middleware)
    if (!req.user) {
      return; // No admin info, skip logging
    }

    // Build activity data
    const activityData = {
      admin: req.user._id || req.user.id,
      action,
      resource,
      success,
      description: typeof getDescription === 'function' 
        ? getDescription(req) 
        : `${action} on ${resource}`,
      resourceId: typeof getResourceId === 'function' 
        ? getResourceId(req) 
        : req.params.id,
      resourceRef: resource.charAt(0).toUpperCase() + resource.slice(1),
      details: typeof getDetails === 'function' 
        ? getDetails(req) 
        : {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      errorMessage
    };

    // Create and save activity log
    const activity = new AdminActivity(activityData);
    await activity.save();

    console.log(`[ADMIN ACTIVITY] ${req.user.username || req.user.email} - ${action} on ${resource}`);
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}

/**
 * Helper function to create activity logger with common patterns
 */
const createActivityLogger = {
  // User management activities
  userUpdate: () => logActivity({
    action: 'user_update',
    resource: 'user',
    getDescription: (req) => {
      const changes = [];
      if (req.body.role) changes.push(`role to ${req.body.role}`);
      if (req.body.isActive !== undefined) changes.push(`status to ${req.body.isActive ? 'active' : 'inactive'}`);
      return `Updated user ${req.params.id}: ${changes.join(', ')}`;
    },
    getDetails: (req) => ({ changes: req.body })
  }),

  userDelete: () => logActivity({
    action: 'user_deactivate',
    resource: 'user',
    getDescription: (req) => `Deactivated user ${req.params.id}`
  }),

  // Movie management activities
  movieAvailability: () => logActivity({
    action: 'movie_availability',
    resource: 'movie',
    getDescription: (req) => `Changed availability of movie ${req.params.id} to ${req.body.isAvailable ? 'available' : 'unavailable'}`,
    getDetails: (req) => ({ isAvailable: req.body.isAvailable })
  }),

  movieDelete: () => logActivity({
    action: 'movie_delete',
    resource: 'movie',
    getDescription: (req) => `Deleted movie ${req.params.id}`
  }),

  // TV show management activities
  tvshowAvailability: () => logActivity({
    action: 'tvshow_availability',
    resource: 'tvshow',
    getDescription: (req) => `Changed availability of TV show ${req.params.id} to ${req.body.isAvailable ? 'available' : 'unavailable'}`,
    getDetails: (req) => ({ isAvailable: req.body.isAvailable })
  }),

  tvshowDelete: () => logActivity({
    action: 'tvshow_delete',
    resource: 'tvshow',
    getDescription: (req) => `Deleted TV show ${req.params.id}`
  }),

  // Genre management activities
  genreDelete: () => logActivity({
    action: 'genre_delete',
    resource: 'genre',
    getDescription: (req) => `Deleted genre ${req.params.id}`
  }),

  // Generic activity logger
  generic: (action, resource, getDescription, getDetails) => logActivity({
    action,
    resource,
    getDescription,
    getDetails
  })
};

module.exports = {
  logActivity,
  createActivityLogger
};

