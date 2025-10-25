const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');
const vidsrcService = require('../services/vidsrcService');
const Movie = require('../models/Movie');

// Sync movies from TMDB to database
router.post('/movies', async (req, res) => {
  try {
    await tmdbService.syncMoviesToDatabase();
    res.json({ message: 'Movies synced successfully from TMDB' });
  } catch (error) {
    console.error('Error syncing movies:', error);
    res.status(500).json({ message: 'Error syncing movies from TMDB' });
  }
});

// Sync genres from TMDB to database
router.post('/genres', async (req, res) => {
  try {
    const Genre = require('../models/Genre');
    const genresResponse = await tmdbService.getGenres();
    
    for (const genre of genresResponse.genres) {
      await Genre.findOneAndUpdate(
        { tmdbId: genre.id },
        { name: genre.name },
        { upsert: true, new: true }
      );
    }
    
    res.json({ message: 'Genres synced successfully from TMDB' });
  } catch (error) {
    console.error('Error syncing genres:', error);
    res.status(500).json({ message: 'Error syncing genres from TMDB' });
  }
});

// Generate Vidsrc URLs for existing movies
router.post('/vidsrc-urls', async (req, res) => {
  try {
    const movies = await Movie.find({ 
      $or: [
        { vidsrcUrl: { $exists: false } },
        { vidsrcUrl: null }
      ],
      $or: [
        { tmdbId: { $exists: true } },
        { imdbId: { $exists: true } }
      ]
    });

    let updatedCount = 0;
    let errorCount = 0;

    for (const movie of movies) {
      try {
        const vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
          tmdbId: movie.tmdbId,
          imdbId: movie.imdbId
        });

        if (vidsrcUrl) {
          await Movie.findByIdAndUpdate(movie._id, { vidsrcUrl });
          updatedCount++;
        }
      } catch (error) {
        console.warn(`Could not generate Vidsrc URL for movie ${movie.title}:`, error.message);
        errorCount++;
      }
    }

    res.json({ 
      message: `Vidsrc URLs generated successfully`,
      updated: updatedCount,
      errors: errorCount,
      total: movies.length
    });
  } catch (error) {
    console.error('Error generating Vidsrc URLs:', error);
    res.status(500).json({ message: 'Error generating Vidsrc URLs' });
  }
});

module.exports = router;
