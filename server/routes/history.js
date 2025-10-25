const express = require('express');
const router = express.Router();
const WatchHistory = require('../models/WatchHistory');
const auth = require('../middleware/auth');

// Get user's watch history
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const history = await WatchHistory.find({ user: req.user.id })
      .populate('movie', 'title posterPath releaseDate voteAverage')
      .sort({ watchedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WatchHistory.countDocuments({ user: req.user.id });

    res.json({
      history,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ message: 'Error fetching watch history' });
  }
});

// Get recently watched movies
router.get('/recent', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentMovies = await WatchHistory.find({ user: req.user.id })
      .populate('movie', 'title posterPath releaseDate voteAverage')
      .sort({ watchedAt: -1 })
      .limit(parseInt(limit));

    res.json(recentMovies);
  } catch (error) {
    console.error('Error fetching recent movies:', error);
    res.status(500).json({ message: 'Error fetching recent movies' });
  }
});

// Get continue watching (incomplete movies)
router.get('/continue', auth, async (req, res) => {
  try {
    const continueWatching = await WatchHistory.find({ 
      user: req.user.id,
      completed: false
    })
      .populate('movie', 'title posterPath releaseDate voteAverage runtime')
      .sort({ watchedAt: -1 });

    res.json(continueWatching);
  } catch (error) {
    console.error('Error fetching continue watching:', error);
    res.status(500).json({ message: 'Error fetching continue watching' });
  }
});

module.exports = router;
