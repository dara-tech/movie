# TMDB TV Show Categories

## Available Categories

Your application now syncs from **ALL 5 TV show categories** in TMDB:

### 1. **Popular** (`popular`)
- **Description**: Most popular TV shows with high viewership
- **Endpoint**: `/tv/popular`
- **Data**: Current most-viewed TV shows across the platform
- **Expected**: ~20,000-30,000 shows available

### 2. **Trending** (`trending`)
- **Description**: Currently trending this week
- **Endpoint**: `/trending/tv/week`
- **Data**: Shows gaining popularity rapidly
- **Expected**: ~10,000-15,000 shows available

### 3. **Top Rated** (`top_rated`)
- **Description**: Highest rated TV shows by users
- **Endpoint**: `/tv/top_rated`
- **Data**: Critically acclaimed and highly-rated shows
- **Expected**: ~15,000-20,000 shows available

### 4. **On The Air** (`on_the_air`)
- **Description**: Currently airing TV shows with new episodes
- **Endpoint**: `/tv/on_the_air`
- **Data**: Active shows releasing new episodes
- **Expected**: ~5,000-8,000 shows available

### 5. **Airing Today** (`airing_today`)
- **Description**: TV shows that have episodes airing today
- **Endpoint**: `/tv/airing_today`
- **Data**: Shows with episodes scheduled for today
- **Expected**: ~500-1,000 shows available

## Usage

### Sync All Categories (Default)
```bash
node bulk-sync-tvshows.js
```

### Sync Specific Categories
```bash
node bulk-sync-tvshows.js --categories popular,trending,top_rated
```

### Sync with More Pages
```bash
node bulk-sync-tvshows.js --pages 20
```

## Estimated Total TV Shows

With all categories and pagination:
- **Minimum**: ~50,000+ TV shows
- **Recommended**: Sync 10-20 pages per category
- **Potential**: Up to 100,000+ TV shows

## Notes

- Some TV shows appear in multiple categories
- The sync automatically deduplicates by TMDB ID
- TMDB API pagination typically caps at 500 pages
- Rate limiting: 40 requests per 10 seconds
