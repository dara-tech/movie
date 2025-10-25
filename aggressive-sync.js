const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');

// TMDB Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class AggressiveMovieSyncer {
  constructor() {
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
    this.batchSize = 10; // Smaller batches for better error handling
    this.delay = 200; // Faster processing
    this.totalSynced = 0;
    this.errors = 0;
    this.skipped = 0;
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviestream');
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchMoviesByYear(year, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US',
          primary_release_year: year,
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching year ${year} page ${page}:`, error.message);
      return null;
    }
  }

  async fetchMoviesByGenre(genreId, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US',
          with_genres: genreId,
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching genre ${genreId} page ${page}:`, error.message);
      return null;
    }
  }

  async fetchMoviesByDecade(decade, page = 1) {
    try {
      const startYear = decade;
      const endYear = decade + 9;
      
      const response = await axios.get(`${this.baseURL}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US',
          primary_release_date: {
            gte: `${startYear}-01-01`,
            lte: `${endYear}-12-31`
          },
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching decade ${decade} page ${page}:`, error.message);
      return null;
    }
  }

  async fetchMovieDetails(tmdbId) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/${tmdbId}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          append_to_response: 'external_ids'
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getOrCreateGenres(genreIds) {
    const genres = [];
    for (const genreId of genreIds) {
      try {
        let genre = await Genre.findOne({ tmdbId: genreId });
        
        if (!genre) {
          // Create a basic genre entry
          genre = new Genre({
            tmdbId: genreId,
            name: `Genre ${genreId}` // Will be updated later
          });
          await genre.save();
        }
        
        genres.push(genre._id);
      } catch (error) {
        console.error(`❌ Error with genre ${genreId}:`, error.message);
      }
    }
    return genres;
  }

  async processMovie(movieData) {
    try {
      // Check if movie already exists
      const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
      if (existingMovie) {
        this.skipped++;
        return { skipped: true };
      }

      // Get detailed movie information
      const detailedMovie = await this.fetchMovieDetails(movieData.id);
      if (!detailedMovie) {
        this.errors++;
        return { error: 'Failed to fetch movie details' };
      }

      // Skip movies without essential data
      if (!detailedMovie.title || !detailedMovie.release_date) {
        this.skipped++;
        return { skipped: true, reason: 'Missing essential data' };
      }

      // Get or create genres
      const genreIds = detailedMovie.genres ? detailedMovie.genres.map(g => g.id) : [];
      const genreObjectIds = await this.getOrCreateGenres(genreIds);

      // Create movie document
      const movie = new Movie({
        tmdbId: detailedMovie.id,
        imdbId: detailedMovie.external_ids?.imdb_id || null,
        title: detailedMovie.title,
        overview: detailedMovie.overview || 'No overview available',
        releaseDate: new Date(detailedMovie.release_date),
        posterPath: detailedMovie.poster_path,
        backdropPath: detailedMovie.backdrop_path,
        genres: genreObjectIds,
        runtime: detailedMovie.runtime || null,
        voteAverage: detailedMovie.vote_average || 0,
        voteCount: detailedMovie.vote_count || 0,
        adult: detailedMovie.adult || false,
        originalLanguage: detailedMovie.original_language || 'en',
        originalTitle: detailedMovie.original_title || detailedMovie.title,
        popularity: detailedMovie.popularity || 0,
        video: detailedMovie.video || false,
        isAvailable: true
      });

      await movie.save();
      this.totalSynced++;
      return { success: true };
    } catch (error) {
      this.errors++;
      return { error: error.message };
    }
  }

  async syncByYears(startYear, endYear, maxPagesPerYear = 50) {
    console.log(`\n🚀 Syncing movies from ${startYear} to ${endYear}...`);
    let totalMovies = 0;

    for (let year = startYear; year <= endYear; year++) {
      console.log(`\n📅 Processing year ${year}...`);
      let page = 1;
      let yearMovies = 0;

      while (page <= maxPagesPerYear) {
        const data = await this.fetchMoviesByYear(year, page);
        if (!data || !data.results || data.results.length === 0) {
          break;
        }

        console.log(`📄 Year ${year}, Page ${page}: ${data.results.length} movies`);

        // Process movies in batches
        for (let i = 0; i < data.results.length; i += this.batchSize) {
          const batch = data.results.slice(i, i + this.batchSize);
          
          const promises = batch.map(movie => this.processMovie(movie));
          await Promise.all(promises);
          
          await this.sleep(this.delay);
        }

        yearMovies += data.results.length;
        totalMovies += data.results.length;
        page++;
        
        await this.sleep(this.delay);
      }

      console.log(`✅ Year ${year} completed: ${yearMovies} movies processed`);
    }

    console.log(`🎉 Years ${startYear}-${endYear} completed! Total: ${totalMovies} movies`);
    return totalMovies;
  }

  async syncByGenres(genreIds, maxPagesPerGenre = 100) {
    console.log(`\n🚀 Syncing movies by genres...`);
    let totalMovies = 0;

    for (const genreId of genreIds) {
      console.log(`\n🎭 Processing genre ${genreId}...`);
      let page = 1;
      let genreMovies = 0;

      while (page <= maxPagesPerGenre) {
        const data = await this.fetchMoviesByGenre(genreId, page);
        if (!data || !data.results || data.results.length === 0) {
          break;
        }

        console.log(`📄 Genre ${genreId}, Page ${page}: ${data.results.length} movies`);

        // Process movies in batches
        for (let i = 0; i < data.results.length; i += this.batchSize) {
          const batch = data.results.slice(i, i + this.batchSize);
          
          const promises = batch.map(movie => this.processMovie(movie));
          await Promise.all(promises);
          
          await this.sleep(this.delay);
        }

        genreMovies += data.results.length;
        totalMovies += data.results.length;
        page++;
        
        await this.sleep(this.delay);
      }

      console.log(`✅ Genre ${genreId} completed: ${genreMovies} movies processed`);
    }

    console.log(`🎉 Genres completed! Total: ${totalMovies} movies`);
    return totalMovies;
  }

  async runAggressiveSync() {
    console.log('🎬 Starting Aggressive Movie Sync to reach 100,000+ movies...\n');
    
    await this.connectDB();
    
    const startTime = Date.now();
    
    try {
      // Sync movies by years (2020-2024 for recent movies)
      const recentMovies = await this.syncByYears(2020, 2024, 100);
      
      // Sync movies by years (2010-2019 for popular decade)
      const decade2010s = await this.syncByYears(2010, 2019, 80);
      
      // Sync movies by years (2000-2009)
      const decade2000s = await this.syncByYears(2000, 2009, 60);
      
      // Sync movies by years (1990-1999)
      const decade1990s = await this.syncByYears(1990, 1999, 40);
      
      // Sync movies by years (1980-1989)
      const decade1980s = await this.syncByYears(1980, 1989, 30);
      
      // Sync by popular genres
      const popularGenres = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
      const genreMovies = await this.syncByGenres(popularGenres, 50);
      
      const totalMovies = recentMovies + decade2010s + decade2000s + decade1990s + decade1980s + genreMovies;
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log('\n🎉 AGGRESSIVE SYNC COMPLETED!');
      console.log('================================');
      console.log(`📊 Total movies processed: ${totalMovies}`);
      console.log(`✅ Successfully synced: ${this.totalSynced}`);
      console.log(`⏭️  Skipped: ${this.skipped}`);
      console.log(`❌ Errors: ${this.errors}`);
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📈 Rate: ${Math.round(totalMovies / duration)} movies/second`);
      
      // Get final database count
      const finalCount = await Movie.countDocuments();
      console.log(`🎬 Final database count: ${finalCount} movies`);
      
      if (finalCount >= 100000) {
        console.log('🎯 TARGET REACHED! 100,000+ movies in database!');
      } else {
        console.log(`📈 Need ${100000 - finalCount} more movies to reach 100,000`);
      }
      
    } catch (error) {
      console.error('❌ Aggressive sync failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    }
  }
}

// Run the aggressive sync
const syncer = new AggressiveMovieSyncer();
syncer.runAggressiveSync().catch(console.error);
