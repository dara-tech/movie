const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const auth = require('../middleware/auth');

// Get user's watchlist
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const watchlist = await Watchlist.find(query)
      .populate('movie', 'title posterPath releaseDate voteAverage overview genres')
      .populate('movie.genres', 'name')
      .sort({ addedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Watchlist.countDocuments(query);

    res.json({
      watchlist,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Error fetching watchlist' });
  }
});

// Get watchlist stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Watchlist.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      want_to_watch: 0,
      watching: 0,
      watched: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching watchlist stats:', error);
    res.status(500).json({ message: 'Error fetching watchlist stats' });
  }
});

module.exports = router;
