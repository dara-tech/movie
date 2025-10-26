# Sync Top 10,000 TV Shows

## Quick Start

To sync the top 10,000 TV shows from TMDB:

```bash
node bulk-sync-tvshows.js --top10k
```

## What This Does

The `--top10k` option:
- ✅ Syncs from **popular**, **top_rated**, and **trending** categories
- ✅ Fetches up to **500 pages** per category (20 TV shows per page)
- ✅ Automatically deduplicates shows
- ✅ Includes genres, details, and Vidsrc URLs
- ✅ Target: **10,000+ high-quality TV shows**

## Details

### Categories Used
1. **Popular** - Most viewed TV shows
2. **Top Rated** - Highest rated by users  
3. **Trending** - Currently trending

### Expected Results
- **Total pages**: 500 per category × 3 = 1,500 API calls
- **Estimated time**: 2-3 hours (due to rate limiting)
- **Unique TV shows**: ~8,000-12,000 (after deduplication)
- **Data included**:
  - Full TV show details
  - Episodes and seasons
  - IMDB/TMDB IDs
  - Streaming URLs (Vidsrc)
  - Genres and categories

## Production Usage

Recommended for production deployment:

```bash
# Run as background job
nohup node bulk-sync-tvshows.js --top10k > sync.log 2>&1 &
```

## Monitor Progress

```bash
# Watch the log
tail -f sync.log

# Or run in foreground to see progress
node bulk-sync-tvshows.js --top10k
```

## Performance

- **Rate limiting**: TMDB allows 40 requests per 10 seconds
- **Optimization**: Built-in delays prevent rate limit errors
- **Speed**: ~500-1,000 TV shows per hour

## Alternative Options

```bash
# Sync without genres (faster)
node bulk-sync-tvshows.js --top10k --no-genres

# Custom page count
node bulk-sync-tvshows.js --pages 100

# Specific categories only
node bulk-sync-tvshows.js --categories popular,top_rated --pages 250
```
