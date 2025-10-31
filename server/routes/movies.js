const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear cache on startup
cache.clear();

// Cache helper functions
const getCacheKey = (req) => {
  const { page, limit, genre, year, sortBy, order, search, minRating, provider } = req.query;
  return `movies:${JSON.stringify({ page, limit, genre, year, sortBy, order, search, minRating, provider })}`;
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
const tmdbService = require('../services/tmdbService');

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
      provider // Streaming service provider ID (e.g., 8 for Netflix, 390 for Disney+)
    } = req.query;

    // Handle multiple genre parameters
    const genres = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    const query = { isAvailable: true };
    
    // Add genre filter
    if (genres.length > 0) {
      // Find genre by name or ID
      const genreIds = [];
      
      for (const genreParam of genres) {
        if (mongoose.Types.ObjectId.isValid(genreParam)) {
          // It's a valid ObjectId
          genreIds.push(new mongoose.Types.ObjectId(genreParam));
        } else {
          // It's a genre name, find the genre
          // Case-insensitive search
          const foundGenre = await Genre.findOne({ 
            name: { $regex: new RegExp(`^${genreParam}$`, 'i') }
          });
          if (foundGenre) {
            genreIds.push(foundGenre._id);
          }
        }
      }
      
      if (genreIds.length > 0) {
        query.genres = { $in: genreIds };
      }
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

    // Add streaming provider filter
    const providerFilter = [];
    if (provider) {
      const providerId = parseInt(provider);
      if (!isNaN(providerId)) {
        providerFilter.push(
          { 'watchProviders.flatrate.providerId': providerId },
          { 'watchProviders.buy.providerId': providerId },
          { 'watchProviders.rent.providerId': providerId }
        );
      }
    }

    // Add search filter with improved performance
    const searchFilter = [];
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      searchFilter.push(
        { title: searchRegex },
        { originalTitle: searchRegex },
        { overview: searchRegex },
        { 'genres.name': searchRegex }
      );
    }

    // Combine filters correctly
    if (providerFilter.length > 0 && searchFilter.length > 0) {
      // Both provider and search - need to match both conditions
      query.$and = [
        { $or: providerFilter },
        { $or: searchFilter }
      ];
    } else if (providerFilter.length > 0) {
      query.$or = providerFilter;
    } else if (searchFilter.length > 0) {
      query.$or = searchFilter;
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

// Get recommended movies based on user preferences
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    
    // Get user's watch history to understand preferences
    const watchHistory = await WatchHistory.find({ user: userId })
      .populate('movie')
      .sort({ watchedAt: -1 })
      .limit(50);

    const watchlist = await Watchlist.find({ user: userId })
      .populate('movie');

    // Extract genres from watched movies
    const genreFrequency = {};
    const movieIds = new Set();
    
    watchHistory.forEach(entry => {
      if (entry.movie && entry.movie.genres) {
        entry.movie.genres.forEach(genre => {
          const genreId = genre._id || genre;
          genreFrequency[genreId] = (genreFrequency[genreId] || 0) + 1;
        });
        movieIds.add(entry.movie._id.toString());
      }
    });

    watchlist.forEach(item => {
      if (item.movie && item.movie.genres) {
        item.movie.genres.forEach(genre => {
          const genreId = genre._id || genre;
          genreFrequency[genreId] = (genreFrequency[genreId] || 0) + 0.5;
        });
        movieIds.add(item.movie._id.toString());
      }
    });

    // Get top 5 preferred genres
    const topGenres = Object.entries(genreFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genreId]) => new mongoose.Types.ObjectId(genreId));

    // Find movies with similar genres that user hasn't seen
    let recommendations = [];
    
    if (topGenres.length > 0) {
      recommendations = await Movie.find({
        isAvailable: true,
        genres: { $in: topGenres },
        _id: { $nin: Array.from(movieIds) }
      })
        .populate('genres', 'name')
        .sort({ voteAverage: -1, popularity: -1 })
        .limit(parseInt(limit));
    }

    // If not enough recommendations, add popular movies
    if (recommendations.length < parseInt(limit)) {
      const popularMovies = await Movie.find({
        isAvailable: true,
        _id: { $nin: [...Array.from(movieIds), ...recommendations.map(m => m._id)] }
      })
        .populate('genres', 'name')
        .sort({ popularity: -1, voteAverage: -1 })
        .limit(parseInt(limit) - recommendations.length);
      
      recommendations.push(...popularMovies);
    }

    res.json({ movies: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Error fetching recommendations' });
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

// Get similar movies
router.get('/:id/similar', async (req, res) => {
  try {
    let movie;
    
    // Try to find by MongoDB _id first, then by tmdbId as fallback
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      movie = await Movie.findById(req.params.id);
    }
    
    if (!movie) {
      const tmdbIdNum = parseInt(req.params.id);
      if (!isNaN(tmdbIdNum)) {
        movie = await Movie.findOne({ tmdbId: tmdbIdNum });
      }
    }
    
    if (!movie || !movie.tmdbId) {
      return res.status(404).json({ message: 'Movie not found or missing TMDB ID' });
    }

    // Fetch similar movies from TMDB
    const axios = require('axios');
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.tmdbId}/similar`,
      {
        params: {
          api_key: tmdbApiKey,
          language: 'en-US',
          page: 1
        }
      }
    );

    // Get the first 10 similar movies and find them in our database
    const tmdbMovies = response.data.results.slice(0, 10);
    const similarMovies = [];

    for (const tmdbMovie of tmdbMovies) {
      const dbMovie = await Movie.findOne({ tmdbId: tmdbMovie.id }).populate('genres', 'name');
      if (dbMovie) {
        similarMovies.push({
          _id: dbMovie._id,
          title: dbMovie.title,
          posterPath: dbMovie.posterPath,
          releaseDate: dbMovie.releaseDate,
          voteAverage: dbMovie.voteAverage
        });
      }
    }

    res.json({ movies: similarMovies });
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    res.status(500).json({ message: 'Error fetching similar movies', error: error.message });
  }
});

// Get cast and crew for a movie
router.get('/:id/cast', async (req, res) => {
  try {
    let movie;
    
    // Try to find by MongoDB _id first, then by tmdbId as fallback
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      movie = await Movie.findById(req.params.id);
    }
    
    if (!movie) {
      const tmdbIdNum = parseInt(req.params.id);
      if (!isNaN(tmdbIdNum)) {
        movie = await Movie.findOne({ tmdbId: tmdbIdNum });
      }
    }
    
    if (!movie || !movie.tmdbId) {
      return res.status(404).json({ message: 'Movie not found or missing TMDB ID' });
    }

    // Fetch cast from TMDB
    const axios = require('axios');
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.tmdbId}/credits`,
      {
        params: {
          api_key: tmdbApiKey,
          language: 'en-US'
        }
      }
    );

    const { cast = [], crew = [] } = response.data;

    // Get top cast (first 20) and key crew
    const topCast = cast.slice(0, 20).map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profilePath: actor.profile_path,
      order: actor.order
    }));

    // Get key crew members (director, writer, producer, etc.)
    const keyCrew = crew
      .filter(person => 
        ['Director', 'Writer', 'Producer', 'Executive Producer', 'Screenplay'].includes(person.job)
      )
      .map(person => ({
        id: person.id,
        name: person.name,
        job: person.job,
        profilePath: person.profile_path
      }));

    res.json({ cast: topCast, crew: keyCrew });
  } catch (error) {
    console.error('Error fetching cast:', error);
    res.status(500).json({ message: 'Error fetching cast', error: error.message });
  }
});

// Get images for a movie
router.get('/:id/images', async (req, res) => {
  try {
    let movie;
    
    // Try to find by MongoDB _id first, then by tmdbId as fallback
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      movie = await Movie.findById(req.params.id);
    }
    
    if (!movie) {
      const tmdbIdNum = parseInt(req.params.id);
      if (!isNaN(tmdbIdNum)) {
        movie = await Movie.findOne({ tmdbId: tmdbIdNum });
      }
    }
    
    if (!movie || !movie.tmdbId) {
      return res.status(404).json({ message: 'Movie not found or missing TMDB ID' });
    }

    // Fetch images from TMDB
    const axios = require('axios');
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.tmdbId}/images`,
      {
        params: {
          api_key: tmdbApiKey
        }
      }
    );

    const images = response.data;
    
    // Extract and categorize images
    const backdrops = (images.backdrops || []).map(img => ({
      filePath: img.file_path,
      aspectRatio: img.aspect_ratio,
      height: img.height,
      width: img.width,
      voteAverage: img.vote_average,
      voteCount: img.vote_count
    }));

    const posters = (images.posters || []).map(img => ({
      filePath: img.file_path,
      aspectRatio: img.aspect_ratio,
      height: img.height,
      width: img.width,
      voteAverage: img.vote_average,
      voteCount: img.vote_count
    }));

    res.json({
      backdrops,
      posters
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
});

// Get trailers/videos for a movie
router.get('/:id/videos', async (req, res) => {
  try {
    let movie;
    
    // Try to find by MongoDB _id first, then by tmdbId as fallback
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      movie = await Movie.findById(req.params.id);
    }
    
    if (!movie) {
      const tmdbIdNum = parseInt(req.params.id);
      if (!isNaN(tmdbIdNum)) {
        movie = await Movie.findOne({ tmdbId: tmdbIdNum });
      }
    }
    
    if (!movie || !movie.tmdbId) {
      return res.status(404).json({ message: 'Movie not found or missing TMDB ID' });
    }

    // Fetch videos from TMDB
    const axios = require('axios');
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.tmdbId}/videos`,
      {
        params: {
          api_key: tmdbApiKey,
          language: 'en-US'
        }
      }
    );

    const videos = response.data.results || [];
    
    // Filter and categorize videos
    const trailers = videos.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    const teasers = videos.filter(v => v.type === 'Teaser' && v.site === 'YouTube');
    const clips = videos.filter(v => v.type === 'Clip' && v.site === 'YouTube');
    const featurettes = videos.filter(v => v.type === 'Featurette' && v.site === 'YouTube');
    const behindTheScenes = videos.filter(v => v.type === 'Behind the Scenes' && v.site === 'YouTube');

    res.json({
      trailers,
      teasers,
      clips,
      featurettes,
      behindTheScenes
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
});

// Get reviews for a movie
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;
    const skip = (page - 1) * limit;

    // Find the movie first to get its MongoDB _id
    let movieId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const tmdbIdNum = parseInt(req.params.id);
      if (!isNaN(tmdbIdNum)) {
        const movie = await Movie.findOne({ tmdbId: tmdbIdNum });
        if (movie) {
          movieId = movie._id;
        } else {
          return res.status(404).json({ message: 'Movie not found' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid movie ID' });
      }
    }

    // Get all watchlist items with reviews for this movie
    let reviews = await Watchlist.find({
      movie: movieId,
      review: { $exists: true, $ne: '' }
    })
      .populate('user', 'username email createdAt')
      .sort(sortBy === 'recent' ? { addedAt: -1 } : { rating: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Watchlist.countDocuments({
      movie: movieId,
      review: { $exists: true, $ne: '' }
    });

    // Get aggregated stats
    const stats = await Watchlist.aggregate([
      {
        $match: {
          movie: new mongoose.Types.ObjectId(movieId),
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (stats[0] && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        if (rating >= 5) ratingDistribution[5]++;
        else if (rating >= 4) ratingDistribution[4]++;
        else if (rating >= 3) ratingDistribution[3]++;
        else if (rating >= 2) ratingDistribution[2]++;
        else ratingDistribution[1]++;
      });
    }

    res.json({
      reviews: reviews.map(item => ({
        _id: item._id,
        user: {
          username: item.user.username,
          createdAt: item.user.createdAt
        },
        rating: item.rating,
        review: item.review,
        addedAt: item.addedAt
      })),
      stats: {
        totalReviews: total,
        averageRating: stats[0]?.averageRating || 0,
        ratingDistribution,
        totalRatings: stats[0]?.totalRatings || 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Get watch providers list (must be before /:id route)
router.get('/watch-providers', async (req, res) => {
  try {
    const providers = await tmdbService.getWatchProviders('movie');
    // Filter to only show popular streaming services
    const popularProviders = [
      8,    // Netflix
      9,    // Amazon Prime Video
      337,  // Disney+
      350,  // Apple TV+
      531,  // Paramount+
      283,  // Crunchyroll
      384,  // HBO Max
      521,  // Showtime
      386,  // Starz
      68,   // Microsoft Store
      15,   // Hulu
      1899  // Max
    ];
    
    const filteredProviders = providers.results.filter(p => popularProviders.includes(p.provider_id));
    res.json({ providers: filteredProviders });
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    res.status(500).json({ message: 'Error fetching watch providers' });
  }
});

// Get movie by ID (must be last to avoid conflicts with specific routes)
router.get('/:id', async (req, res) => {
  try {
    // Validate that ID is provided and is a valid MongoDB ObjectId
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    // Check if the ID is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid movie ID format' });
    }

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
