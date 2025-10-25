const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');

// TMDB Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class BulkMovieSyncer {
  constructor() {
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
    this.batchSize = 20; // Process 20 movies at a time
    this.delay = 250; // 250ms delay between requests to respect rate limits
    this.totalSynced = 0;
    this.errors = 0;
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

  async fetchMoviesFromTMDB(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/popular`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      return null;
    }
  }

  async fetchTopRatedMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/top_rated`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching top rated page ${page}:`, error.message);
      return null;
    }
  }

  async fetchUpcomingMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/upcoming`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching upcoming page ${page}:`, error.message);
      return null;
    }
  }

  async fetchNowPlayingMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/now_playing`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching now playing page ${page}:`, error.message);
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
      console.error(`❌ Error fetching movie details for ${tmdbId}:`, error.message);
      return null;
    }
  }

  async getOrCreateGenres(genreIds) {
    const genres = [];
    for (const genreId of genreIds) {
      try {
        // Check if genre exists
        let genre = await Genre.findOne({ tmdbId: genreId });
        
        if (!genre) {
          // Fetch genre details from TMDB
          const response = await axios.get(`${this.baseURL}/genre/movie/list`, {
            params: {
              api_key: this.apiKey,
              language: 'en-US'
            }
          });
          
          const genreData = response.data.genres.find(g => g.id === genreId);
          if (genreData) {
            genre = new Genre({
              tmdbId: genreData.id,
              name: genreData.name
            });
            await genre.save();
            console.log(`✅ Created genre: ${genreData.name}`);
          }
        }
        
        if (genre) {
          genres.push(genre._id);
        }
      } catch (error) {
        console.error(`❌ Error creating genre ${genreId}:`, error.message);
      }
    }
    return genres;
  }

  async processMovie(movieData) {
    try {
      // Check if movie already exists
      const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
      if (existingMovie) {
        return { skipped: true, movie: existingMovie };
      }

      // Get detailed movie information
      const detailedMovie = await this.fetchMovieDetails(movieData.id);
      if (!detailedMovie) {
        return { error: 'Failed to fetch movie details' };
      }

      // Get or create genres
      const genreIds = detailedMovie.genres.map(g => g.id);
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
      return { success: true, movie };
    } catch (error) {
      console.error(`❌ Error processing movie ${movieData.title}:`, error.message);
      return { error: error.message };
    }
  }

  async syncMoviesFromSource(sourceName, fetchFunction, maxPages = 500) {
    console.log(`\n🚀 Starting ${sourceName} sync...`);
    let page = 1;
    let totalMovies = 0;

    while (page <= maxPages) {
      console.log(`📄 Fetching ${sourceName} page ${page}...`);
      
      const data = await fetchFunction(page);
      if (!data || !data.results || data.results.length === 0) {
        console.log(`✅ No more movies in ${sourceName} at page ${page}`);
        break;
      }

      console.log(`📊 Found ${data.results.length} movies on page ${page}`);

      // Process movies in batches
      for (let i = 0; i < data.results.length; i += this.batchSize) {
        const batch = data.results.slice(i, i + this.batchSize);
        
        console.log(`🔄 Processing batch ${Math.floor(i / this.batchSize) + 1} (${batch.length} movies)...`);
        
        const promises = batch.map(movie => this.processMovie(movie));
        const results = await Promise.all(promises);
        
        for (const result of results) {
          if (result.success) {
            this.totalSynced++;
            totalMovies++;
          } else if (result.skipped) {
            // Movie already exists, count as processed
            totalMovies++;
          } else if (result.error) {
            this.errors++;
          }
        }
        
        // Rate limiting
        await this.sleep(this.delay);
      }

      console.log(`✅ Page ${page} completed. Total ${sourceName}: ${totalMovies} movies`);
      page++;
      
      // Rate limiting between pages
      await this.sleep(this.delay * 2);
    }

    console.log(`🎉 ${sourceName} sync completed! Total movies: ${totalMovies}`);
    return totalMovies;
  }

  async runBulkSync() {
    console.log('🎬 Starting Bulk Movie Sync to reach 100,000+ movies...\n');
    
    await this.connectDB();
    
    const startTime = Date.now();
    
    try {
      // Sync from multiple sources
      const popularCount = await this.syncMoviesFromSource('Popular Movies', this.fetchMoviesFromTMDB.bind(this), 500);
      const topRatedCount = await this.syncMoviesFromSource('Top Rated Movies', this.fetchTopRatedMovies.bind(this), 500);
      const upcomingCount = await this.syncMoviesFromSource('Upcoming Movies', this.fetchUpcomingMovies.bind(this), 100);
      const nowPlayingCount = await this.syncMoviesFromSource('Now Playing Movies', this.fetchNowPlayingMovies.bind(this), 100);
      
      const totalMovies = popularCount + topRatedCount + upcomingCount + nowPlayingCount;
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log('\n🎉 BULK SYNC COMPLETED!');
      console.log('================================');
      console.log(`📊 Total movies processed: ${totalMovies}`);
      console.log(`✅ Successfully synced: ${this.totalSynced}`);
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
      console.error('❌ Bulk sync failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    }
  }
}

// Run the bulk sync
const syncer = new BulkMovieSyncer();
syncer.runBulkSync().catch(console.error);
