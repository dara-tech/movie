const VIDSRC_BASE_URL = 'https://vidsrc-embed.ru';

class VidsrcService {
  constructor() {
    this.baseURL = VIDSRC_BASE_URL;
  }

  /**
   * Generate Vidsrc embed URL for a movie
   * @param {string|number} imdbId - IMDB ID (with or without 'tt' prefix)
   * @param {string|number} tmdbId - TMDB ID (alternative to IMDB)
   * @param {Object} options - Additional options
   * @param {string} options.subUrl - Subtitle URL (URL encoded)
   * @param {string} options.dsLang - Default subtitle language (ISO639 code)
   * @param {number} options.autoplay - Enable/disable autoplay (1 or 0)
   * @returns {string} Vidsrc embed URL
   */
  getMovieEmbedUrl(imdbId = null, tmdbId = null, options = {}) {
    if (!imdbId && !tmdbId) {
      throw new Error('Either imdbId or tmdbId is required');
    }

    const params = new URLSearchParams();
    
    if (imdbId) {
      // Ensure IMDB ID has 'tt' prefix
      const cleanImdbId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
      params.append('imdb', cleanImdbId);
    }
    
    if (tmdbId) {
      params.append('tmdb', tmdbId);
    }

    // Add optional parameters
    if (options.subUrl) {
      params.append('sub_url', options.subUrl);
    }
    if (options.dsLang) {
      params.append('ds_lang', options.dsLang);
    }
    if (options.autoplay !== undefined) {
      params.append('autoplay', options.autoplay);
    }

    return `${this.baseURL}/embed/movie?${params.toString()}`;
  }

  /**
   * Generate Vidsrc embed URL for a TV show
   * @param {string|number} imdbId - IMDB ID (with or without 'tt' prefix)
   * @param {string|number} tmdbId - TMDB ID (alternative to IMDB)
   * @param {Object} options - Additional options
   * @param {string} options.dsLang - Default subtitle language (ISO639 code)
   * @returns {string} Vidsrc embed URL
   */
  getTvShowEmbedUrl(imdbId = null, tmdbId = null, options = {}) {
    if (!imdbId && !tmdbId) {
      throw new Error('Either imdbId or tmdbId is required');
    }

    const params = new URLSearchParams();
    
    if (imdbId) {
      const cleanImdbId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
      params.append('imdb', cleanImdbId);
    }
    
    if (tmdbId) {
      params.append('tmdb', tmdbId);
    }

    if (options.dsLang) {
      params.append('ds_lang', options.dsLang);
    }

    return `${this.baseURL}/embed/tv?${params.toString()}`;
  }

  /**
   * Generate Vidsrc embed URL for a specific TV episode
   * @param {string|number} imdbId - IMDB ID (with or without 'tt' prefix)
   * @param {string|number} tmdbId - TMDB ID (alternative to IMDB)
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @param {Object} options - Additional options
   * @param {string} options.subUrl - Subtitle URL (URL encoded)
   * @param {string} options.dsLang - Default subtitle language (ISO639 code)
   * @param {number} options.autoplay - Enable/disable autoplay (1 or 0)
   * @param {number} options.autonext - Enable/disable autonext episode (1 or 0)
   * @returns {string} Vidsrc embed URL
   */
  getEpisodeEmbedUrl(imdbId = null, tmdbId = null, season, episode, options = {}) {
    if (!imdbId && !tmdbId) {
      throw new Error('Either imdbId or tmdbId is required');
    }
    if (!season || !episode) {
      throw new Error('Season and episode numbers are required');
    }

    const params = new URLSearchParams();
    
    if (imdbId) {
      const cleanImdbId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
      params.append('imdb', cleanImdbId);
    }
    
    if (tmdbId) {
      params.append('tmdb', tmdbId);
    }

    params.append('season', season);
    params.append('episode', episode);

    // Add optional parameters
    if (options.subUrl) {
      params.append('sub_url', options.subUrl);
    }
    if (options.dsLang) {
      params.append('ds_lang', options.dsLang);
    }
    if (options.autoplay !== undefined) {
      params.append('autoplay', options.autoplay);
    }
    if (options.autonext !== undefined) {
      params.append('autonext', options.autonext);
    }

    return `${this.baseURL}/embed/tv?${params.toString()}`;
  }


  /**
   * Generate streaming URL for a movie with fallback options
   * @param {Object} movie - Movie object with tmdbId and/or imdbId
   * @param {Object} options - Streaming options
   * @returns {string} Generated streaming URL
   */
  generateMovieStreamingUrl(movie, options = {}) {
    const { tmdbId, imdbId } = movie;
    
    // Default options
    const defaultOptions = {
      autoplay: 1,
      dsLang: 'en',
      ...options
    };

    try {
      return this.getMovieEmbedUrl(imdbId, tmdbId, defaultOptions);
    } catch (error) {
      console.error('Error generating movie streaming URL:', error);
      return null;
    }
  }

  /**
   * Generate streaming URL for a TV show with fallback options
   * @param {Object} tvShow - TV show object with tmdbId and/or imdbId
   * @param {Object} options - Streaming options
   * @returns {string} Generated streaming URL
   */
  generateTvShowStreamingUrl(tvShow, options = {}) {
    const { tmdbId, imdbId } = tvShow;
    
    const defaultOptions = {
      dsLang: 'en',
      ...options
    };

    try {
      return this.getTvShowEmbedUrl(imdbId, tmdbId, defaultOptions);
    } catch (error) {
      console.error('Error generating TV show streaming URL:', error);
      return null;
    }
  }

  /**
   * Generate streaming URL for a specific TV episode
   * @param {Object} tvShow - TV show object with tmdbId and/or imdbId
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @param {Object} options - Streaming options
   * @returns {string} Generated streaming URL
   */
  generateEpisodeStreamingUrl(tvShow, season, episode, options = {}) {
    const { tmdbId, imdbId } = tvShow;
    
    const defaultOptions = {
      autoplay: 1,
      autonext: 0,
      dsLang: 'en',
      ...options
    };

    try {
      return this.getEpisodeEmbedUrl(imdbId, tmdbId, season, episode, defaultOptions);
    } catch (error) {
      console.error('Error generating episode streaming URL:', error);
      return null;
    }
  }
}

module.exports = new VidsrcService();
