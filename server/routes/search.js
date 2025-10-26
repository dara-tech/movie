const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Get movie title suggestions
    const movieSuggestions = await Movie.find({
      $or: [
        { title: searchRegex },
        { originalTitle: searchRegex }
      ],
      isAvailable: true
    })
    .select('title originalTitle')
    .limit(5)
    .lean();

    // Get genre suggestions
    const genreSuggestions = await Genre.find({
      name: searchRegex
    })
    .select('name')
    .limit(3)
    .lean();

    // Format suggestions
    const suggestions = [
      ...movieSuggestions.map(movie => ({
        type: 'movie',
        text: movie.title,
        value: movie.title
      })),
      ...genreSuggestions.map(genre => ({
        type: 'genre',
        text: `${genre.name} movies`,
        value: genre.name
      }))
    ];

    res.json({ suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
});

// Get trending search terms
router.get('/trending', async (req, res) => {
  try {
    // In a real app, you'd track search analytics
    // For now, return popular genres and recent movies
    const popularGenres = await Genre.find({})
      .select('name')
      .limit(5)
      .lean();

    const recentMovies = await Movie.find({ isAvailable: true })
      .select('title')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const trending = [
      ...popularGenres.map(genre => ({
        type: 'genre',
        text: `${genre.name} movies`,
        value: genre.name
      })),
      ...recentMovies.map(movie => ({
        type: 'movie',
        text: movie.title,
        value: movie.title
      }))
    ];

    res.json({ trending });
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    res.status(500).json({ message: 'Error fetching trending searches' });
  }
});

// Main search endpoint
router.get('/', async (req, res) => {
  try {
    const { q, page = 1, limit = 20, sortBy = 'popularity', order = 'desc' } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({
        movies: [],
        totalPages: 0,
        currentPage: 1,
        total: 0
      });
    }

    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    const query = {
      $or: [
        { title: searchRegex },
        { originalTitle: searchRegex },
        { overview: searchRegex }
      ],
      isAvailable: true
    };

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [movies, total] = await Promise.all([
      Movie.find(query)
        .populate('genres', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Movie.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      movies,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ message: 'Error searching movies' });
  }
});

module.exports = router;
