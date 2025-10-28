const express = require('express');
const router = express.Router();
const TvShow = require('../models/TvShow');
const Genre = require('../models/Genre');
const tmdbService = require('../services/tmdbService');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear cache on startup
cache.clear();
console.log('📦 Cache cleared for TV shows');

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
    const genreParams = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    const query = { isAvailable: true };

    if (genreParams.length > 0) {
      console.log('🎭 Filtering TV shows by genres:', genreParams);
      // Find genre by name or ID
      const mongoose = require('mongoose');
      const genreIds = [];
      
      for (const genreParam of genreParams) {
        if (mongoose.Types.ObjectId.isValid(genreParam)) {
          // It's a valid ObjectId
          console.log(`  ✓ Valid ObjectId: ${genreParam}`);
          genreIds.push(new mongoose.Types.ObjectId(genreParam));
        } else {
          // It's a genre name, find the genre
          console.log(`  🔍 Looking up genre name: "${genreParam}"`);
          // Case-insensitive search
          const foundGenre = await Genre.findOne({ 
            name: { $regex: new RegExp(`^${genreParam}$`, 'i') }
          });
          if (foundGenre) {
            console.log(`  ✓ Found genre: ${foundGenre._id}`);
            genreIds.push(foundGenre._id);
          } else {
            console.log(`  ✗ Genre not found: "${genreParam}"`);
          }
        }
      }
      
      if (genreIds.length > 0) {
        console.log(`  ✅ Using ${genreIds.length} genre IDs:`, genreIds);
        query.genres = { $in: genreIds };
      } else {
        console.log(`  ⚠️  No valid genres found, skipping genre filter`);
      }
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

    // Fix seasons and fetch episode data if needed
    if (tvShow.seasons && tvShow.seasons.length > 0) {
      // Fetch season details from TMDB to get real episode counts
      const seasonsWithEpisodes = await Promise.all(
        tvShow.seasons.map(async (season, index) => {
          const seasonNumber = (season.seasonNumber != null && season.seasonNumber !== undefined) 
            ? season.seasonNumber 
            : index;
          
          let episodeCount = season.episodeCount || 0;
          
          // If episodeCount is 0 or undefined, try to fetch from TMDB
          // For Season 0, try fetching from season 1 if the name suggests it's actually season 1
          if ((!episodeCount || episodeCount === 0) && tvShow.tmdbId) {
            let tmdbSeasonToFetch = seasonNumber;
            
            // If season is 0 but name is "Season 1", try fetching from season 1
            if (seasonNumber === 0 && (
              season.name.toLowerCase().includes('season 1') || 
              season.name.toLowerCase().includes('season one')
            )) {
              tmdbSeasonToFetch = 1;
            }
            
            if (seasonNumber > 0 || tmdbSeasonToFetch === 1) {
              try {
                const tmdbSeasonData = await tmdbService.getTvShowEpisodes(tvShow.tmdbId, tmdbSeasonToFetch);
                episodeCount = tmdbSeasonData.episodes ? tmdbSeasonData.episodes.length : 0;
              } catch (error) {
                // Silently fail if TMDB doesn't have the season data
              }
            }
          }
          
          return {
            airDate: season.airDate,
            episodeCount: episodeCount,
            id: season.id,
            name: season.name,
            overview: season.overview,
            posterPath: season.posterPath,
            seasonNumber: seasonNumber,
            voteAverage: season.voteAverage
          };
        })
      );
      
      tvShow.seasons = seasonsWithEpisodes;
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
