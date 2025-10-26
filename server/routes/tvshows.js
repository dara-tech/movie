const express = require('express');
const router = express.Router();
const TvShow = require('../models/TvShow');
const Genre = require('../models/Genre');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (req) => {
  const { page, limit, genre, year, sortBy, order, search, minRating, status, type } = req.query;
  return `tvshows:${JSON.stringify({ page, limit, genre, year, sortBy, order, search, minRating, status, type })}`;
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

// Get all TV shows with pagination and filtering
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(req);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('📦 Serving TV shows from cache:', cacheKey);
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
      minRating,
      status,
      type
    } = req.query;

    // Handle multiple genre parameters
    const genreIds = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    const query = { isAvailable: true };

    if (genreIds.length > 0) {
      query.genres = { $in: genreIds };
    }

    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.firstAirDate = { $gte: startDate, $lte: endDate };
    }
    
    // Add rating filter
    if (minRating) {
      query.voteAverage = { $gte: parseFloat(minRating) };
    }

    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { originalName: searchRegex },
        { overview: searchRegex },
        { 'genres.name': searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tvShows, total] = await Promise.all([
      TvShow.find(query)
        .populate('genres', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TvShow.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    const response = {
      tvShows,
      total,
      page: parseInt(page),
      totalPages,
      hasMore: parseInt(page) < totalPages
    };

    // Cache the response
    setCachedData(cacheKey, response);
    console.log('💾 Cached TV shows response for:', cacheKey);

    res.json(response);
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    res.status(500).json({ message: 'Error fetching TV shows' });
  }
});

// Get popular TV shows
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tvShows, total] = await Promise.all([
      TvShow.find({ isAvailable: true })
        .populate('genres', 'name')
        .sort({ popularity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TvShow.countDocuments({ isAvailable: true })
    ]);

    res.json({
      tvShows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    res.status(500).json({ message: 'Error fetching popular TV shows' });
  }
});

// Get top-rated TV shows
router.get('/top-rated', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tvShows, total] = await Promise.all([
      TvShow.find({ isAvailable: true, voteCount: { $gte: 100 } })
        .populate('genres', 'name')
        .sort({ voteAverage: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TvShow.countDocuments({ isAvailable: true, voteCount: { $gte: 100 } })
    ]);

    res.json({
      tvShows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching top-rated TV shows:', error);
    res.status(500).json({ message: 'Error fetching top-rated TV shows' });
  }
});

// Get trending TV shows
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tvShows, total] = await Promise.all([
      TvShow.find({ isAvailable: true })
        .populate('genres', 'name')
        .sort({ popularity: -1, voteAverage: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TvShow.countDocuments({ isAvailable: true })
    ]);

    res.json({
      tvShows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching trending TV shows:', error);
    res.status(500).json({ message: 'Error fetching trending TV shows' });
  }
});

// Get TV shows by genre
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tvShows, total] = await Promise.all([
      TvShow.find({ 
        isAvailable: true, 
        genres: genreId 
      })
        .populate('genres', 'name')
        .sort({ popularity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TvShow.countDocuments({ 
        isAvailable: true, 
        genres: genreId 
      })
    ]);

    res.json({
      tvShows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching TV shows by genre:', error);
    res.status(500).json({ message: 'Error fetching TV shows by genre' });
  }
});

// Get single TV show by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let tvShow;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      tvShow = await TvShow.findById(id).populate('genres', 'name');
    } else {
      // TMDB ID
      tvShow = await TvShow.findOne({ tmdbId: parseInt(id) }).populate('genres', 'name');
    }

    if (!tvShow) {
      return res.status(404).json({ message: 'TV show not found' });
    }

    res.json(tvShow);
  } catch (error) {
    console.error('Error fetching TV show:', error);
    res.status(500).json({ message: 'Error fetching TV show' });
  }
});

// Get TV show seasons
router.get('/:id/seasons', async (req, res) => {
  try {
    const { id } = req.params;
    
    let tvShow;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      tvShow = await TvShow.findById(id);
    } else {
      tvShow = await TvShow.findOne({ tmdbId: parseInt(id) });
    }

    if (!tvShow) {
      return res.status(404).json({ message: 'TV show not found' });
    }

    res.json({
      seasons: tvShow.seasons,
      numberOfSeasons: tvShow.numberOfSeasons,
      numberOfEpisodes: tvShow.numberOfEpisodes
    });
  } catch (error) {
    console.error('Error fetching TV show seasons:', error);
    res.status(500).json({ message: 'Error fetching TV show seasons' });
  }
});

// Get TV show status options
router.get('/meta/statuses', (req, res) => {
  res.json([
    { value: 'all', label: 'All Status' },
    { value: 'Returning Series', label: 'Returning Series' },
    { value: 'Planned', label: 'Planned' },
    { value: 'In Production', label: 'In Production' },
    { value: 'Ended', label: 'Ended' },
    { value: 'Canceled', label: 'Canceled' },
    { value: 'Pilot', label: 'Pilot' }
  ]);
});

// Get TV show type options
router.get('/meta/types', (req, res) => {
  res.json([
    { value: 'all', label: 'All Types' },
    { value: 'Scripted', label: 'Scripted' },
    { value: 'Reality', label: 'Reality' },
    { value: 'Documentary', label: 'Documentary' },
    { value: 'News', label: 'News' },
    { value: 'Talk Show', label: 'Talk Show' },
    { value: 'Miniseries', label: 'Miniseries' }
  ]);
});

module.exports = router;
