const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your-tmdb-api-key';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {
  constructor() {
    this.apiKey = TMDB_API_KEY;
    this.baseURL = TMDB_BASE_URL;
  }

  async getPopularMovies(page = 1) {
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
      console.error('Error fetching popular movies from TMDB:', error);
      throw error;
    }
  }

  async getTrendingMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/trending/movie/week`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending movies from TMDB:', error);
      throw error;
    }
  }

  async getTopRatedMovies(page = 1) {
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
      console.error('Error fetching top rated movies from TMDB:', error);
      throw error;
    }
  }

  async getUpcomingMovies(page = 1) {
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
      console.error('Error fetching upcoming movies from TMDB:', error);
      throw error;
    }
  }

  async getMovieDetails(movieId) {
    try {
      const response = await axios.get(`${this.baseURL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          append_to_response: 'credits,videos,images,external_ids'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details from TMDB:', error);
      throw error;
    }
  }

  async searchMovies(query, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies from TMDB:', error);
      throw error;
    }
  }

  async getGenres() {
    try {
      const response = await axios.get(`${this.baseURL}/genre/movie/list`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching genres from TMDB:', error);
      throw error;
    }
  }

  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          with_genres: genreId,
          page,
          language: 'en-US',
          sort_by: 'popularity.desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by genre from TMDB:', error);
      throw error;
    }
  }

  // TV Show methods
  async getPopularTvShows(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/popular`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular TV shows from TMDB:', error);
      throw error;
    }
  }

  async getTvShowDetails(tvShowId) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/${tvShowId}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          append_to_response: 'credits,videos,images,external_ids'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show details from TMDB:', error);
      throw error;
    }
  }

  async getTvShowEpisodes(tvShowId, seasonNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/${tvShowId}/season/${seasonNumber}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show episodes from TMDB:', error);
      throw error;
    }
  }

  async searchTvShows(query, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/search/tv`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching TV shows from TMDB:', error);
      throw error;
    }
  }

  async getTrendingTvShows(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/trending/tv/week`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending TV shows from TMDB:', error);
      throw error;
    }
  }

  async getTopRatedTvShows(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/top_rated`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated TV shows from TMDB:', error);
      throw error;
    }
  }

  async getOnTheAirTvShows(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/on_the_air`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching on the air TV shows from TMDB:', error);
      throw error;
    }
  }

  async getAiringTodayTvShows(page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/tv/airing_today`, {
        params: {
          api_key: this.apiKey,
          page,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching airing today TV shows from TMDB:', error);
      throw error;
    }
  }

  async getTvShowGenres() {
    try {
      const response = await axios.get(`${this.baseURL}/genre/tv/list`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV show genres from TMDB:', error);
      throw error;
    }
  }

  async getTvShowsByGenre(genreId, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/discover/tv`, {
        params: {
          api_key: this.apiKey,
          with_genres: genreId,
          page,
          language: 'en-US',
          sort_by: 'popularity.desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV shows by genre from TMDB:', error);
      throw error;
    }
  }

  // Helper method to sync TV shows from TMDB to our database
  async syncTvShowsToDatabase(options = {}) {
    try {
      const TvShow = require('../models/TvShow');
      const Genre = require('../models/Genre');
      const vidsrcService = require('./vidsrcService');
      
      const {
        maxPages = 5,
        categories = ['popular', 'trending', 'top_rated', 'on_the_air', 'airing_today'],
        includeGenres = true
      } = options;
      
      console.log(`🔄 Starting TV show sync with categories: ${categories.join(', ')}`);
      
      // First, sync TV show genres if requested
      if (includeGenres) {
        const tvGenresResponse = await this.getTvShowGenres();
        for (const genre of tvGenresResponse.genres) {
          await Genre.findOneAndUpdate(
            { tmdbId: genre.id },
            { name: genre.name, type: 'tv' },
            { upsert: true, new: true }
          );
        }
        console.log(`✅ Synced ${tvGenresResponse.genres.length} TV show genres`);
      }
      
      let totalSynced = 0;
      let totalErrors = 0;
      const syncedIds = new Set();
      
      // Sync from different categories
      for (const category of categories) {
        console.log(`📺 Syncing ${category} TV shows...`);
        
        for (let page = 1; page <= maxPages; page++) {
          try {
            let tvShowsResponse;
            
            switch (category) {
              case 'popular':
                tvShowsResponse = await this.getPopularTvShows(page);
                break;
              case 'trending':
                tvShowsResponse = await this.getTrendingTvShows(page);
                break;
              case 'top_rated':
                tvShowsResponse = await this.getTopRatedTvShows(page);
                break;
              case 'on_the_air':
                tvShowsResponse = await this.getOnTheAirTvShows(page);
                break;
              case 'airing_today':
                tvShowsResponse = await this.getAiringTodayTvShows(page);
                break;
              default:
                continue;
            }
            
            if (!tvShowsResponse || !tvShowsResponse.results) {
              console.warn(`⚠️ No results for ${category} page ${page}`);
              break;
            }
            
            for (const tvShowData of tvShowsResponse.results) {
              // Skip if already synced
              if (syncedIds.has(tvShowData.id)) {
                continue;
              }
              
              try {
                // Get detailed TV show information
                const tvShowDetails = await this.getTvShowDetails(tvShowData.id);
                
                if (tvShowDetails) {
                  // Generate Vidsrc URL if we have external IDs
                  let vidsrcUrl = null;
                  if (tvShowDetails.external_ids?.imdb_id || tvShowData.id) {
                    try {
                      vidsrcUrl = vidsrcService.generateTvShowStreamingUrl({
                        tmdbId: tvShowData.id,
                        imdbId: tvShowDetails.external_ids?.imdb_id
                      });
                    } catch (error) {
                      console.warn(`Could not generate Vidsrc URL for TV show ${tvShowData.name}:`, error.message);
                    }
                  }
                  
                  // Prepare TV show data for database
                  const tvShowDoc = {
                    tmdbId: tvShowDetails.id,
                    imdbId: tvShowDetails.external_ids?.imdb_id || null,
                    name: tvShowDetails.name,
                    originalName: tvShowDetails.original_name,
                    overview: tvShowDetails.overview,
                    firstAirDate: tvShowDetails.first_air_date ? new Date(tvShowDetails.first_air_date) : null,
                    lastAirDate: tvShowDetails.last_air_date ? new Date(tvShowDetails.last_air_date) : null,
                    status: tvShowDetails.status,
                    type: tvShowDetails.type,
                    numberOfSeasons: tvShowDetails.number_of_seasons,
                    numberOfEpisodes: tvShowDetails.number_of_episodes,
                    episodeRunTime: tvShowDetails.episode_run_time,
                    averageRuntime: tvShowDetails.episode_run_time && tvShowDetails.episode_run_time.length > 0 ? 
                      Math.round(tvShowDetails.episode_run_time.reduce((a, b) => a + b, 0) / tvShowDetails.episode_run_time.length) : null,
                    posterPath: tvShowDetails.poster_path,
                    backdropPath: tvShowDetails.backdrop_path,
                    voteAverage: tvShowDetails.vote_average,
                    voteCount: tvShowDetails.vote_count,
                    popularity: tvShowDetails.popularity,
                    originalLanguage: tvShowDetails.original_language,
                    originCountry: tvShowDetails.origin_country,
                    networks: tvShowDetails.networks || [],
                    productionCompanies: tvShowDetails.production_companies || [],
                    createdBy: tvShowDetails.created_by || [],
                    seasons: (tvShowDetails.seasons || []).map(season => ({
                      airDate: season.air_date ? new Date(season.air_date) : null,
                      episodeCount: season.episode_count || 0,
                      id: season.id,
                      name: season.name,
                      overview: season.overview,
                      posterPath: season.poster_path,
                      seasonNumber: season.season_number,
                      voteAverage: season.vote_average || 0
                    })),
                    externalIds: tvShowDetails.external_ids || {},
                    vidsrcUrl: vidsrcUrl,
                    isAvailable: true,
                    lastUpdated: new Date()
                  };
                  
                  // Find genre IDs for this TV show
                  const genreIds = [];
                  for (const genre of tvShowData.genre_ids || []) {
                    const genreDoc = await Genre.findOne({ tmdbId: genre });
                    if (genreDoc) {
                      genreIds.push(genreDoc._id);
                    }
                  }
                  
                  // Save or update TV show in database
                  await TvShow.findOneAndUpdate(
                    { tmdbId: tvShowDetails.id },
                    { ...tvShowDoc, genres: genreIds },
                    { upsert: true, new: true }
                  );
                  
                  syncedIds.add(tvShowData.id);
                  totalSynced++;
                  
                  if (totalSynced % 10 === 0) {
                    console.log(`✅ Synced ${totalSynced} TV shows so far...`);
                  }
                }
              } catch (error) {
                console.error(`❌ Error syncing TV show ${tvShowData.id}:`, error.message);
                totalErrors++;
              }
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.error(`❌ Error fetching ${category} page ${page}:`, error.message);
            totalErrors++;
          }
        }
      }
      
      console.log(`🎬 TV show sync completed: ${totalSynced} synced, ${totalErrors} errors`);
      return { synced: totalSynced, errors: totalErrors };
      
    } catch (error) {
      console.error('Error syncing TV shows from TMDB:', error);
      throw error;
    }
  }

  // Helper method to sync movies from TMDB to our database
  async syncMoviesToDatabase(options = {}) {
    try {
      const Movie = require('../models/Movie');
      const Genre = require('../models/Genre');
      const vidsrcService = require('./vidsrcService');
      
      const {
        maxPages = 500,
        startFromLastId = true,
        minTmdbId = null
      } = options;
      
      console.log(`🔄 Starting movie sync...`);
      console.log(`   - Max pages: ${maxPages}`);
      console.log(`   - Start from last ID: ${startFromLastId}`);
      
      // Get the last TMDB ID from the database
      let startTmdbId = 0;
      if (startFromLastId) {
        const lastMovie = await Movie.findOne().sort({ tmdbId: -1 });
        if (lastMovie && lastMovie.tmdbId) {
          startTmdbId = lastMovie.tmdbId;
          console.log(`   - Last TMDB ID in database: ${startTmdbId}`);
        }
      } else if (minTmdbId) {
        startTmdbId = minTmdbId;
        console.log(`   - Starting from TMDB ID: ${startTmdbId}`);
      }
      
      // First, sync genres
      console.log('📂 Syncing genres...');
      const genresResponse = await this.getGenres();
      for (const genre of genresResponse.genres) {
        await Genre.findOneAndUpdate(
          { tmdbId: genre.id },
          { name: genre.name },
          { upsert: true, new: true }
        );
      }
      console.log(`✅ Synced ${genresResponse.genres.length} genres\n`);
      
      let totalSynced = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const maxTmdbId = 1000000; // Reasonable upper limit for TMDB IDs
      
      // Sync movies from multiple categories
      const categories = [
        { name: 'popular', fetchFn: (page) => this.getPopularMovies(page) },
        { name: 'trending', fetchFn: (page) => this.getTrendingMovies(page) },
        { name: 'top_rated', fetchFn: (page) => this.getTopRatedMovies(page) },
        { name: 'upcoming', fetchFn: (page) => this.getUpcomingMovies(page) }
      ];
      
      for (const category of categories) {
        console.log(`\n🎬 Syncing ${category.name} movies...`);
        
        for (let page = 1; page <= maxPages; page++) {
          try {
            const moviesResponse = await category.fetchFn(page);
            
            if (!moviesResponse || !moviesResponse.results || moviesResponse.results.length === 0) {
              console.log(`⚠️  No more movies in ${category.name} at page ${page}`);
              break;
            }
            
            let pageSynced = 0;
            
            for (const movieData of moviesResponse.results) {
              try {
                // Skip movies that exceed reasonable TMDB ID limits
                if (movieData.id > maxTmdbId) {
                  continue;
                }
                
                // Check if movie already exists (this is the primary check)
                const existingMovie = await Movie.findOne({ tmdbId: movieData.id });
                if (existingMovie) {
                  totalSkipped++;
                  continue;
                }
                
                // Get detailed movie info
                const movieDetails = await this.getMovieDetails(movieData.id);
                
                // Generate Vidsrc URL if we have external IDs
                let vidsrcUrl = null;
                if (movieDetails.external_ids?.imdb_id || movieData.id) {
                  try {
                    vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
                      tmdbId: movieData.id,
                      imdbId: movieDetails.external_ids?.imdb_id
                    });
                  } catch (error) {
                    console.warn(`Could not generate Vidsrc URL for movie ${movieData.title}:`, error.message);
                  }
                }
                
                // Find genre IDs for this movie
                const genreIds = [];
                for (const genreId of movieData.genre_ids || []) {
                  const genreDoc = await Genre.findOne({ tmdbId: genreId });
                  if (genreDoc) {
                    genreIds.push(genreDoc._id);
                  }
                }
                
                const movie = {
                  tmdbId: movieData.id,
                  imdbId: movieDetails.external_ids?.imdb_id || null,
                  title: movieData.title,
                  overview: movieData.overview || 'No overview available',
                  releaseDate: movieData.release_date ? new Date(movieData.release_date) : new Date(),
                  posterPath: movieData.poster_path,
                  backdropPath: movieData.backdrop_path,
                  runtime: movieDetails.runtime,
                  voteAverage: movieData.vote_average || 0,
                  voteCount: movieData.vote_count || 0,
                  adult: movieData.adult || false,
                  originalLanguage: movieData.original_language || 'en',
                  originalTitle: movieData.original_title || movieData.title,
                  popularity: movieData.popularity || 0,
                  video: movieData.video || false,
                  genres: genreIds,
                  vidsrcUrl: vidsrcUrl,
                  isAvailable: true,
                  lastUpdated: new Date()
                };

                await Movie.findOneAndUpdate(
                  { tmdbId: movieData.id },
                  movie,
                  { upsert: true, new: true }
                );
                
                totalSynced++;
                pageSynced++;
                
                if (totalSynced % 10 === 0) {
                  console.log(`   ✅ Synced ${totalSynced} movies so far... (Page ${page})`);
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
              } catch (error) {
                console.error(`❌ Error syncing movie ${movieData.id}:`, error.message);
                totalErrors++;
              }
            }
            
            console.log(`   📄 Page ${page} completed: ${pageSynced} new movies synced`);
            
            // Add delay between pages
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (error) {
            console.error(`❌ Error fetching ${category.name} page ${page}:`, error.message);
            totalErrors++;
          }
        }
      }
      
      console.log(`\n🎬 Movie sync completed!`);
      console.log(`   - Total synced: ${totalSynced}`);
      console.log(`   - Skipped (already exists): ${totalSkipped}`);
      console.log(`   - Errors: ${totalErrors}`);
      console.log(`   - Started from TMDB ID: ${startTmdbId}`);
      
      return { 
        synced: totalSynced, 
        skipped: totalSkipped, 
        errors: totalErrors,
        startTmdbId: startTmdbId
      };
      
    } catch (error) {
      console.error('Error syncing movies from TMDB:', error);
      throw error;
    }
  }
}

module.exports = new TMDBService();
