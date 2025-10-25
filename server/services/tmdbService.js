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

  // Helper method to sync movies from TMDB to our database
  async syncMoviesToDatabase() {
    try {
      const Movie = require('../models/Movie');
      const Genre = require('../models/Genre');
      
      // First, sync genres
      const genresResponse = await this.getGenres();
      for (const genre of genresResponse.genres) {
        await Genre.findOneAndUpdate(
          { tmdbId: genre.id },
          { name: genre.name },
          { upsert: true, new: true }
        );
      }

      // Then sync popular movies
      const popularMovies = await this.getPopularMovies(1);
      const vidsrcService = require('./vidsrcService');
      
      for (const movieData of popularMovies.results) {
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
          vidsrcUrl: vidsrcUrl,
          isAvailable: true
        };

        // Find genre IDs for this movie
        const genreIds = [];
        for (const genre of movieData.genre_ids) {
          const genreDoc = await Genre.findOne({ tmdbId: genre });
          if (genreDoc) {
            genreIds.push(genreDoc._id);
          }
        }

        await Movie.findOneAndUpdate(
          { tmdbId: movieData.id },
          { ...movie, genres: genreIds },
          { upsert: true, new: true }
        );
      }

      console.log('Movies synced successfully from TMDB');
    } catch (error) {
      console.error('Error syncing movies from TMDB:', error);
      throw error;
    }
  }
}

module.exports = new TMDBService();
