const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Super admin auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check specific permissions
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (user.role === 'super_admin') {
        return next();
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user has specific permission
      const hasPermission = user.permissions.some(permission => 
        permission.resource === resource && 
        permission.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Permission denied: ${action} on ${resource}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requirePermission
};
