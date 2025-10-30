import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MovieSEOData, TVShowSEOData, generateMovieSEO, generateTVShowSEO, generateMovieJSONLD, generateTVShowJSONLD, truncateText } from '../lib/seoUtils';

interface MovieSEOProps {
  movie: MovieSEOData;
  siteName?: string;
  siteUrl?: string;
  twitterHandle?: string;
}

interface TVShowSEOProps {
  tvShow: TVShowSEOData;
  siteName?: string;
  siteUrl?: string;
  twitterHandle?: string;
}

export const MovieSEO: React.FC<MovieSEOProps> = ({ 
  movie, 
  siteName = 'MovieStream',
  siteUrl = process.env.REACT_APP_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://visionary-lebkuchen-a7e181.netlify.app'),
  twitterHandle = '@MovieStream'
}) => {
  const seoData = generateMovieSEO(movie, { siteName, siteUrl, twitterHandle, defaultImage: '/placeholder-movie.jpg' });
  const jsonLD = generateMovieJSONLD(movie, { siteName, siteUrl, twitterHandle, defaultImage: '/placeholder-movie.jpg' });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title} | {siteName}</title>
      <meta name="description" content={truncateText(seoData.description)} />
      <link rel="canonical" href={seoData.url} />

      {/* OpenGraph Meta Tags */}
      <meta property="og:type" content={seoData.type} />
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={truncateText(seoData.description)} />
      <meta property="og:image" content={seoData.image} />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="720" />
      <meta property="og:image:alt" content={`${movie.title} poster`} />
      <meta property="og:url" content={seoData.url} />
      <meta property="og:site_name" content={seoData.siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Movie-specific OpenGraph tags */}
      <meta property="video:release_date" content={movie.releaseDate} />
      <meta property="video:duration" content={movie.runtime ? `${movie.runtime * 60}` : undefined} />
      <meta property="video:tag" content={seoData.genres} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={truncateText(seoData.description)} />
      <meta name="twitter:image" content={seoData.image} />
      <meta name="twitter:image:alt" content={`${movie.title} poster`} />

      {/* Additional Meta Tags */}
      <meta name="keywords" content={`${movie.title}, ${seoData.genres}, movie, streaming, ${seoData.year}`} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content={siteName} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLD)}
      </script>
    </Helmet>
  );
};

export const TVShowSEO: React.FC<TVShowSEOProps> = ({ 
  tvShow, 
  siteName = 'MovieStream',
  siteUrl = process.env.REACT_APP_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://visionary-lebkuchen-a7e181.netlify.app'),
  twitterHandle = '@MovieStream'
}) => {
  const seoData = generateTVShowSEO(tvShow, { siteName, siteUrl, twitterHandle, defaultImage: '/placeholder-movie.jpg' });
  const jsonLD = generateTVShowJSONLD(tvShow, { siteName, siteUrl, twitterHandle, defaultImage: '/placeholder-movie.jpg' });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title} | {siteName}</title>
      <meta name="description" content={truncateText(seoData.description)} />
      <link rel="canonical" href={seoData.url} />

      {/* OpenGraph Meta Tags */}
      <meta property="og:type" content={seoData.type} />
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={truncateText(seoData.description)} />
      <meta property="og:image" content={seoData.image} />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="720" />
      <meta property="og:image:alt" content={`${tvShow.name} poster`} />
      <meta property="og:url" content={seoData.url} />
      <meta property="og:site_name" content={seoData.siteName} />
      <meta property="og:locale" content="en_US" />

      {/* TV Show-specific OpenGraph tags */}
      <meta property="video:release_date" content={tvShow.firstAirDate} />
      <meta property="video:tag" content={seoData.genres} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={truncateText(seoData.description)} />
      <meta name="twitter:image" content={seoData.image} />
      <meta name="twitter:image:alt" content={`${tvShow.name} poster`} />

      {/* Additional Meta Tags */}
      <meta name="keywords" content={`${tvShow.name}, ${seoData.genres}, TV show, series, streaming, ${seoData.year}`} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content={siteName} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLD)}
      </script>
    </Helmet>
  );
};
