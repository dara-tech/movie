const express = require('express');
const router = express.Router();
const { requireAdmin, requireSuperAdmin, requirePermission } = require('../middleware/adminAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');
const TvShow = require('../models/TvShow');
const Genre = require('../models/Genre');
const Watchlist = require('../models/Watchlist');
const WatchHistory = require('../models/WatchHistory');

// Apply admin middleware to all routes
router.use(requireAdmin);

// ==================== DASHBOARD & ANALYTICS ====================

// Get admin dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalMovies,
      totalTvShows,
      totalWatchlists,
      totalWatchHistory,
      recentUsers,
      popularMovies
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Movie.countDocuments(),
      TvShow.countDocuments(),
      Watchlist.countDocuments(),
      WatchHistory.countDocuments(),
      User.find({ isActive: true })
        .sort({ lastLogin: -1 })
        .limit(5)
        .select('username email lastLogin createdAt'),
      Movie.find({ isAvailable: true })
        .sort({ popularity: -1 })
        .limit(5)
        .select('title popularity voteAverage posterPath')
    ]);

    // Calculate growth metrics
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    const newMoviesThisMonth = await Movie.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth
        },
        content: {
          movies: totalMovies,
          tvShows: totalTvShows,
          newMoviesThisMonth
        },
        engagement: {
          watchlists: totalWatchlists,
          watchHistory: totalWatchHistory
        },
        recentUsers,
        popularMovies
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's watchlist and history
    const [watchlist, watchHistory] = await Promise.all([
      Watchlist.find({ user: req.params.id }).populate('movie', 'title posterPath'),
      WatchHistory.find({ user: req.params.id }).populate('movie', 'title posterPath')
    ]);

    res.json({
      success: true,
      data: {
        user,
        watchlist,
        watchHistory
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive, profile, preferences } = req.body;
    
    const updateData = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (profile) updateData.profile = profile;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ==================== CONTENT MANAGEMENT ====================

// Get all movies with admin controls
router.get('/movies', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      genre,
      year,
      isAvailable,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (genre) {
      query.genres = genre;
    }
    
    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: startDate, $lte: endDate };
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const movies = await Movie.find(query)
      .populate('genres', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch movies' });
  }
});

// Update movie availability
router.put('/movies/:id/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    ).populate('genres', 'name');

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, data: movie });
  } catch (error) {
    console.error('Update movie availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update movie' });
  }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Remove from all watchlists
    await Watchlist.deleteMany({ movie: req.params.id });
    
    // Remove from watch history
    await WatchHistory.deleteMany({ movie: req.params.id });

    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete movie' });
  }
});

// ==================== SYSTEM MANAGEMENT ====================

// Get system health
router.get('/system/health', async (req, res) => {
  try {
    const dbStats = await Movie.db.db.stats();
    
    const systemInfo = {
      database: {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    };

    res.json({ success: true, data: systemInfo });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ success: false, message: 'Failed to get system health' });
  }
});

// Get logs (placeholder - you can implement actual logging)
router.get('/system/logs', async (req, res) => {
  try {
    // This is a placeholder - implement actual log retrieval
    res.json({ 
      success: true, 
      data: { 
        logs: [],
        message: 'Log system not implemented yet' 
      } 
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get logs' });
  }
});

// ==================== ANALYTICS ====================

// Get user analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const [
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ lastLogin: { $gte: startDate } }),
      User.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsers,
        activeUsers,
        userGrowth
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user analytics' });
  }
});

// Get content analytics
router.get('/analytics/content', async (req, res) => {
  try {
    const [
      totalMovies,
      totalTvShows,
      totalGenres,
      popularGenres,
      contentByYear
    ] = await Promise.all([
      Movie.countDocuments(),
      TvShow.countDocuments(),
      Genre.countDocuments(),
      Movie.aggregate([
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $lookup: { from: 'genres', localField: '_id', foreignField: '_id', as: 'genre' } },
        { $unwind: '$genre' },
        { $project: { name: '$genre.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Movie.aggregate([
        {
          $group: {
            _id: { $year: '$releaseDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalMovies,
        totalTvShows,
        totalGenres,
        popularGenres,
        contentByYear
      }
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get content analytics' });
  }
});

module.exports = router;
