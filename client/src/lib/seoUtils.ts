/**
 * SEO and OpenGraph utility functions for movies and TV shows
 */

export interface MovieSEOData {
  title: string;
  overview: string;
  releaseDate: string;
  posterPath?: string;
  backdropPath?: string;
  genres: Array<{ name: string }>;
  voteAverage: number;
  runtime?: number;
  imdbId?: string;
  tmdbId: number;
}

export interface TVShowSEOData {
  name: string;
  overview?: string;
  firstAirDate: string;
  lastAirDate?: string;
  posterPath?: string;
  backdropPath?: string;
  genres: Array<{ name: string }>;
  voteAverage: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  type?: string;
  networks: Array<{ name: string }>;
  createdBy: Array<{ name: string }>;
  tmdbId?: number;
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  twitterHandle?: string;
}

const defaultConfig: SEOConfig = {
  siteName: 'MovieStream',
  siteUrl: process.env.REACT_APP_SITE_URL || 'https://moviestream.app',
  defaultImage: '/placeholder-movie.jpg',
  twitterHandle: '@MovieStream'
};

/**
 * Generate OpenGraph meta tags for movies
 */
export const generateMovieSEO = (movie: MovieSEOData, config: SEOConfig = defaultConfig) => {
  const title = `${movie.title} (${new Date(movie.releaseDate).getFullYear()})`;
  const description = movie.overview || `Watch ${movie.title} - A ${movie.genres.map(g => g.name).join(', ')} movie`;
  const image = movie.backdropPath 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : movie.posterPath 
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : `${config.siteUrl}${config.defaultImage}`;
  
  const url = `${config.siteUrl}/movie/${movie.tmdbId}`;
  const year = new Date(movie.releaseDate).getFullYear();
  const genres = movie.genres.map(g => g.name).join(', ');
  
  return {
    title,
    description,
    image,
    url,
    type: 'video.movie',
    siteName: config.siteName,
    year,
    genres,
    rating: movie.voteAverage,
    runtime: movie.runtime,
    imdbId: movie.imdbId
  };
};

/**
 * Generate OpenGraph meta tags for TV shows
 */
export const generateTVShowSEO = (tvShow: TVShowSEOData, config: SEOConfig = defaultConfig) => {
  const title = `${tvShow.name} (${new Date(tvShow.firstAirDate).getFullYear()})`;
  const description = tvShow.overview || `Watch ${tvShow.name} - A ${tvShow.genres.map(g => g.name).join(', ')} TV series`;
  const image = tvShow.backdropPath 
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdropPath}`
    : tvShow.posterPath 
    ? `https://image.tmdb.org/t/p/w780${tvShow.posterPath}`
    : `${config.siteUrl}${config.defaultImage}`;
  
  const url = `${config.siteUrl}/tvshow/${tvShow.tmdbId}`;
  const year = new Date(tvShow.firstAirDate).getFullYear();
  const genres = tvShow.genres.map(g => g.name).join(', ');
  const creators = tvShow.createdBy.map(c => c.name).join(', ');
  const networks = tvShow.networks.map(n => n.name).join(', ');
  
  return {
    title,
    description,
    image,
    url,
    type: 'video.tv_show',
    siteName: config.siteName,
    year,
    genres,
    rating: tvShow.voteAverage,
    seasons: tvShow.numberOfSeasons,
    episodes: tvShow.numberOfEpisodes,
    status: tvShow.status,
    showType: tvShow.type,
    creators,
    networks
  };
};

/**
 * Generate JSON-LD structured data for movies
 */
export const generateMovieJSONLD = (movie: MovieSEOData, config: SEOConfig = defaultConfig) => {
  const year = new Date(movie.releaseDate).getFullYear();
  const image = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : `${config.siteUrl}${config.defaultImage}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "description": movie.overview,
    "image": image,
    "datePublished": movie.releaseDate,
    "genre": movie.genres.map(g => g.name),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": movie.voteAverage,
      "ratingCount": "1000" // Approximate
    },
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "url": `${config.siteUrl}/movie/${movie.tmdbId}`,
    "sameAs": movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}/` : undefined
  };
};

/**
 * Generate JSON-LD structured data for TV shows
 */
export const generateTVShowJSONLD = (tvShow: TVShowSEOData, config: SEOConfig = defaultConfig) => {
  const image = tvShow.posterPath 
    ? `https://image.tmdb.org/t/p/w780${tvShow.posterPath}`
    : `${config.siteUrl}${config.defaultImage}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": tvShow.name,
    "description": tvShow.overview,
    "image": image,
    "datePublished": tvShow.firstAirDate,
    "dateModified": tvShow.lastAirDate,
    "genre": tvShow.genres.map(g => g.name),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tvShow.voteAverage,
      "ratingCount": "1000" // Approximate
    },
    "numberOfSeasons": tvShow.numberOfSeasons,
    "numberOfEpisodes": tvShow.numberOfEpisodes,
    "url": `${config.siteUrl}/tvshow/${tvShow.tmdbId}`,
    "creator": tvShow.createdBy.map(creator => ({
      "@type": "Person",
      "name": creator.name
    })),
    "publisher": tvShow.networks.map(network => ({
      "@type": "Organization",
      "name": network.name
    }))
  };
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number = 160): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (path: string, config: SEOConfig = defaultConfig): string => {
  return `${config.siteUrl}${path}`;
};
