const express = require('express');
const router = express.Router();
const vidsrcService = require('../services/vidsrcService');
const Movie = require('../models/Movie');
const TvShow = require('../models/TvShow');
const Episode = require('../models/Episode');

// Get Vidsrc streaming URL for a movie
router.get('/movie/:movieId/stream', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { subUrl, dsLang, autoplay } = req.query;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const options = {};
    if (subUrl) options.subUrl = subUrl;
    if (dsLang) options.dsLang = dsLang;
    if (autoplay !== undefined) options.autoplay = parseInt(autoplay);

    const streamingUrl = vidsrcService.generateMovieStreamingUrl(movie, options);
    
    if (!streamingUrl) {
      return res.status(400).json({ error: 'Could not generate streaming URL' });
    }

    res.json({ 
      streamingUrl,
      movie: {
        id: movie._id,
        title: movie.title,
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId
      }
    });
  } catch (error) {
    console.error('Error generating movie streaming URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Vidsrc streaming URL for a TV show
router.get('/tv/:tvShowId/stream', async (req, res) => {
  try {
    const { tvShowId } = req.params;
    const { dsLang } = req.query;

    const tvShow = await TvShow.findById(tvShowId);
    if (!tvShow) {
      return res.status(404).json({ error: 'TV show not found' });
    }

    const options = {};
    if (dsLang) options.dsLang = dsLang;

    const streamingUrl = vidsrcService.generateTvShowStreamingUrl(tvShow, options);
    
    if (!streamingUrl) {
      return res.status(400).json({ error: 'Could not generate streaming URL' });
    }

    res.json({ 
      streamingUrl,
      tvShow: {
        id: tvShow._id,
        name: tvShow.name,
        tmdbId: tvShow.tmdbId,
        imdbId: tvShow.imdbId
      }
    });
  } catch (error) {
    console.error('Error generating TV show streaming URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Vidsrc streaming URL for a specific episode
router.get('/tv/:tvShowId/season/:season/episode/:episode/stream', async (req, res) => {
  try {
    const { tvShowId, season, episode } = req.params;
    const { subUrl, dsLang, autoplay, autonext } = req.query;

    const tvShow = await TvShow.findById(tvShowId);
    if (!tvShow) {
      return res.status(404).json({ error: 'TV show not found' });
    }

    const options = {};
    if (subUrl) options.subUrl = subUrl;
    if (dsLang) options.dsLang = dsLang;
    if (autoplay !== undefined) options.autoplay = parseInt(autoplay);
    if (autonext !== undefined) options.autonext = parseInt(autonext);

    const streamingUrl = vidsrcService.generateEpisodeStreamingUrl(
      tvShow, 
      parseInt(season), 
      parseInt(episode), 
      options
    );
    
    if (!streamingUrl) {
      return res.status(400).json({ error: 'Could not generate streaming URL' });
    }

    res.json({ 
      streamingUrl,
      tvShow: {
        id: tvShow._id,
        name: tvShow.name,
        tmdbId: tvShow.tmdbId,
        imdbId: tvShow.imdbId
      },
      episode: {
        season: parseInt(season),
        episode: parseInt(episode)
      }
    });
  } catch (error) {
    console.error('Error generating episode streaming URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest movies from Vidsrc
router.get('/movies/latest/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const latestMovies = await vidsrcService.getLatestMovies(parseInt(page));
    res.json(latestMovies);
  } catch (error) {
    console.error('Error fetching latest movies from Vidsrc:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest TV shows from Vidsrc
router.get('/tvshows/latest/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const latestTvShows = await vidsrcService.getLatestTvShows(parseInt(page));
    res.json(latestTvShows);
  } catch (error) {
    console.error('Error fetching latest TV shows from Vidsrc:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest episodes from Vidsrc
router.get('/episodes/latest/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const latestEpisodes = await vidsrcService.getLatestEpisodes(parseInt(page));
    res.json(latestEpisodes);
  } catch (error) {
    console.error('Error fetching latest episodes from Vidsrc:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Vidsrc URL for any content by external IDs
router.post('/generate-url', async (req, res) => {
  try {
    const { type, imdbId, tmdbId, season, episode, options = {} } = req.body;

    if (!type || (!imdbId && !tmdbId)) {
      return res.status(400).json({ 
        error: 'Type and either imdbId or tmdbId are required' 
      });
    }

    let streamingUrl;

    switch (type) {
      case 'movie':
        streamingUrl = vidsrcService.getMovieEmbedUrl(imdbId, tmdbId, options);
        break;
      case 'tv':
        if (season && episode) {
          streamingUrl = vidsrcService.getEpisodeEmbedUrl(imdbId, tmdbId, season, episode, options);
        } else {
          streamingUrl = vidsrcService.getTvShowEmbedUrl(imdbId, tmdbId, options);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Must be "movie" or "tv"' });
    }

    res.json({ streamingUrl });
  } catch (error) {
    console.error('Error generating Vidsrc URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
