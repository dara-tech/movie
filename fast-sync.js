const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');

// TMDB Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class FastMovieSyncer {
  constructor() {
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
    this.batchSize = 50; // Larger batches
    this.delay = 100; // Faster processing
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
      return null;
    }
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
      return null;
    }
  }

  async processMovie(movieData) {
    try {
      // Check if movie already exists
      const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
      if (existingMovie) {
        this.skipped++;
        return { skipped: true };
      }

      // Skip movies without essential data
      if (!movieData.title || !movieData.release_date) {
        this.skipped++;
        return { skipped: true };
      }

      // Create basic genre references
      const genreIds = movieData.genre_ids || [];
      const genreObjectIds = [];
      
      for (const genreId of genreIds) {
        try {
          let genre = await Genre.findOne({ tmdbId: genreId });
          if (!genre) {
            genre = new Genre({
              tmdbId: genreId,
              name: `Genre ${genreId}`
            });
            await genre.save();
          }
          genreObjectIds.push(genre._id);
        } catch (error) {
          // Skip genre if error
        }
      }

      // Create movie document with basic data
      const movie = new Movie({
        tmdbId: movieData.id,
        imdbId: null, // Will be filled later if needed
        title: movieData.title,
        overview: movieData.overview || 'No overview available',
        releaseDate: new Date(movieData.release_date),
        posterPath: movieData.poster_path,
        backdropPath: movieData.backdrop_path,
        genres: genreObjectIds,
        runtime: null, // Will be filled later if needed
        voteAverage: movieData.vote_average || 0,
        voteCount: movieData.vote_count || 0,
        adult: movieData.adult || false,
        originalLanguage: movieData.original_language || 'en',
        originalTitle: movieData.original_title || movieData.title,
        popularity: movieData.popularity || 0,
        video: movieData.video || false,
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

  async syncDecade(decade, maxPages = 200) {
    console.log(`\n🚀 Syncing ${decade}s decade...`);
    let totalMovies = 0;
    let page = 1;

    while (page <= maxPages) {
      const data = await this.fetchMoviesByDecade(decade, page);
      if (!data || !data.results || data.results.length === 0) {
        break;
      }

      console.log(`📄 ${decade}s, Page ${page}: ${data.results.length} movies`);

      // Process movies in large batches
      for (let i = 0; i < data.results.length; i += this.batchSize) {
        const batch = data.results.slice(i, i + this.batchSize);
        
        const promises = batch.map(movie => this.processMovie(movie));
        await Promise.all(promises);
        
        await this.sleep(this.delay);
      }

      totalMovies += data.results.length;
      page++;
      
      // Progress update every 10 pages
      if (page % 10 === 0) {
        console.log(`✅ ${decade}s: ${totalMovies} movies processed so far`);
      }
      
      await this.sleep(this.delay);
    }

    console.log(`🎉 ${decade}s completed! Total: ${totalMovies} movies`);
    return totalMovies;
  }

  async runFastSync() {
    console.log('🎬 Starting FAST Movie Sync to reach 100,000+ movies...\n');
    
    await this.connectDB();
    
    const startTime = Date.now();
    
    try {
      // Sync multiple decades in parallel
      const decades = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950];
      let totalMovies = 0;

      for (const decade of decades) {
        const decadeMovies = await this.syncDecade(decade, 300); // More pages per decade
        totalMovies += decadeMovies;
        
        // Check if we've reached target
        const currentCount = await Movie.countDocuments();
        if (currentCount >= 100000) {
          console.log('🎯 TARGET REACHED! 100,000+ movies!');
          break;
        }
      }
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log('\n🎉 FAST SYNC COMPLETED!');
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
      
    } catch (error) {
      console.error('❌ Fast sync failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    }
  }
}

// Run the fast sync
const syncer = new FastMovieSyncer();
syncer.runFastSync().catch(console.error);
