# Quick Start: Fetch More Movies

## Basic Usage

To fetch more movies from TMDB (continues from last synced ID):

```bash
node fetch-more-tmdb-movies.js
```

## With Custom Options

Fetch more pages:
```bash
node fetch-more-tmdb-movies.js --pages 100
```

Start from specific ID:
```bash
node fetch-more-tmdb-movies.js --from-id 55000
```

## What It Does

- Automatically finds the last TMDB ID in your database
- Fetches movies from 4 categories: popular, trending, top_rated, upcoming
- Only syncs new movies (skips existing ones)
- Generates Vidsrc URLs automatically
- Shows progress and statistics

## More Info

See `FETCH_MORE_MOVIES_README.md` for detailed documentation.
