/**
 * OpenGraph Testing Guide
 * 
 * This file provides instructions for testing the OpenGraph implementation
 * and includes sample URLs for social media debuggers.
 */

// Test URLs for OpenGraph Debuggers:
// 1. Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
// 2. Twitter Card Validator: https://cards-dev.twitter.com/validator
// 3. LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
// 4. OpenGraph.xyz: https://www.opengraph.xyz/

// Sample test URLs (replace with your actual domain):
const testUrls = {
  movie: 'https://yourdomain.com/movie/550', // Fight Club example
  tvShow: 'https://yourdomain.com/tvshow/1399' // Game of Thrones example
};

// Expected OpenGraph tags for movies:
const expectedMovieTags = {
  'og:title': 'Fight Club (1999)',
  'og:type': 'video.movie',
  'og:description': 'A ticking-time-bomb insomniac and a slippery soap salesman...',
  'og:image': 'https://image.tmdb.org/t/p/w1280/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'og:url': 'https://yourdomain.com/movie/550',
  'og:site_name': 'MovieStream',
  'video:release_date': '1999-10-15',
  'video:duration': '8160', // 136 minutes in seconds
  'video:tag': 'Drama, Thriller',
  'twitter:card': 'summary_large_image',
  'twitter:title': 'Fight Club (1999)',
  'twitter:description': 'A ticking-time-bomb insomniac and a slippery soap salesman...',
  'twitter:image': 'https://image.tmdb.org/t/p/w1280/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg'
};

// Expected OpenGraph tags for TV shows:
const expectedTVShowTags = {
  'og:title': 'Game of Thrones (2011)',
  'og:type': 'video.tv_show',
  'og:description': 'Nine noble families fight for control over the lands of Westeros...',
  'og:image': 'https://image.tmdb.org/t/p/w1280/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
  'og:url': 'https://yourdomain.com/tvshow/1399',
  'og:site_name': 'MovieStream',
  'video:release_date': '2011-04-17',
  'video:tag': 'Drama, Fantasy, Action',
  'twitter:card': 'summary_large_image',
  'twitter:title': 'Game of Thrones (2011)',
  'twitter:description': 'Nine noble families fight for control over the lands of Westeros...',
  'twitter:image': 'https://image.tmdb.org/t/p/w1280/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg'
};

// JSON-LD structured data example for movies:
const movieJSONLD = {
  "@context": "https://schema.org",
  "@type": "Movie",
  "name": "Fight Club",
  "description": "A ticking-time-bomb insomniac and a slippery soap salesman...",
  "image": "https://image.tmdb.org/t/p/w780/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "datePublished": "1999-10-15",
  "genre": ["Drama", "Thriller"],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 8.4,
    "ratingCount": "1000"
  },
  "duration": "PT136M",
  "url": "https://yourdomain.com/movie/550",
  "sameAs": "https://www.imdb.com/title/tt0137523/"
};

// JSON-LD structured data example for TV shows:
const tvShowJSONLD = {
  "@context": "https://schema.org",
  "@type": "TVSeries",
  "name": "Game of Thrones",
  "description": "Nine noble families fight for control over the lands of Westeros...",
  "image": "https://image.tmdb.org/t/p/w780/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
  "datePublished": "2011-04-17",
  "dateModified": "2019-05-19",
  "genre": ["Drama", "Fantasy", "Action"],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 8.3,
    "ratingCount": "1000"
  },
  "numberOfSeasons": 8,
  "numberOfEpisodes": 73,
  "url": "https://yourdomain.com/tvshow/1399",
  "creator": [
    {
      "@type": "Person",
      "name": "David Benioff"
    },
    {
      "@type": "Person",
      "name": "D.B. Weiss"
    }
  ],
  "publisher": [
    {
      "@type": "Organization",
      "name": "HBO"
    }
  ]
};

// Testing Checklist:
const testingChecklist = [
  '✅ Install react-helmet-async',
  '✅ Create SEO utility functions',
  '✅ Implement MovieSEO component',
  '✅ Implement TVShowSEO component',
  '✅ Add HelmetProvider to App.tsx',
  '✅ Integrate SEO components in MovieDetailPage',
  '✅ Integrate SEO components in TVShowDetailPage',
  '✅ Add JSON-LD structured data',
  '⏳ Test with Facebook Sharing Debugger',
  '⏳ Test with Twitter Card Validator',
  '⏳ Test with LinkedIn Post Inspector',
  '⏳ Verify meta tags in browser dev tools',
  '⏳ Test social media sharing previews'
];

export { testUrls, expectedMovieTags, expectedTVShowTags, movieJSONLD, tvShowJSONLD, testingChecklist };
