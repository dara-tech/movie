// Client-side Vidsrc service for generating streaming URLs

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class VidsrcService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get streaming URL for a movie
   * @param {string} movieId - Movie ID
   * @param {Object} options - Streaming options
   * @returns {Promise<string>} Streaming URL
   */
  async getMovieStreamingUrl(movieId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.subUrl) params.append('subUrl', options.subUrl);
      if (options.dsLang) params.append('dsLang', options.dsLang);
      if (options.autoplay !== undefined) params.append('autoplay', options.autoplay);

      const response = await fetch(`${this.baseURL}/vidsrc/movie/${movieId}/stream?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get streaming URL');
      }
      
      return data.streamingUrl;
    } catch (error) {
      console.error('Error getting movie streaming URL:', error);
      throw error;
    }
  }

  /**
   * Get streaming URL for a TV show
   * @param {string} tvShowId - TV Show ID
   * @param {Object} options - Streaming options
   * @returns {Promise<string>} Streaming URL
   */
  async getTvShowStreamingUrl(tvShowId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.dsLang) params.append('dsLang', options.dsLang);

      const response = await fetch(`${this.baseURL}/vidsrc/tv/${tvShowId}/stream?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get streaming URL');
      }
      
      return data.streamingUrl;
    } catch (error) {
      console.error('Error getting TV show streaming URL:', error);
      throw error;
    }
  }

  /**
   * Get streaming URL for a specific episode
   * @param {string} tvShowId - TV Show ID
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @param {Object} options - Streaming options
   * @returns {Promise<string>} Streaming URL
   */
  async getEpisodeStreamingUrl(tvShowId, season, episode, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.subUrl) params.append('subUrl', options.subUrl);
      if (options.dsLang) params.append('dsLang', options.dsLang);
      if (options.autoplay !== undefined) params.append('autoplay', options.autoplay);
      if (options.autonext !== undefined) params.append('autonext', options.autonext);

      const response = await fetch(`${this.baseURL}/vidsrc/tv/${tvShowId}/season/${season}/episode/${episode}/stream?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get streaming URL');
      }
      
      return data.streamingUrl;
    } catch (error) {
      console.error('Error getting episode streaming URL:', error);
      throw error;
    }
  }

  /**
   * Get latest movies from Vidsrc
   * @param {number} page - Page number
   * @returns {Promise<Object>} Latest movies data
   */
  async getLatestMovies(page = 1) {
    try {
      const response = await fetch(`${this.baseURL}/vidsrc/movies/latest/${page}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get latest movies');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting latest movies:', error);
      throw error;
    }
  }

  /**
   * Get latest TV shows from Vidsrc
   * @param {number} page - Page number
   * @returns {Promise<Object>} Latest TV shows data
   */
  async getLatestTvShows(page = 1) {
    try {
      const response = await fetch(`${this.baseURL}/vidsrc/tvshows/latest/${page}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get latest TV shows');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting latest TV shows:', error);
      throw error;
    }
  }

  /**
   * Get latest episodes from Vidsrc
   * @param {number} page - Page number
   * @returns {Promise<Object>} Latest episodes data
   */
  async getLatestEpisodes(page = 1) {
    try {
      const response = await fetch(`${this.baseURL}/vidsrc/episodes/latest/${page}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get latest episodes');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting latest episodes:', error);
      throw error;
    }
  }

  /**
   * Generate Vidsrc URL for any content by external IDs
   * @param {Object} params - Parameters
   * @param {string} params.type - Content type ('movie' or 'tv')
   * @param {string|undefined} params.imdbId - IMDB ID
   * @param {string|number|undefined} params.tmdbId - TMDB ID
   * @param {number} params.season - Season number (for TV episodes)
   * @param {number} params.episode - Episode number (for TV episodes)
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} Generated streaming URL
   */
  async generateUrl(params) {
    try {
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );

      const response = await fetch(`${this.baseURL}/vidsrc/generate-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanParams),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate URL');
      }
      
      return data.streamingUrl;
    } catch (error) {
      console.error('Error generating Vidsrc URL:', error);
      throw error;
    }
  }

  /**
   * Check if a movie has Vidsrc streaming available
   * @param {Object} movie - Movie object
   * @returns {boolean} Whether Vidsrc streaming is available
   */
  hasVidsrcStreaming(movie) {
    return !!(movie.vidsrcUrl || (movie.tmdbId || movie.imdbId));
  }

  /**
   * Get streaming quality options (for future enhancement)
   * @returns {Array} Available quality options
   */
  getQualityOptions() {
    return [
      { value: 'auto', label: 'Auto' },
      { value: '1080p', label: '1080p' },
      { value: '720p', label: '720p' },
      { value: '480p', label: '480p' },
      { value: '360p', label: '360p' }
    ];
  }

  /**
   * Get subtitle language options
   * @returns {Array} Available subtitle languages
   */
  getSubtitleLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' }
    ];
  }
}

export default new VidsrcService();
