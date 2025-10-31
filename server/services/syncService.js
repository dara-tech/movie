const axios = require('axios');
const Movie = require('../models/Movie');
const TvShow = require('../models/TvShow');
const Genre = require('../models/Genre');
const SyncJob = require('../models/SyncJob');

class SyncService {
  constructor() {
    this.tmdbApiKey = process.env.TMDB_API_KEY;
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.runningJobs = new Map();
    this.stopFlags = new Map(); // Track jobs to stop
  }

  // Resolve TMDB genre ids to Genre ObjectIds
  async resolveGenreObjectIds(tmdbGenres) {
    if (!Array.isArray(tmdbGenres)) return [];
    const tmdbIds = tmdbGenres
      .map(g => (typeof g === 'number' ? g : g?.id))
      .filter(id => typeof id === 'number');

    if (tmdbIds.length === 0) return [];

    const genres = await Genre.find({ tmdbId: { $in: tmdbIds } }, { _id: 1, tmdbId: 1 });
    const tmdbIdToObjectId = new Map(genres.map(g => [g.tmdbId, g._id]));

    return tmdbIds
      .map(id => tmdbIdToObjectId.get(id))
      .filter(Boolean);
  }

  // Initialize default sync jobs
  async initializeDefaultJobs() {
    const defaultJobs = [
      {
        name: 'Movies Sync',
        type: 'movies',
        description: 'Sync movies from TMDB API',
        estimatedTime: '5-10 minutes',
        config: {
          pageLimit: 100,
          includeAdult: false,
          sortBy: 'popularity.desc'
        }
      },
      {
        name: 'TV Shows Sync',
        type: 'tvshows',
        description: 'Sync TV shows from TMDB API',
        estimatedTime: '10-15 minutes',
        config: {
          pageLimit: 100,
          includeAdult: false,
          sortBy: 'popularity.desc'
        }
      },
      {
        name: 'Genres Sync',
        type: 'genres',
        description: 'Sync genres from TMDB API',
        estimatedTime: '1-2 minutes',
        config: {
          includeMovieGenres: true,
          includeTvGenres: true
        }
      },
      {
        name: 'Users Sync',
        type: 'users',
        description: 'Sync user data and preferences',
        estimatedTime: '2-3 minutes',
        config: {
          syncPreferences: true,
          syncWatchHistory: true
        }
      },
      {
        name: 'Full Sync',
        type: 'all',
        description: 'Complete data synchronization',
        estimatedTime: '30-45 minutes',
        config: {
          includeMovies: true,
          includeTvShows: true,
          includeGenres: true,
          includeUsers: true
        }
      }
    ];

    for (const jobData of defaultJobs) {
      const existingJob = await SyncJob.findOne({ name: jobData.name });
      if (!existingJob) {
        await SyncJob.create(jobData);
      }
    }
  }

  // Update job progress
  async addLog(jobId, message, level = 'info') {
    try {
      // Ensure jobId is a string (MongoDB ObjectId)
      const jobIdStr = jobId && jobId.toString ? jobId.toString() : String(jobId);
      
      const logEntry = {
        timestamp: new Date(),
        level: level,
        message: message
      };
      
      // Simple $push to add log entry
      const result = await SyncJob.findByIdAndUpdate(jobIdStr, {
        $push: {
          logs: logEntry
        }
      }, { new: true });
      
      // Keep only last 100 logs
      if (result && result.logs && result.logs.length > 100) {
        await SyncJob.findByIdAndUpdate(jobIdStr, {
          $set: {
            logs: result.logs.slice(-100) // Keep last 100 logs
          }
        });
      }
      
      // Also log to console for debugging
      console.log(`[Sync Job ${jobIdStr}] [${level.toUpperCase()}] ${message}`);
      
    } catch (error) {
      console.error('Error adding log:', error);
      console.error('JobId:', jobId, 'Type:', typeof jobId);
      // Don't throw - logging shouldn't break sync
    }
  }

  async updateJobProgress(jobId, progress, status = null, itemsProcessed = null, totalItems = null, logMessage = null) {
    const updateData = { progress };
    
    if (status) updateData.status = status;
    if (itemsProcessed !== null) updateData.itemsProcessed = itemsProcessed;
    if (totalItems !== null) updateData.totalItems = totalItems;
    
    await SyncJob.findByIdAndUpdate(jobId, updateData);
    
    if (logMessage) {
      await this.addLog(jobId, logMessage, 'info');
    }
  }

  // Mark job as completed
  async completeJob(jobId, success = true, errorMessage = null) {
    const updateData = {
      status: success ? 'completed' : 'failed',
      progress: success ? 100 : 0,
      lastRun: new Date(),
      errorMessage: errorMessage
    };

    if (success) {
      updateData.$inc = { successCount: 1 };
      await this.addLog(jobId, 'Job completed successfully', 'success');
    } else {
      updateData.$inc = { failureCount: 1 };
      updateData.lastError = new Date();
      await this.addLog(jobId, `Job failed: ${errorMessage || 'Unknown error'}`, 'error');
    }

    await SyncJob.findByIdAndUpdate(jobId, updateData);
  }

  // Sync movies from TMDB
  async syncMovies(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

      await this.addLog(jobId, 'Starting movie sync job', 'info');
      await this.updateJobProgress(jobId, 0, 'running', 0, 0);

      let totalMovies = 0;
      let processedMovies = 0;
      const pageLimit = job.config.pageLimit || 10;

      // Get total pages first
      const firstPageResponse = await axios.get(`${this.tmdbBaseUrl}/movie/popular`, {
        params: {
          api_key: this.tmdbApiKey,
          page: 1,
          include_adult: job.config.includeAdult || false
        }
      });

      totalMovies = firstPageResponse.data.total_results;
      await this.addLog(jobId, `Found ${totalMovies} total movies to sync`, 'info');
      await this.updateJobProgress(jobId, 0, 'running', 0, totalMovies);

      // Process each page
      for (let page = 1; page <= Math.min(pageLimit, firstPageResponse.data.total_pages); page++) {
        // Check if job should stop
        if (this.shouldStop(jobId)) {
          await this.addLog(jobId, 'Sync job stopped by user', 'warning');
          await this.updateJobProgress(jobId, (processedMovies / totalMovies * 100), 'paused', processedMovies, totalMovies);
          break;
        }

        await this.addLog(jobId, `Processing page ${page}/${Math.min(pageLimit, firstPageResponse.data.total_pages)}`, 'info');
        
        const response = await axios.get(`${this.tmdbBaseUrl}/movie/popular`, {
          params: {
            api_key: this.tmdbApiKey,
            page: page,
            include_adult: job.config.includeAdult || false
          }
        });

        const movies = response.data.results;
        
        for (const movieData of movies) {
          // Check if job should stop
          if (this.shouldStop(jobId)) {
            await this.addLog(jobId, 'Sync job stopped by user', 'warning');
            await this.updateJobProgress(jobId, (processedMovies / totalMovies * 100), 'paused', processedMovies, totalMovies);
            break;
          }
          try {
            // Check if movie already exists
            const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
            
            // Get detailed movie info to fetch watch providers
            const detailResponse = await axios.get(`${this.tmdbBaseUrl}/movie/${movieData.id}`, {
              params: { 
                api_key: this.tmdbApiKey,
                append_to_response: 'watch/providers'
              }
            });

            const movieDetail = detailResponse.data;
            
            // Get watch providers (US region as default)
            let watchProviders = { flatrate: [], buy: [], rent: [] };
            if (movieDetail['watch/providers'] && movieDetail['watch/providers'].results && movieDetail['watch/providers'].results.US) {
              const usProviders = movieDetail['watch/providers'].results.US;
              watchProviders.flatrate = (usProviders.flatrate || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
              watchProviders.buy = (usProviders.buy || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
              watchProviders.rent = (usProviders.rent || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
            }
            
            if (!existingMovie) {
              // Resolve genre ObjectIds
              const genreObjectIds = await this.resolveGenreObjectIds(movieDetail.genres);

              // Create new movie
              const newMovie = new Movie({
                tmdbId: movieDetail.id,
                title: movieDetail.title,
                overview: movieDetail.overview || 'No overview available',
                releaseDate: movieDetail.release_date ? new Date(movieDetail.release_date) : new Date(),
                posterPath: movieDetail.poster_path,
                backdropPath: movieDetail.backdrop_path,
                voteAverage: movieDetail.vote_average || 0,
                voteCount: movieDetail.vote_count || 0,
                popularity: movieDetail.popularity || 0,
                genres: genreObjectIds,
                adult: movieDetail.adult || false,
                originalLanguage: movieDetail.original_language || 'en',
                originalTitle: movieDetail.original_title || movieDetail.title,
                runtime: movieDetail.runtime,
                status: movieDetail.status,
                tagline: movieDetail.tagline,
                budget: movieDetail.budget,
                revenue: movieDetail.revenue,
                watchProviders: watchProviders
              });

              await newMovie.save();
              await this.addLog(jobId, `Created: ${movieDetail.title} (${movieDetail.id})`, 'success');
            } else {
              // Update existing movie - SAFE: Only updates watchProviders field, no data loss
              // Only update if watchProviders is empty or missing (prevent overwriting existing data)
              const hasProviders = existingMovie.watchProviders && (
                (existingMovie.watchProviders.flatrate && existingMovie.watchProviders.flatrate.length > 0) ||
                (existingMovie.watchProviders.buy && existingMovie.watchProviders.buy.length > 0) ||
                (existingMovie.watchProviders.rent && existingMovie.watchProviders.rent.length > 0)
              );
              
              // Only update if no providers exist yet, or if new data has providers
              const hasNewProviders = watchProviders.flatrate.length > 0 || watchProviders.buy.length > 0 || watchProviders.rent.length > 0;
              
              if (!hasProviders || hasNewProviders) {
                await Movie.findOneAndUpdate(
                  { tmdbId: movieData.id },
                  { $set: { watchProviders: watchProviders } },
                  { new: true } // Return updated document (but we don't use it)
                );
                await this.addLog(jobId, `Updated: ${movieDetail.title} (${movieDetail.id})`, 'info');
              } else {
                await this.addLog(jobId, `Skipped: ${movieDetail.title} (${movieDetail.id}) - already has providers`, 'info');
              }
            }
            
            processedMovies++;
            const progress = Math.round((processedMovies / totalMovies) * 100);
            // Log progress every 10 movies
            if (processedMovies % 10 === 0) {
              await this.addLog(jobId, `Progress: ${processedMovies}/${totalMovies} movies (${progress}%)`, 'info');
            }
            await this.updateJobProgress(jobId, progress, 'running', processedMovies, totalMovies);
            
          } catch (movieError) {
            await this.addLog(jobId, `Error processing movie ${movieData.id}: ${movieError.message}`, 'error');
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.addLog(jobId, `Sync completed: ${processedMovies}/${totalMovies} movies processed`, 'success');
      await this.completeJob(jobId, true);
      return { success: true, processed: processedMovies, total: totalMovies };

    } catch (error) {
      await this.addLog(jobId, `Sync failed: ${error.message}`, 'error');
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Sync TV shows from TMDB
  async syncTvShows(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

      await this.addLog(jobId, 'Starting TV shows sync job', 'info');
      await this.updateJobProgress(jobId, 0, 'running', 0, 0);

      let totalShows = 0;
      let processedShows = 0;
      const pageLimit = job.config.pageLimit || 10;

      // Get total pages first
      const firstPageResponse = await axios.get(`${this.tmdbBaseUrl}/tv/popular`, {
        params: {
          api_key: this.tmdbApiKey,
          page: 1,
          include_adult: job.config.includeAdult || false
        }
      });

      totalShows = firstPageResponse.data.total_results;
      await this.addLog(jobId, `Found ${totalShows} total TV shows to sync`, 'info');
      await this.updateJobProgress(jobId, 0, 'running', 0, totalShows);

      // Process each page
      for (let page = 1; page <= Math.min(pageLimit, firstPageResponse.data.total_pages); page++) {
        // Check if job should stop
        if (this.shouldStop(jobId)) {
          await this.addLog(jobId, 'Sync job stopped by user', 'warning');
          await this.updateJobProgress(jobId, (processedShows / totalShows * 100), 'paused', processedShows, totalShows);
          break;
        }

        await this.addLog(jobId, `Processing page ${page}/${Math.min(pageLimit, firstPageResponse.data.total_pages)}`, 'info');
        
        const response = await axios.get(`${this.tmdbBaseUrl}/tv/popular`, {
          params: {
            api_key: this.tmdbApiKey,
            page: page,
            include_adult: job.config.includeAdult || false
          }
        });

        const shows = response.data.results;
        
        for (const showData of shows) {
          // Check if job should stop
          if (this.shouldStop(jobId)) {
            await this.addLog(jobId, 'Sync job stopped by user', 'warning');
            await this.updateJobProgress(jobId, (processedShows / totalShows * 100), 'paused', processedShows, totalShows);
            break;
          }
          try {
            // Check if TV show already exists
            const existingShow = await TvShow.findOne({ tmdbId: showData.id });
            
            // Get detailed TV show info to fetch watch providers
            const detailResponse = await axios.get(`${this.tmdbBaseUrl}/tv/${showData.id}`, {
              params: { 
                api_key: this.tmdbApiKey,
                append_to_response: 'watch/providers'
              }
            });

            const showDetail = detailResponse.data;
            
            // Get watch providers (US region as default)
            let watchProviders = { flatrate: [], buy: [], rent: [] };
            if (showDetail['watch/providers'] && showDetail['watch/providers'].results && showDetail['watch/providers'].results.US) {
              const usProviders = showDetail['watch/providers'].results.US;
              watchProviders.flatrate = (usProviders.flatrate || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
              watchProviders.buy = (usProviders.buy || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
              watchProviders.rent = (usProviders.rent || []).map(p => ({
                providerId: p.provider_id,
                providerName: p.provider_name,
                logoPath: p.logo_path
              }));
            }
            
            if (!existingShow) {
              // Resolve genre ObjectIds
              const genreObjectIds = await this.resolveGenreObjectIds(showDetail.genres);

              // Create new TV show
              const newShow = new TvShow({
                tmdbId: showDetail.id,
                name: showDetail.name,
                overview: showDetail.overview,
                firstAirDate: showDetail.first_air_date,
                lastAirDate: showDetail.last_air_date,
                posterPath: showDetail.poster_path,
                backdropPath: showDetail.backdrop_path,
                voteAverage: showDetail.vote_average,
                voteCount: showDetail.vote_count,
                popularity: showDetail.popularity,
                genres: genreObjectIds,
                adult: showDetail.adult,
                originalLanguage: showDetail.original_language,
                originalName: showDetail.original_name,
                numberOfEpisodes: showDetail.number_of_episodes,
                numberOfSeasons: showDetail.number_of_seasons,
                status: showDetail.status,
                tagline: showDetail.tagline,
                type: showDetail.type,
                watchProviders: watchProviders
              });

              await newShow.save();
              await this.addLog(jobId, `Created: ${showDetail.name} (${showDetail.id})`, 'success');
            } else {
              // Update existing TV show - SAFE: Only updates watchProviders field, no data loss
              // Only update if watchProviders is empty or missing (prevent overwriting existing data)
              const hasProviders = existingShow.watchProviders && (
                (existingShow.watchProviders.flatrate && existingShow.watchProviders.flatrate.length > 0) ||
                (existingShow.watchProviders.buy && existingShow.watchProviders.buy.length > 0) ||
                (existingShow.watchProviders.rent && existingShow.watchProviders.rent.length > 0)
              );
              
              // Only update if no providers exist yet, or if new data has providers
              const hasNewProviders = watchProviders.flatrate.length > 0 || watchProviders.buy.length > 0 || watchProviders.rent.length > 0;
              
              if (!hasProviders || hasNewProviders) {
                await TvShow.findOneAndUpdate(
                  { tmdbId: showData.id },
                  { $set: { watchProviders: watchProviders } },
                  { new: true } // Return updated document (but we don't use it)
                );
                await this.addLog(jobId, `Updated: ${showDetail.name} (${showDetail.id})`, 'info');
              } else {
                await this.addLog(jobId, `Skipped: ${showDetail.name} (${showDetail.id}) - already has providers`, 'info');
              }
            }
            
            processedShows++;
            const progress = Math.round((processedShows / totalShows) * 100);
            // Log progress every 10 shows
            if (processedShows % 10 === 0) {
              await this.addLog(jobId, `Progress: ${processedShows}/${totalShows} TV shows (${progress}%)`, 'info');
            }
            await this.updateJobProgress(jobId, progress, 'running', processedShows, totalShows);
            
          } catch (showError) {
            await this.addLog(jobId, `Error processing TV show ${showData.id}: ${showError.message}`, 'error');
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.addLog(jobId, `Sync completed: ${processedShows}/${totalShows} TV shows processed`, 'success');
      await this.completeJob(jobId, true);
      return { success: true, processed: processedShows, total: totalShows };

    } catch (error) {
      await this.addLog(jobId, `Sync failed: ${error.message}`, 'error');
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Sync genres from TMDB
  async syncGenres(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

      await this.updateJobProgress(jobId, 0, 'running', 0, 0);

      let processedGenres = 0;
      const genresToProcess = [];

      // Get movie genres
      if (job.config.includeMovieGenres !== false) {
        const movieGenresResponse = await axios.get(`${this.tmdbBaseUrl}/genre/movie/list`, {
          params: { api_key: this.tmdbApiKey }
        });
        genresToProcess.push(...movieGenresResponse.data.genres.map(g => ({ ...g, type: 'movie' })));
      }

      // Get TV genres
      if (job.config.includeTvGenres !== false) {
        const tvGenresResponse = await axios.get(`${this.tmdbBaseUrl}/genre/tv/list`, {
          params: { api_key: this.tmdbApiKey }
        });
        genresToProcess.push(...tvGenresResponse.data.genres.map(g => ({ ...g, type: 'tv' })));
      }

      const totalGenres = genresToProcess.length;
      await this.updateJobProgress(jobId, 0, 'running', 0, totalGenres);

      for (const genreData of genresToProcess) {
        // Check if job should stop
        if (this.shouldStop(jobId)) {
          console.log(`Sync job ${jobId} stopped by user`);
          await this.updateJobProgress(jobId, (processedGenres / totalGenres * 100), 'paused', processedGenres, totalGenres);
          break;
        }

        try {
          // Check if genre already exists
          const existingGenre = await Genre.findOne({ tmdbId: genreData.id });
          
          if (!existingGenre) {
            // Create new genre
            const newGenre = new Genre({
              tmdbId: genreData.id,
              name: genreData.name,
              type: genreData.type
            });

            await newGenre.save();
          } else {
            // Update existing genre
            existingGenre.name = genreData.name;
            existingGenre.type = genreData.type;
            await existingGenre.save();
          }
          
          processedGenres++;
          const progress = Math.round((processedGenres / totalGenres) * 100);
          await this.updateJobProgress(jobId, progress, 'running', processedGenres, totalGenres);
          
        } catch (genreError) {
          console.error(`Error processing genre ${genreData.id}:`, genreError.message);
        }
      }

      await this.completeJob(jobId, true);
      return { success: true, processed: processedGenres, total: totalGenres };

    } catch (error) {
      console.error('Genres sync error:', error);
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Sync users (placeholder - would integrate with user management)
  async syncUsers(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

      await this.updateJobProgress(jobId, 0, 'running', 0, 0);

      // This would integrate with your user management system
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      await this.updateJobProgress(jobId, 50, 'running', 1, 2);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate more processing
      
      await this.completeJob(jobId, true);
      return { success: true, processed: 2, total: 2 };

    } catch (error) {
      console.error('Users sync error:', error);
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Run full sync (all types)
  async syncAll(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

      await this.updateJobProgress(jobId, 0, 'running', 0, 0);

      const results = {};

      // Sync genres first (needed for movies and TV shows)
      if (job.config.includeGenres !== false) {
        if (this.shouldStop(jobId)) {
          await this.updateJobProgress(jobId, 10, 'paused', 0, 100);
          throw new Error('Job stopped by user');
        }
        await this.updateJobProgress(jobId, 10, 'running', 0, 100);
        results.genres = await this.syncGenres(jobId);
      }

      // Sync movies
      if (job.config.includeMovies !== false) {
        if (this.shouldStop(jobId)) {
          await this.updateJobProgress(jobId, 30, 'paused', 0, 100);
          throw new Error('Job stopped by user');
        }
        await this.updateJobProgress(jobId, 30, 'running', 0, 100);
        results.movies = await this.syncMovies(jobId);
      }

      // Sync TV shows
      if (job.config.includeTvShows !== false) {
        if (this.shouldStop(jobId)) {
          await this.updateJobProgress(jobId, 60, 'paused', 0, 100);
          throw new Error('Job stopped by user');
        }
        await this.updateJobProgress(jobId, 60, 'running', 0, 100);
        results.tvshows = await this.syncTvShows(jobId);
      }

      // Sync users
      if (job.config.includeUsers !== false) {
        if (this.shouldStop(jobId)) {
          await this.updateJobProgress(jobId, 90, 'paused', 0, 100);
          throw new Error('Job stopped by user');
        }
        await this.updateJobProgress(jobId, 90, 'running', 0, 100);
        results.users = await this.syncUsers(jobId);
      }

      await this.completeJob(jobId, true);
      return { success: true, results };

    } catch (error) {
      console.error('Full sync error:', error);
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Run a specific sync job
  async runJob(jobId) {
    const job = await SyncJob.findById(jobId);
    if (!job) throw new Error('Job not found');
    if (!job.isEnabled) throw new Error('Job is disabled');

    // Check if job is already running
    if (this.runningJobs.has(jobId)) {
      throw new Error('Job is already running');
    }

    // Clear any previous stop flag
    this.stopFlags.delete(jobId);
    this.runningJobs.set(jobId, true);

    // Log job start
    await this.addLog(job._id || jobId, `Job started by user`, 'info');

    try {
      let result;
      
      switch (job.type) {
        case 'movies':
          result = await this.syncMovies(jobId);
          break;
        case 'tvshows':
          result = await this.syncTvShows(jobId);
          break;
        case 'genres':
          result = await this.syncGenres(jobId);
          break;
        case 'users':
          result = await this.syncUsers(jobId);
          break;
        case 'all':
          result = await this.syncAll(jobId);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      return result;
    } finally {
      this.runningJobs.delete(jobId);
      this.stopFlags.delete(jobId);
    }
  }

  // Stop a running job
  async stopJob(jobId) {
    const job = await SyncJob.findById(jobId);
    if (!job) throw new Error('Job not found');

    // Check if job is running
    if (!this.runningJobs.has(jobId)) {
      throw new Error('Job is not running');
    }

    // Set stop flag
    this.stopFlags.set(jobId, true);

    // Update job status
    await SyncJob.findByIdAndUpdate(jobId, { 
      status: 'paused',
      errorMessage: 'Job stopped by user'
    });

    // Clean up after a delay to allow job to finish gracefully
    setTimeout(() => {
      this.runningJobs.delete(jobId);
      this.stopFlags.delete(jobId);
    }, 5000);

    return { message: 'Job stop requested', jobId };
  }

  // Check if a job should stop
  shouldStop(jobId) {
    return this.stopFlags.has(jobId) && this.stopFlags.get(jobId) === true;
  }

  // Check if a job is actually running
  isJobRunning(jobId) {
    return this.runningJobs.has(jobId);
  }

  // Get sync statistics
  async getSyncStats() {
    const stats = await SyncJob.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          completedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalSuccessCount: { $sum: '$successCount' },
          totalFailureCount: { $sum: '$failureCount' },
          lastSyncTime: { $max: '$lastRun' }
        }
      }
    ]);

    const result = stats[0] || {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalSuccessCount: 0,
      totalFailureCount: 0,
      lastSyncTime: null
    };

    // Calculate success rate
    const totalRuns = result.totalSuccessCount + result.totalFailureCount;
    result.syncSuccessRate = totalRuns > 0 ? Math.round((result.totalSuccessCount / totalRuns) * 100) : 0;

    // Get total items synced from database
    const movieCount = await Movie.countDocuments();
    const tvShowCount = await TvShow.countDocuments();
    const genreCount = await Genre.countDocuments();
    
    result.totalItemsSynced = movieCount + tvShowCount + genreCount;

    return result;
  }
}

module.exports = new SyncService();
