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
  async updateJobProgress(jobId, progress, status = null, itemsProcessed = null, totalItems = null) {
    const updateData = { progress };
    
    if (status) updateData.status = status;
    if (itemsProcessed !== null) updateData.itemsProcessed = itemsProcessed;
    if (totalItems !== null) updateData.totalItems = totalItems;
    
    await SyncJob.findByIdAndUpdate(jobId, updateData);
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
    } else {
      updateData.$inc = { failureCount: 1 };
      updateData.lastError = new Date();
    }

    await SyncJob.findByIdAndUpdate(jobId, updateData);
  }

  // Sync movies from TMDB
  async syncMovies(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

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
      await this.updateJobProgress(jobId, 0, 'running', 0, totalMovies);

      // Process each page
      for (let page = 1; page <= Math.min(pageLimit, firstPageResponse.data.total_pages); page++) {
        const response = await axios.get(`${this.tmdbBaseUrl}/movie/popular`, {
          params: {
            api_key: this.tmdbApiKey,
            page: page,
            include_adult: job.config.includeAdult || false
          }
        });

        const movies = response.data.results;
        
        for (const movieData of movies) {
          try {
            // Check if movie already exists
            const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
            
            if (!existingMovie) {
              // Get detailed movie info
              const detailResponse = await axios.get(`${this.tmdbBaseUrl}/movie/${movieData.id}`, {
                params: { api_key: this.tmdbApiKey }
              });

              const movieDetail = detailResponse.data;
              
              // Create new movie
              const newMovie = new Movie({
                tmdbId: movieDetail.id,
                title: movieDetail.title,
                overview: movieDetail.overview,
                releaseDate: movieDetail.release_date,
                posterPath: movieDetail.poster_path,
                backdropPath: movieDetail.backdrop_path,
                voteAverage: movieDetail.vote_average,
                voteCount: movieDetail.vote_count,
                popularity: movieDetail.popularity,
                genres: movieDetail.genres.map(g => g.id),
                adult: movieDetail.adult,
                originalLanguage: movieDetail.original_language,
                originalTitle: movieDetail.original_title,
                runtime: movieDetail.runtime,
                status: movieDetail.status,
                tagline: movieDetail.tagline,
                budget: movieDetail.budget,
                revenue: movieDetail.revenue
              });

              await newMovie.save();
            }
            
            processedMovies++;
            const progress = Math.round((processedMovies / totalMovies) * 100);
            await this.updateJobProgress(jobId, progress, 'running', processedMovies, totalMovies);
            
          } catch (movieError) {
            console.error(`Error processing movie ${movieData.id}:`, movieError.message);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.completeJob(jobId, true);
      return { success: true, processed: processedMovies, total: totalMovies };

    } catch (error) {
      console.error('Movies sync error:', error);
      await this.completeJob(jobId, false, error.message);
      throw error;
    }
  }

  // Sync TV shows from TMDB
  async syncTvShows(jobId) {
    try {
      const job = await SyncJob.findById(jobId);
      if (!job) throw new Error('Job not found');

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
      await this.updateJobProgress(jobId, 0, 'running', 0, totalShows);

      // Process each page
      for (let page = 1; page <= Math.min(pageLimit, firstPageResponse.data.total_pages); page++) {
        const response = await axios.get(`${this.tmdbBaseUrl}/tv/popular`, {
          params: {
            api_key: this.tmdbApiKey,
            page: page,
            include_adult: job.config.includeAdult || false
          }
        });

        const shows = response.data.results;
        
        for (const showData of shows) {
          try {
            // Check if TV show already exists
            const existingShow = await TvShow.findOne({ tmdbId: showData.id });
            
            if (!existingShow) {
              // Get detailed TV show info
              const detailResponse = await axios.get(`${this.tmdbBaseUrl}/tv/${showData.id}`, {
                params: { api_key: this.tmdbApiKey }
              });

              const showDetail = detailResponse.data;
              
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
                genres: showDetail.genres.map(g => g.id),
                adult: showDetail.adult,
                originalLanguage: showDetail.original_language,
                originalName: showDetail.original_name,
                numberOfEpisodes: showDetail.number_of_episodes,
                numberOfSeasons: showDetail.number_of_seasons,
                status: showDetail.status,
                tagline: showDetail.tagline,
                type: showDetail.type
              });

              await newShow.save();
            }
            
            processedShows++;
            const progress = Math.round((processedShows / totalShows) * 100);
            await this.updateJobProgress(jobId, progress, 'running', processedShows, totalShows);
            
          } catch (showError) {
            console.error(`Error processing TV show ${showData.id}:`, showError.message);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.completeJob(jobId, true);
      return { success: true, processed: processedShows, total: totalShows };

    } catch (error) {
      console.error('TV shows sync error:', error);
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
        await this.updateJobProgress(jobId, 10, 'running', 0, 100);
        results.genres = await this.syncGenres(jobId);
      }

      // Sync movies
      if (job.config.includeMovies !== false) {
        await this.updateJobProgress(jobId, 30, 'running', 0, 100);
        results.movies = await this.syncMovies(jobId);
      }

      // Sync TV shows
      if (job.config.includeTvShows !== false) {
        await this.updateJobProgress(jobId, 60, 'running', 0, 100);
        results.tvshows = await this.syncTvShows(jobId);
      }

      // Sync users
      if (job.config.includeUsers !== false) {
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

    this.runningJobs.set(jobId, true);

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
    }
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
