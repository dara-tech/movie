const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');
const vidsrcService = require('../services/vidsrcService');
const Movie = require('../models/Movie');
const TvShow = require('../models/TvShow');

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

// Sync TV shows from TMDB to database
router.post('/tvshows', async (req, res) => {
  try {
    const { 
      maxPages = 5, 
      categories = 'popular,trending,top_rated,on_the_air',
      includeGenres = true 
    } = req.query;
    
    console.log(`🔄 Starting comprehensive TV show sync from TMDB`);
    console.log(`📊 Max pages: ${maxPages}, Categories: ${categories}, Include genres: ${includeGenres}`);
    
    // Parse categories
    const categoryList = categories.split(',').map(cat => cat.trim());
    
    // Use the comprehensive sync method
    const result = await tmdbService.syncTvShowsToDatabase({
      maxPages: parseInt(maxPages),
      categories: categoryList,
      includeGenres: includeGenres === 'true'
    });
    
    res.json({ 
      message: 'TV shows synced successfully from TMDB',
      synced: result.synced,
      errors: result.errors,
      categories: categoryList,
      maxPages: parseInt(maxPages)
    });
  } catch (error) {
    console.error('Error syncing TV shows:', error);
    res.status(500).json({ message: 'Error syncing TV shows from TMDB' });
  }
});

// Bulk sync TV shows from TMDB (comprehensive sync)
router.post('/tvshows/bulk', async (req, res) => {
  try {
    const { 
      maxPages = 10, 
      categories = 'popular,trending,top_rated,on_the_air,airing_today',
      includeGenres = true,
      skipExisting = true
    } = req.body;
    
    console.log(`🔄 Starting bulk TV show sync from TMDB`);
    console.log(`📊 Configuration:`, { maxPages, categories, includeGenres, skipExisting });
    
    // Parse categories
    const categoryList = Array.isArray(categories) ? categories : categories.split(',').map(cat => cat.trim());
    
    // Use the comprehensive sync method
    const result = await tmdbService.syncTvShowsToDatabase({
      maxPages: parseInt(maxPages),
      categories: categoryList,
      includeGenres: includeGenres === true || includeGenres === 'true'
    });
    
    res.json({ 
      message: 'Bulk TV show sync completed successfully',
      synced: result.synced,
      errors: result.errors,
      categories: categoryList,
      maxPages: parseInt(maxPages),
      includeGenres: includeGenres === true || includeGenres === 'true'
    });
  } catch (error) {
    console.error('Error during bulk TV show sync:', error);
    res.status(500).json({ message: 'Error during bulk TV show sync from TMDB' });
  }
});

// Generate Vidsrc URLs for existing movies
router.post('/vidsrc-urls', async (req, res) => {
  try {
    const movies = await Movie.find({ 
      $and: [
        {
          $or: [
            { vidsrcUrl: { $exists: false } },
            { vidsrcUrl: null },
            { vidsrcUrl: '' }
          ]
        },
        {
          $or: [
            { tmdbId: { $exists: true, $ne: null } },
            { imdbId: { $exists: true, $ne: null } }
          ]
        }
      ]
    });

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log(`Found ${movies.length} movies without vidsrc URLs`);

    for (const movie of movies) {
      try {
        // If movie doesn't have imdbId but has tmdbId, try to fetch it
        let imdbId = movie.imdbId;
        if (!imdbId && movie.tmdbId) {
          try {
            const movieDetails = await tmdbService.getMovieDetails(movie.tmdbId);
            if (movieDetails?.external_ids?.imdb_id) {
              imdbId = movieDetails.external_ids.imdb_id;
              // Update movie with IMDB ID for future use
              await Movie.findByIdAndUpdate(movie._id, { 
                imdbId,
                updatedAt: new Date()
              });
            }
          } catch (error) {
            console.warn(`Could not fetch IMDB ID for movie ${movie.title}:`, error.message);
          }
        }

        // Generate vidsrc URL if we have at least tmdbId or imdbId
        if (movie.tmdbId || imdbId) {
          const vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
            tmdbId: movie.tmdbId,
            imdbId: imdbId
          });

          if (vidsrcUrl) {
            await Movie.findByIdAndUpdate(movie._id, { 
              vidsrcUrl,
              imdbId: imdbId || movie.imdbId, // Update IMDB ID if we fetched it
              updatedAt: new Date()
            });
            updatedCount++;
            
            if (updatedCount % 50 === 0) {
              console.log(`Progress: ${updatedCount} movies updated...`);
            }
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
          console.warn(`Skipping movie ${movie.title}: No tmdbId or imdbId`);
        }

        // Rate limiting to avoid overwhelming TMDB API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Could not generate Vidsrc URL for movie ${movie.title}:`, error.message);
        errorCount++;
      }
    }

    res.json({ 
      message: `Vidsrc URLs generation completed`,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: movies.length
    });
  } catch (error) {
    console.error('Error generating Vidsrc URLs:', error);
    res.status(500).json({ message: 'Error generating Vidsrc URLs' });
  }
});

// Generate Vidsrc URLs for existing TV shows
router.post('/vidsrc-urls-tvshows', async (req, res) => {
  try {
    const tvShows = await TvShow.find({ 
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

    for (const tvShow of tvShows) {
      try {
        const vidsrcUrl = vidsrcService.generateTvShowStreamingUrl({
          tmdbId: tvShow.tmdbId,
          imdbId: tvShow.imdbId
        });

        if (vidsrcUrl) {
          await TvShow.findByIdAndUpdate(tvShow._id, { vidsrcUrl });
          updatedCount++;
          console.log(`✅ Generated Vidsrc URL for TV show: ${tvShow.name}`);
        }
      } catch (error) {
        console.warn(`Could not generate Vidsrc URL for TV show ${tvShow.name}:`, error.message);
        errorCount++;
      }
    }

    res.json({ 
      message: `Vidsrc URLs generated successfully for TV shows`,
      updated: updatedCount,
      errors: errorCount,
      total: tvShows.length
    });
  } catch (error) {
    console.error('Error generating Vidsrc URLs for TV shows:', error);
    res.status(500).json({ message: 'Error generating Vidsrc URLs for TV shows' });
  }
});

module.exports = router;
