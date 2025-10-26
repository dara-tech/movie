# Fetch More Movies from TMDB

This guide explains how to fetch additional movies from TMDB that continues from the last synced movie ID.

## Features

- **Continues from Last ID**: Automatically detects and continues from the highest TMDB ID in your database
- **Multiple Categories**: Syncs from popular, trending, top_rated, and upcoming movies
- **Comprehensive Data**: Fetches full movie details including genres, runtime, ratings, and Vidsrc URLs
- **Smart Skipping**: Automatically skips movies that already exist in your database
- **Progress Tracking**: Shows real-time progress and statistics

## Usage

### Basic Usage (Continues from Last ID)

```bash
node fetch-more-tmdb-movies.js
```

This will:
- Find the highest TMDB ID in your database
- Fetch 50 pages (default) from each category
- Only sync movies with IDs higher than your last synced ID

### Specify Number of Pages

```bash
node fetch-more-tmdb-movies.js --pages 100
```

Sync up to 100 pages from each category.

### Start from Specific TMDB ID

```bash
node fetch-more-tmdb-movies.js --from-id 55000
```

Start fetching from TMDB ID 55000 (useful if you want to sync a specific range).

### Start from Beginning

```bash
node fetch-more-tmdb-movies.js --start-over
```

Start from ID 0 (will skip existing movies but check from the beginning).

## Parameters

- `--pages <number>`: Maximum pages to fetch per category (default: 50)
- `--from-id <number>`: Start from a specific TMDB ID
- `--start-over`: Start from TMDB ID 0

## How It Works

1. **Detect Last ID**: The script finds the highest `tmdbId` in your database
2. **Fetch by Category**: For each category (popular, trending, top_rated, upcoming):
   - Fetch pages sequentially
   - For each movie, check if the TMDB ID is greater than the last synced ID
   - Skip movies that already exist or have lower IDs
   - Fetch detailed information and generate Vidsrc URLs
3. **Update Database**: Each new movie is saved with full details

## Example Output

```
🎬 Starting TMDB Movie Sync
================================
📊 Configuration:
   - Max pages per category: 50
   - Start from last ID: true
   - Last TMDB ID in database: 623491

📂 Syncing genres...
✅ Synced 19 genres

🎬 Syncing popular movies...
   📄 Page 1 completed: 15 new movies synced
   ✅ Synced 30 movies so far... (Page 2)
   📄 Page 2 completed: 10 new movies synced
   ...

🎉 Sync completed!
================================
📈 Results:
   - Movies synced: 245
   - Skipped (already exists): 55
   - Errors: 2
   - Duration: 450 seconds
   - Average: 0.5 movies/second
   - Started from TMDB ID: 623491
```

## Tips

1. **Rate Limiting**: The script includes built-in rate limiting to avoid API throttling
2. **Resume Capability**: If the script is interrupted, just run it again - it will continue from where it left off
3. **Monitor Progress**: Watch the console output to track which movies are being synced
4. **Large Syncs**: For syncing thousands of movies, consider running the script multiple times with smaller page limits

## Categories

The script syncs movies from these TMDB categories:
- **Popular**: Currently popular movies
- **Trending**: Movies trending this week
- **Top Rated**: Highest rated movies of all time
- **Upcoming**: Movies releasing soon

Each category contributes to a comprehensive movie database while avoiding excessive duplicates.

## Environment Variables

Make sure you have your TMDB API key set in your `.env` file:

```env
TMDB_API_KEY=your_tmdb_api_key_here
```

## Notes

- TMDB IDs are not necessarily sequential, but they are generally ordered
- The script respects TMDB's rate limits
- Movies with missing essential data (title, release date) are skipped
- Vidsrc URLs are automatically generated for all synced movies
