/**
 * Streaming Service
 * Handles multiple streaming URL generation (Vidsrc, Vidsrc.to, GodrivePlayer, MultiEmbed)
 */

import vidsrcService from './vidsrcService';

export interface StreamingOption {
  id: string;
  name: string;
  url: string;
  type: 'vidsrc' | 'vidsrc-to' | 'godrive' | 'multiembed';
}

class StreamingService {
  private godriveURL: string;
  private multiEmbedURL: string;
  private vidsrcToURL: string;

  constructor() {
    this.godriveURL = 'https://godriveplayer.com/player.php';
    this.multiEmbedURL = 'https://multiembed.mov';
    this.vidsrcToURL = 'https://vidsrc.to';
  }

  /**
   * Generate GodrivePlayer URL for movies
   */
  generateGodriveMovieUrl({ imdbId, tmdbId }: { imdbId?: string; tmdbId?: number }): string | null {
    if (imdbId) {
      return `${this.godriveURL}?imdb=${imdbId}`;
    } else if (tmdbId) {
      return `${this.godriveURL}?tmdb=${tmdbId}`;
    }
    return null;
  }

  /**
   * Generate MultiEmbed URL for movies
   */
  generateMultiEmbedMovieUrl({ imdbId, tmdbId }: { imdbId?: string; tmdbId?: number }): string | null {
    if (imdbId) {
      // Ensure IMDB ID has tt prefix
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.multiEmbedURL}/?video_id=${cleanImdbId}`;
    } else if (tmdbId) {
      return `${this.multiEmbedURL}/?video_id=${tmdbId}&tmdb=1`;
    }
    return null;
  }

  /**
   * Generate MultiEmbed URL for TV episodes
   */
  generateMultiEmbedEpisodeUrl({ imdbId, tmdbId, season, episode }: { imdbId?: string; tmdbId?: number; season: number; episode: number }): string | null {
    if (imdbId) {
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.multiEmbedURL}/?video_id=${cleanImdbId}&s=${season}&e=${episode}`;
    } else if (tmdbId) {
      return `${this.multiEmbedURL}/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    }
    return null;
  }

  /**
   * Generate Vidsrc.to URL for movies
   */
  generateVidsrcToMovieUrl({ imdbId, tmdbId }: { imdbId?: string; tmdbId?: number }): string | null {
    if (imdbId) {
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.vidsrcToURL}/embed/movie/${cleanImdbId}`;
    } else if (tmdbId) {
      return `${this.vidsrcToURL}/embed/movie/${tmdbId}`;
    }
    return null;
  }

  /**
   * Generate Vidsrc.to URL for TV shows
   */
  generateVidsrcToTvUrl({ imdbId, tmdbId }: { imdbId?: string; tmdbId?: number }): string | null {
    if (imdbId) {
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.vidsrcToURL}/embed/tv/${cleanImdbId}`;
    } else if (tmdbId) {
      return `${this.vidsrcToURL}/embed/tv/${tmdbId}`;
    }
    return null;
  }

  /**
   * Generate Vidsrc.to URL for TV seasons
   */
  generateVidsrcToSeasonUrl({ imdbId, tmdbId, season }: { imdbId?: string; tmdbId?: number; season: number }): string | null {
    if (imdbId) {
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.vidsrcToURL}/embed/tv/${cleanImdbId}/${season}`;
    } else if (tmdbId) {
      return `${this.vidsrcToURL}/embed/tv/${tmdbId}/${season}`;
    }
    return null;
  }

  /**
   * Generate Vidsrc.to URL for TV episodes
   */
  generateVidsrcToEpisodeUrl({ imdbId, tmdbId, season, episode }: { imdbId?: string; tmdbId?: number; season: number; episode: number }): string | null {
    if (imdbId) {
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
      return `${this.vidsrcToURL}/embed/tv/${cleanImdbId}/${season}/${episode}`;
    } else if (tmdbId) {
      return `${this.vidsrcToURL}/embed/tv/${tmdbId}/${season}/${episode}`;
    }
    return null;
  }

  /**
   * Generate all streaming options for a movie
   */
  async generateMovieStreamingOptions(movie: any): Promise<StreamingOption[]> {
    const options: StreamingOption[] = [];

    // Vidsrc option (if available)
    if (movie.vidsrcUrl) {
      options.push({
        id: 'vidsrc',
        name: 'Vidsrc',
        url: movie.vidsrcUrl,
        type: 'vidsrc'
      });
    } else if (movie.tmdbId || movie.imdbId) {
      // Generate Vidsrc URL using the existing service
      try {
        const movieId = movie.tmdbId || movie.imdbId;
        const vidsrcUrl = await vidsrcService.getMovieStreamingUrl(movieId, {
          dsLang: 'en',
          autoplay: 1
        });
        
        if (vidsrcUrl) {
          options.push({
            id: 'vidsrc',
            name: 'Vidsrc',
            url: vidsrcUrl,
            type: 'vidsrc'
          });
        }
      } catch (error) {
        console.warn('Failed to generate Vidsrc URL:', error);
      }
    }

    // Vidsrc.to options
    if (movie.imdbId) {
      const vidsrcToUrl = this.generateVidsrcToMovieUrl({ imdbId: movie.imdbId });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-imdb',
          name: 'Vidsrc.to (IMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    if (movie.tmdbId) {
      const vidsrcToUrl = this.generateVidsrcToMovieUrl({ tmdbId: movie.tmdbId });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-tmdb',
          name: 'Vidsrc.to (TMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    // GodrivePlayer options
    if (movie.imdbId) {
      const godriveUrl = this.generateGodriveMovieUrl({ imdbId: movie.imdbId });
      if (godriveUrl) {
        options.push({
          id: 'godrive-imdb',
          name: 'GodrivePlayer (IMDB)',
          url: godriveUrl,
          type: 'godrive'
        });
      }
    }

    if (movie.tmdbId) {
      const godriveUrl = this.generateGodriveMovieUrl({ tmdbId: movie.tmdbId });
      if (godriveUrl) {
        options.push({
          id: 'godrive-tmdb',
          name: 'GodrivePlayer (TMDB)',
          url: godriveUrl,
          type: 'godrive'
        });
      }
    }

    // MultiEmbed options
    if (movie.imdbId) {
      const multiEmbedUrl = this.generateMultiEmbedMovieUrl({ imdbId: movie.imdbId });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-imdb',
          name: 'MultiEmbed (IMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }

    if (movie.tmdbId) {
      const multiEmbedUrl = this.generateMultiEmbedMovieUrl({ tmdbId: movie.tmdbId });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-tmdb',
          name: 'MultiEmbed (TMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }

    return options;
  }

  /**
   * Generate all streaming options for a TV episode
   */
  async generateEpisodeStreamingOptions(episode: any, tvShow: any): Promise<StreamingOption[]> {
    const options: StreamingOption[] = [];

    // Vidsrc option for episodes using the existing service
    if (tvShow.tmdbId || tvShow.imdbId) {
      try {
        const tvShowId = tvShow.tmdbId || tvShow.imdbId;
        const vidsrcUrl = await vidsrcService.getEpisodeStreamingUrl(
          tvShowId,
          episode.seasonNumber,
          episode.episodeNumber,
          {
            dsLang: 'en',
            autoplay: 1
          }
        );
        
        if (vidsrcUrl) {
          options.push({
            id: 'vidsrc',
            name: 'Vidsrc',
            url: vidsrcUrl,
            type: 'vidsrc'
          });
        }
      } catch (error) {
        console.warn('Failed to generate Vidsrc URL for episode:', error);
      }
    }

    // Vidsrc.to options for episodes
    if (tvShow.imdbId) {
      const vidsrcToUrl = this.generateVidsrcToEpisodeUrl({
        imdbId: tvShow.imdbId,
        season: episode.seasonNumber,
        episode: episode.episodeNumber
      });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-imdb',
          name: 'Vidsrc.to (IMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    if (tvShow.tmdbId) {
      const vidsrcToUrl = this.generateVidsrcToEpisodeUrl({
        tmdbId: tvShow.tmdbId,
        season: episode.seasonNumber,
        episode: episode.episodeNumber
      });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-tmdb',
          name: 'Vidsrc.to (TMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    // MultiEmbed options for episodes
    if (tvShow.imdbId) {
      const multiEmbedUrl = this.generateMultiEmbedEpisodeUrl({
        imdbId: tvShow.imdbId,
        season: episode.seasonNumber,
        episode: episode.episodeNumber
      });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-imdb',
          name: 'MultiEmbed (IMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }

    if (tvShow.tmdbId) {
      const multiEmbedUrl = this.generateMultiEmbedEpisodeUrl({
        tmdbId: tvShow.tmdbId,
        season: episode.seasonNumber,
        episode: episode.episodeNumber
      });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-tmdb',
          name: 'MultiEmbed (TMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }


    return options;
  }

  /**
   * Generate streaming options synchronously (without Vidsrc API calls)
   * This is useful when you want to show options immediately without waiting for API calls
   */
  generateMovieStreamingOptionsSync(movie: any): StreamingOption[] {
    const options: StreamingOption[] = [];

    // Vidsrc option (if already available)
    if (movie.vidsrcUrl) {
      options.push({
        id: 'vidsrc',
        name: 'Vidsrc',
        url: movie.vidsrcUrl,
        type: 'vidsrc'
      });
    }

    // Vidsrc.to options
    if (movie.imdbId) {
      const vidsrcToUrl = this.generateVidsrcToMovieUrl({ imdbId: movie.imdbId });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-imdb',
          name: 'Vidsrc.to (IMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    if (movie.tmdbId) {
      const vidsrcToUrl = this.generateVidsrcToMovieUrl({ tmdbId: movie.tmdbId });
      if (vidsrcToUrl) {
        options.push({
          id: 'vidsrc-to-tmdb',
          name: 'Vidsrc.to (TMDB)',
          url: vidsrcToUrl,
          type: 'vidsrc-to'
        });
      }
    }

    // GodrivePlayer options
    if (movie.imdbId) {
      const godriveUrl = this.generateGodriveMovieUrl({ imdbId: movie.imdbId });
      if (godriveUrl) {
        options.push({
          id: 'godrive-imdb',
          name: 'GodrivePlayer (IMDB)',
          url: godriveUrl,
          type: 'godrive'
        });
      }
    }

    if (movie.tmdbId) {
      const godriveUrl = this.generateGodriveMovieUrl({ tmdbId: movie.tmdbId });
      if (godriveUrl) {
        options.push({
          id: 'godrive-tmdb',
          name: 'GodrivePlayer (TMDB)',
          url: godriveUrl,
          type: 'godrive'
        });
      }
    }

    // MultiEmbed options
    if (movie.imdbId) {
      const multiEmbedUrl = this.generateMultiEmbedMovieUrl({ imdbId: movie.imdbId });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-imdb',
          name: 'MultiEmbed (IMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }

    if (movie.tmdbId) {
      const multiEmbedUrl = this.generateMultiEmbedMovieUrl({ tmdbId: movie.tmdbId });
      if (multiEmbedUrl) {
        options.push({
          id: 'multiembed-tmdb',
          name: 'MultiEmbed (TMDB)',
          url: multiEmbedUrl,
          type: 'multiembed'
        });
      }
    }

    return options;
  }
}

export default new StreamingService();
