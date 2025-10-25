# Vidsrc Integration

This document explains how the Vidsrc streaming service has been integrated into the movie application.

## Overview

Vidsrc is a streaming service that provides embed URLs for movies and TV shows. The integration allows users to stream content directly within the application using iframe embeds.

## Features

### Movies
- Generate streaming URLs for movies using TMDB or IMDB IDs
- Support for subtitle languages and autoplay options
- Automatic URL generation during movie sync from TMDB

### TV Shows
- Support for TV show streaming
- Episode-specific streaming with season and episode numbers
- Auto-next episode functionality

### API Endpoints

#### Movies
- `GET /api/vidsrc/movie/:movieId/stream` - Get streaming URL for a movie
- `GET /api/vidsrc/movies/latest/:page` - Get latest movies from Vidsrc

#### TV Shows
- `GET /api/vidsrc/tv/:tvShowId/stream` - Get streaming URL for a TV show
- `GET /api/vidsrc/tv/:tvShowId/season/:season/episode/:episode/stream` - Get streaming URL for specific episode
- `GET /api/vidsrc/tvshows/latest/:page` - Get latest TV shows from Vidsrc

#### Episodes
- `GET /api/vidsrc/episodes/latest/:page` - Get latest episodes from Vidsrc

#### General
- `POST /api/vidsrc/generate-url` - Generate streaming URL for any content

## Usage Examples

### Client-side Usage

```javascript
import vidsrcService from '../services/vidsrcService';

// Get movie streaming URL
const movieUrl = await vidsrcService.getMovieStreamingUrl('movieId', {
  dsLang: 'en',
  autoplay: 1
});

// Get TV show streaming URL
const tvUrl = await vidsrcService.getTvShowStreamingUrl('tvShowId', {
  dsLang: 'en'
});

// Get episode streaming URL
const episodeUrl = await vidsrcService.getEpisodeStreamingUrl('tvShowId', 1, 1, {
  dsLang: 'en',
  autoplay: 1,
  autonext: 0
});

// Generate URL with external IDs
const customUrl = await vidsrcService.generateUrl({
  type: 'movie',
  tmdbId: 12345,
  imdbId: 'tt1234567',
  options: {
    dsLang: 'en',
    autoplay: 1
  }
});
```

### Server-side Usage

```javascript
const vidsrcService = require('./services/vidsrcService');

// Generate movie URL
const movieUrl = vidsrcService.generateMovieStreamingUrl({
  tmdbId: 12345,
  imdbId: 'tt1234567'
}, {
  dsLang: 'en',
  autoplay: 1
});

// Generate TV show URL
const tvUrl = vidsrcService.generateTvShowStreamingUrl({
  tmdbId: 12345,
  imdbId: 'tt1234567'
}, {
  dsLang: 'en'
});

// Generate episode URL
const episodeUrl = vidsrcService.generateEpisodeStreamingUrl({
  tmdbId: 12345,
  imdbId: 'tt1234567'
}, 1, 1, {
  dsLang: 'en',
  autoplay: 1,
  autonext: 0
});
```

## URL Parameters

### Movie Parameters
- `imdb` or `tmdb` (required) - Movie identifier
- `sub_url` (optional) - URL encoded subtitle file (.srt or .vtt)
- `ds_lang` (optional) - Default subtitle language (ISO639 code)
- `autoplay` (optional) - Enable/disable autoplay (1 or 0, default: 1)

### TV Show Parameters
- `imdb` or `tmdb` (required) - TV show identifier
- `ds_lang` (optional) - Default subtitle language (ISO639 code)

### Episode Parameters
- `imdb` or `tmdb` (required) - TV show identifier
- `season` (required) - Season number
- `episode` (required) - Episode number
- `sub_url` (optional) - URL encoded subtitle file (.srt or .vtt)
- `ds_lang` (optional) - Default subtitle language (ISO639 code)
- `autoplay` (optional) - Enable/disable autoplay (1 or 0, default: 1)
- `autonext` (optional) - Enable/disable auto-next episode (1 or 0, default: 0)

## Supported Languages

The service supports various subtitle languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

## Components

### MoviePlayer
- Automatically uses Vidsrc URLs when available
- Falls back to regular video streaming
- Hides custom controls when using Vidsrc iframe

### TvShowPlayer
- Supports episode-specific streaming
- Shows episode information sidebar
- Handles season/episode navigation

### MovieCard/TvShowCard
- Displays streaming availability indicators
- Shows "Stream" badge when Vidsrc is available

## Database Changes

### Movie Model
- Added `imdbId` field for IMDB identifier
- Added `vidsrcUrl` field for pre-generated Vidsrc URLs

### New Models
- `TvShow` - TV show information
- `Episode` - Episode information with season/episode numbers

## Error Handling

The integration includes comprehensive error handling:
- Graceful fallback to regular streaming when Vidsrc fails
- User-friendly error messages
- Retry functionality for failed requests

## Security Considerations

- All Vidsrc URLs are generated server-side
- No direct client access to Vidsrc API keys
- CORS handling for subtitle URLs
- Input validation for all parameters

## Future Enhancements

- Quality selection options
- Subtitle management
- Playlist functionality
- Offline caching
- Analytics integration
