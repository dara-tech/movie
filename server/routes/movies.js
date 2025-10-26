const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (req) => {
  const { page, limit, genre, year, sortBy, order, search, minRating } = req.query;
  return `movies:${JSON.stringify({ page, limit, genre, year, sortBy, order, search, minRating })}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};
const Watchlist = require('../models/Watchlist');
const WatchHistory = require('../models/WatchHistory');
const auth = require('../middleware/auth');

// Create a new movie (admin only)
router.post('/', async (req, res) => {
  try {
    const movieData = req.body;
    
    // Check if movie already exists
    const existingMovie = await Movie.findOne({ title: movieData.title });
    if (existingMovie) {
      return res.status(409).json({ message: 'Movie already exists' });
    }

    const movie = new Movie({
      ...movieData,
      isAvailable: true,
      popularity: movieData.voteAverage || 0,
      voteCount: 0
    });

    await movie.save();
    await movie.populate('genres', 'name');
    
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ message: 'Error creating movie' });
  }
});

// Get all movies with pagination and filtering
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(req);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('📦 Serving from cache:', cacheKey);
      return res.json(cachedData);
    }

    const {
      page = 1,
      limit = 20,
      genre,
      year,
      sortBy = 'popularity',
      order = 'desc',
      search,
      minRating
    } = req.query;

    // Handle multiple genre parameters
    const genres = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    const query = { isAvailable: true };
    
    // Add genre filter
    if (genres.length > 0) {
      // Convert string IDs to ObjectIds
      const mongoose = require('mongoose');
      const genreObjectIds = genres.map(genreId => new mongoose.Types.ObjectId(genreId));
      query.genres = { $in: genreObjectIds };
    }
    
    // Add year filter
    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: startDate, $lte: endDate };
    }
    
    // Add rating filter
    if (minRating) {
      query.voteAverage = { $gte: parseFloat(minRating) };
    }

    // Add search filter with improved performance
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: searchRegex },
        { originalTitle: searchRegex },
        { overview: searchRegex },
        { 'genres.name': searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;


    const movies = await Movie.find(query)
      .populate('genres', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Movie.countDocuments(query);

    const response = {
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };

    // Cache the response
    setCachedData(cacheKey, response);
    console.log('💾 Cached response for:', cacheKey);

    res.json(response);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movies = await Movie.find({ isAvailable: true })
      .populate('genres', 'name')
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments({ isAvailable: true });

    res.json({
      movies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
});

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movies = await Movie.find({ isAvailable: true })
      .populate('genres', 'name')
      .sort({ voteAverage: -1, voteCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments({ isAvailable: true });

    res.json({
      movies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({ message: 'Error fetching trending movies' });
  }
});

// Get top-rated movies
router.get('/top-rated', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { 
      isAvailable: true,
      voteAverage: { $gte: 7.0 },
      voteCount: { $gte: 100 }
    };
    
    const movies = await Movie.find(query)
      .populate('genres', 'name')
      .sort({ voteAverage: -1, voteCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching top-rated movies:', error);
    res.status(500).json({ message: 'Error fetching top-rated movies' });
  }
});

// Get upcoming movies
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6); // Next 6 months
    
    const query = { 
      isAvailable: true,
      releaseDate: { 
        $gte: currentDate.toISOString().split('T')[0],
        $lte: futureDate.toISOString().split('T')[0]
      }
    };
    
    const movies = await Movie.find(query)
      .populate('genres', 'name')
      .sort({ releaseDate: 1, popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    res.status(500).json({ message: 'Error fetching upcoming movies' });
  }
});

// Get movies by genre
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const movies = await Movie.find({ 
      genres: genreId, 
      isAvailable: true 
    })
      .populate('genres', 'name')
      .sort({ popularity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments({ 
      genres: genreId, 
      isAvailable: true 
    });

    res.json({
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({ message: 'Error fetching movies by genre' });
  }
});

// Search movies
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { originalTitle: { $regex: query, $options: 'i' } },
        { overview: { $regex: query, $options: 'i' } }
      ],
      isAvailable: true
    })
      .populate('genres', 'name')
      .sort({ popularity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { originalTitle: { $regex: query, $options: 'i' } },
        { overview: { $regex: query, $options: 'i' } }
      ],
      isAvailable: true
    });

    res.json({
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ message: 'Error searching movies' });
  }
});

// Add movie to watchlist
router.post('/:id/watchlist', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'plan_to_watch' } = req.body;

    const existingItem = await Watchlist.findOne({
      user: req.user.id,
      movie: id
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    const watchlistItem = new Watchlist({
      user: req.user.id,
      movie: id,
      type: 'movie',
      status
    });

    await watchlistItem.save();
    await watchlistItem.populate('movie', 'title posterPath releaseDate');

    res.json(watchlistItem);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    
    // Handle duplicate key error (movie already in watchlist)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }
    
    res.status(500).json({ message: 'Error adding to watchlist' });
  }
});

// Remove movie from watchlist
router.delete('/:id/watchlist', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const watchlistItem = await Watchlist.findOneAndDelete({
      user: req.user.id,
      movie: id
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Movie not in watchlist' });
    }

    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Error removing from watchlist' });
  }
});

// Update watchlist item
router.put('/:id/watchlist', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, review } = req.body;

    const watchlistItem = await Watchlist.findOneAndUpdate(
      { user: req.user.id, movie: id },
      { status, rating, review, watchedAt: status === 'watched' ? new Date() : null },
      { new: true }
    ).populate('movie', 'title posterPath releaseDate');

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Movie not in watchlist' });
    }

    res.json(watchlistItem);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ message: 'Error updating watchlist' });
  }
});

// Record watch history
router.post('/:id/watch', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, completed, lastPosition } = req.body;

    const watchHistory = new WatchHistory({
      user: req.user.id,
      movie: id,
      duration,
      completed,
      lastPosition
    });

    await watchHistory.save();
    res.json(watchHistory);
  } catch (error) {
    console.error('Error recording watch history:', error);
    res.status(500).json({ message: 'Error recording watch history' });
  }
});

// Get movie by ID (must be last to avoid conflicts with specific routes)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('genres', 'name');
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Error fetching movie' });
  }
});

module.exports = router;
