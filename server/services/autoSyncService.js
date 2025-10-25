/**
 * Auto Sync Service
 * Handles automatic synchronization from TMDB with scheduling and monitoring
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const tmdbService = require('./tmdbService');
const vidsrcService = require('./vidsrcService');
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');

class AutoSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSync = null;
    this.syncStats = {
      totalMovies: 0,
      newMovies: 0,
      updatedMovies: 0,
      vidsrcUrls: 0,
      errors: 0
    };
    this.scheduledJobs = new Map();
  }

  /**
   * Start auto-sync with different scheduling options
   */
  startAutoSync(options = {}) {
    const {
      schedule = '0 2 * * *', // Default: daily at 2 AM
      pages = 5, // Number of pages to sync
      includeTrending = true,
      includePopular = true,
      includeTopRated = false,
      includeUpcoming = false
    } = options;

    console.log('🔄 Starting auto-sync service...');
    console.log(`📅 Schedule: ${schedule}`);
    console.log(`📄 Pages per sync: ${pages}`);

    // Clear existing jobs
    this.stopAutoSync();

    // Schedule the sync job
    const job = cron.schedule(schedule, async () => {
      await this.performSync({
        pages,
        includeTrending,
        includePopular,
        includeTopRated,
        includeUpcoming
      });
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.scheduledJobs.set('main', job);
    console.log('✅ Auto-sync service started');
  }

  /**
   * Stop auto-sync service
   */
  stopAutoSync() {
    console.log('🛑 Stopping auto-sync service...');
    this.scheduledJobs.forEach((job, name) => {
      job.destroy();
      console.log(`✅ Stopped job: ${name}`);
    });
    this.scheduledJobs.clear();
  }

  /**
   * Perform manual sync
   */
  async performSync(options = {}) {
    if (this.isRunning) {
      console.log('⚠️  Sync already running, skipping...');
      return { success: false, message: 'Sync already running' };
    }

    this.isRunning = true;
    this.syncStats = {
      totalMovies: 0,
      newMovies: 0,
      updatedMovies: 0,
      vidsrcUrls: 0,
      errors: 0
    };

    const startTime = new Date();
    console.log(`🚀 Starting sync at ${startTime.toISOString()}`);

    try {
      // Test TMDB API connection
      console.log('🔍 Testing TMDB API connection...');
      const testMovies = await tmdbService.getPopularMovies(1);
      console.log(`✅ TMDB API working! Found ${testMovies.results.length} movies`);

      // Sync genres first
      await this.syncGenres();

      // Sync movies based on options
      const syncPromises = [];

      if (options.includePopular) {
        syncPromises.push(this.syncMoviesByType('popular', options.pages || 5));
      }
      if (options.includeTrending) {
        syncPromises.push(this.syncMoviesByType('trending', options.pages || 3));
      }
      if (options.includeTopRated) {
        syncPromises.push(this.syncMoviesByType('top_rated', options.pages || 3));
      }
      if (options.includeUpcoming) {
        syncPromises.push(this.syncMoviesByType('upcoming', options.pages || 2));
      }

      // Run all sync operations in parallel
      await Promise.all(syncPromises);

      this.lastSync = new Date();
      const duration = Math.round((this.lastSync - startTime) / 1000);

      console.log('🎉 Sync completed successfully!');
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📊 Stats:`, this.syncStats);

      return {
        success: true,
        message: 'Sync completed successfully',
        stats: this.syncStats,
        duration,
        lastSync: this.lastSync
      };

    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      this.syncStats.errors++;
      
      return {
        success: false,
        message: error.message,
        stats: this.syncStats
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync genres from TMDB
   */
  async syncGenres() {
    console.log('📂 Syncing genres...');
    const genresResponse = await tmdbService.getGenres();
    
    for (const genre of genresResponse.genres) {
      await Genre.findOneAndUpdate(
        { tmdbId: genre.id },
        { name: genre.name, tmdbId: genre.id },
        { upsert: true, new: true }
      );
    }
    
    console.log(`✅ Synced ${genresResponse.genres.length} genres`);
  }

  /**
   * Sync movies by type (popular, trending, etc.)
   */
  async syncMoviesByType(type, pages) {
    console.log(`🎬 Syncing ${type} movies (${pages} pages)...`);
    
    for (let page = 1; page <= pages; page++) {
      try {
        let moviesResponse;
        
        switch (type) {
          case 'popular':
            moviesResponse = await tmdbService.getPopularMovies(page);
            break;
          case 'trending':
            moviesResponse = await tmdbService.getTrendingMovies(page);
            break;
          case 'top_rated':
            moviesResponse = await tmdbService.getTopRatedMovies(page);
            break;
          case 'upcoming':
            moviesResponse = await tmdbService.getUpcomingMovies(page);
            break;
          default:
            throw new Error(`Unknown movie type: ${type}`);
        }

        const movies = moviesResponse.results;
        console.log(`📥 Processing page ${page}/${pages} (${movies.length} movies)`);

        for (const movieData of movies) {
          await this.syncMovie(movieData);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error syncing ${type} page ${page}:`, error.message);
        this.syncStats.errors++;
      }
    }
  }

  /**
   * Sync individual movie
   */
  async syncMovie(movieData) {
    try {
      // Check if movie already exists
      const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
      
      // Get detailed movie info including external IDs
      const movieDetails = await tmdbService.getMovieDetails(movieData.id);
      
      // Generate Vidsrc URL
      let vidsrcUrl = null;
      if (movieDetails.external_ids?.imdb_id || movieData.id) {
        try {
          vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
            tmdbId: movieData.id,
            imdbId: movieDetails.external_ids?.imdb_id
          });
          this.syncStats.vidsrcUrls++;
        } catch (error) {
          console.warn(`⚠️  Could not generate Vidsrc URL for ${movieData.title}`);
        }
      }

      // Find genre IDs for this movie
      const genreIds = [];
      for (const genreId of movieData.genre_ids) {
        const genreDoc = await Genre.findOne({ tmdbId: genreId });
        if (genreDoc) {
          genreIds.push(genreDoc._id);
        }
      }

      const movie = {
        tmdbId: movieData.id,
        imdbId: movieDetails.external_ids?.imdb_id || null,
        title: movieData.title,
        overview: movieData.overview,
        releaseDate: new Date(movieData.release_date),
        posterPath: movieData.poster_path,
        backdropPath: movieData.backdrop_path,
        runtime: movieDetails.runtime,
        voteAverage: movieData.vote_average,
        voteCount: movieData.vote_count,
        adult: movieData.adult,
        originalLanguage: movieData.original_language,
        originalTitle: movieData.original_title,
        popularity: movieData.popularity,
        video: movieData.video,
        genres: genreIds,
        vidsrcUrl: vidsrcUrl,
        isAvailable: true,
        lastUpdated: new Date()
      };

      const result = await Movie.findOneAndUpdate(
        { tmdbId: movieData.id },
        movie,
        { upsert: true, new: true }
      );

      this.syncStats.totalMovies++;
      if (existingMovie) {
        this.syncStats.updatedMovies++;
      } else {
        this.syncStats.newMovies++;
      }

      console.log(`✅ ${movieData.title} ${vidsrcUrl ? '(with Vidsrc)' : '(no Vidsrc)'}`);

    } catch (error) {
      console.error(`❌ Error syncing ${movieData.title}:`, error.message);
      this.syncStats.errors++;
    }
  }

  /**
   * Get sync status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      stats: this.syncStats,
      scheduledJobs: Array.from(this.scheduledJobs.keys())
    };
  }

  /**
   * Get sync schedules
   */
  getSchedules() {
    return {
      daily: '0 2 * * *', // 2 AM daily
      hourly: '0 * * * *', // Every hour
      twiceDaily: '0 2,14 * * *', // 2 AM and 2 PM
      weekly: '0 2 * * 0', // 2 AM every Sunday
      custom: 'Custom cron expression'
    };
  }
}

module.exports = new AutoSyncService();
