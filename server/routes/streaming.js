const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');

// Apply admin middleware to all routes
router.use(requireAdmin);

// Mock streaming services data - in production, this would come from a database
const streamingServices = [
  {
    id: 'vidsrc',
    name: 'Vidsrc',
    baseUrl: 'https://vidsrc.me',
    isEnabled: true,
    isWorking: true,
    lastChecked: new Date().toISOString(),
    responseTime: 150,
    successRate: 95,
    totalRequests: 1000,
    failedRequests: 50
  },
  {
    id: 'vidsrc-to',
    name: 'Vidsrc.to',
    baseUrl: 'https://vidsrc.to',
    isEnabled: true,
    isWorking: true,
    lastChecked: new Date().toISOString(),
    responseTime: 200,
    successRate: 90,
    totalRequests: 800,
    failedRequests: 80
  },
  {
    id: 'godrive',
    name: 'GodrivePlayer',
    baseUrl: 'https://godriveplayer.com',
    isEnabled: true,
    isWorking: false,
    lastChecked: new Date().toISOString(),
    responseTime: 5000,
    successRate: 60,
    totalRequests: 500,
    failedRequests: 200
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    baseUrl: 'https://multiembed.mov',
    isEnabled: false,
    isWorking: false,
    lastChecked: new Date().toISOString(),
    responseTime: null,
    successRate: 0,
    totalRequests: 0,
    failedRequests: 0
  }
];

// Get all streaming services
router.get('/services', async (req, res) => {
  try {
    res.json(streamingServices);
  } catch (error) {
    console.error('Error fetching streaming services:', error);
    res.status(500).json({ message: 'Error fetching streaming services' });
  }
});

// Get streaming statistics
router.get('/stats', async (req, res) => {
  try {
    const Movie = require('../models/Movie');
    const TvShow = require('../models/TvShow');
    
    // Get total counts
    const totalMovies = await Movie.countDocuments();
    const totalTvShows = await TvShow.countDocuments();
    
    // Get counts with streaming URLs
    const moviesWithStreaming = await Movie.countDocuments({
      $or: [
        { vidsrcUrl: { $exists: true, $ne: null } },
        { streamingUrl: { $exists: true, $ne: null } }
      ]
    });
    
    const tvShowsWithStreaming = await TvShow.countDocuments({
      $or: [
        { vidsrcUrl: { $exists: true, $ne: null } },
        { streamingUrl: { $exists: true, $ne: null } }
      ]
    });
    
    // Calculate working vs failed URLs
    const workingUrls = streamingServices.reduce((total, service) => {
      return total + (service.isWorking ? service.totalRequests - service.failedRequests : 0);
    }, 0);
    
    const failedUrls = streamingServices.reduce((total, service) => {
      return total + service.failedRequests;
    }, 0);
    
    const totalStreamingUrls = workingUrls + failedUrls;
    
    res.json({
      totalMovies,
      moviesWithStreaming,
      totalTvShows,
      tvShowsWithStreaming,
      totalStreamingUrls,
      workingUrls,
      failedUrls,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching streaming stats:', error);
    res.status(500).json({ message: 'Error fetching streaming statistics' });
  }
});

// Test a specific streaming service
router.post('/test/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = streamingServices.find(s => s.id === serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const startTime = Date.now();
    
    // Simulate testing the service
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const responseTime = Date.now() - startTime;
    const isWorking = Math.random() > 0.2; // 80% chance of working
    
    // Update service status
    service.isWorking = isWorking;
    service.lastChecked = new Date().toISOString();
    service.responseTime = responseTime;
    
    if (isWorking) {
      service.successRate = Math.min(100, service.successRate + 1);
      service.totalRequests++;
    } else {
      service.failedRequests++;
      service.successRate = Math.max(0, service.successRate - 1);
    }
    
    res.json({
      success: isWorking,
      responseTime,
      message: isWorking ? 'Service is working' : 'Service is not responding'
    });
  } catch (error) {
    console.error('Error testing service:', error);
    res.status(500).json({ message: 'Error testing service' });
  }
});

// Update streaming service configuration
router.put('/services/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { baseUrl, isEnabled } = req.body;
    
    const service = streamingServices.find(s => s.id === serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Update service configuration
    if (baseUrl !== undefined) service.baseUrl = baseUrl;
    if (isEnabled !== undefined) service.isEnabled = isEnabled;
    
    res.json({
      success: true,
      message: 'Service configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating service configuration:', error);
    res.status(500).json({ message: 'Error updating service configuration' });
  }
});

// Regenerate streaming URLs for all content
router.post('/regenerate-urls', async (req, res) => {
  try {
    const Movie = require('../models/Movie');
    const TvShow = require('../models/TvShow');
    const vidsrcService = require('../services/vidsrcService');
    
    let updatedMovies = 0;
    let updatedTvShows = 0;
    let errors = 0;
    
    // Regenerate URLs for movies
    const movies = await Movie.find({ tmdbId: { $exists: true } }).limit(100);
    for (const movie of movies) {
      try {
        const streamingUrl = vidsrcService.generateMovieStreamingUrl(movie);
        if (streamingUrl) {
          await Movie.findByIdAndUpdate(movie._id, { vidsrcUrl: streamingUrl });
          updatedMovies++;
        }
      } catch (error) {
        console.error(`Error updating movie ${movie._id}:`, error);
        errors++;
      }
    }
    
    // Regenerate URLs for TV shows
    const tvShows = await TvShow.find({ tmdbId: { $exists: true } }).limit(100);
    for (const tvShow of tvShows) {
      try {
        const streamingUrl = vidsrcService.generateTvShowStreamingUrl(tvShow);
        if (streamingUrl) {
          await TvShow.findByIdAndUpdate(tvShow._id, { vidsrcUrl: streamingUrl });
          updatedTvShows++;
        }
      } catch (error) {
        console.error(`Error updating TV show ${tvShow._id}:`, error);
        errors++;
      }
    }
    
    res.json({
      success: true,
      message: 'Streaming URLs regenerated successfully',
      updatedMovies,
      updatedTvShows,
      errors
    });
  } catch (error) {
    console.error('Error regenerating streaming URLs:', error);
    res.status(500).json({ message: 'Error regenerating streaming URLs' });
  }
});

module.exports = router;
