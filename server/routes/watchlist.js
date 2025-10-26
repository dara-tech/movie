const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const TvShow = require('../models/TvShow');
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
      .populate('movie', 'title posterPath releaseDate voteAverage overview genres runtime')
      .populate('movie.genres', 'name')
      .populate('tvShow', 'name posterPath firstAirDate voteAverage overview genres')
      .populate('tvShow.genres', 'name')
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

// Add TV show to watchlist
router.post('/tvshows/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('Adding TV show to watchlist:', { tvShowId: id, userId });

    // Check if TV show exists
    const tvShow = await TvShow.findById(id);
    if (!tvShow) {
      console.log('TV show not found:', id);
      return res.status(404).json({ message: 'TV show not found' });
    }

    console.log('TV show found:', tvShow.name);

    // Check if already in watchlist
    const existingItem = await Watchlist.findOne({ 
      user: userId, 
      tvShow: id 
    });

    if (existingItem) {
      console.log('TV show already in watchlist');
      return res.status(400).json({ message: 'TV show already in watchlist' });
    }

    // Add to watchlist
    const watchlistItem = new Watchlist({
      user: userId,
      tvShow: id,
      type: 'tvshow',
      status: 'plan_to_watch'
    });

    console.log('Saving watchlist item:', watchlistItem);
    await watchlistItem.save();
    await watchlistItem.populate('tvShow', 'name posterPath firstAirDate voteAverage overview genres');
    await watchlistItem.populate('tvShow.genres', 'name');

    console.log('Successfully added to watchlist');
    res.status(201).json(watchlistItem);
  } catch (error) {
    console.error('Error adding TV show to watchlist:', error);
    
    // Handle duplicate key error (TV show already in watchlist)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'TV show already in watchlist' });
    }
    
    res.status(500).json({ message: 'Error adding TV show to watchlist' });
  }
});

// Update TV show watchlist status
router.put('/tvshows/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, review } = req.body;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOneAndUpdate(
      { user: userId, tvShow: id },
      { status, rating, review, watchedAt: status === 'completed' ? new Date() : null },
      { new: true }
    ).populate('tvShow', 'name posterPath firstAirDate voteAverage overview genres');

    if (!watchlistItem) {
      return res.status(404).json({ message: 'TV show not found in watchlist' });
    }

    res.json(watchlistItem);
  } catch (error) {
    console.error('Error updating TV show watchlist:', error);
    res.status(500).json({ message: 'Error updating TV show watchlist' });
  }
});

// Remove TV show from watchlist
router.delete('/tvshows/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOneAndDelete({ 
      user: userId, 
      tvShow: id 
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'TV show not found in watchlist' });
    }

    res.json({ message: 'TV show removed from watchlist' });
  } catch (error) {
    console.error('Error removing TV show from watchlist:', error);
    res.status(500).json({ message: 'Error removing TV show from watchlist' });
  }
});

module.exports = router;
