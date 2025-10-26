#!/bin/bash

# Bulk TV Show Sync Script
# This script provides an easy way to sync TV shows from TMDB

echo "📺 Starting Bulk TV Show Sync..."
echo ""

# Default values
PAGES=5
CATEGORIES="popular,trending,top_rated,on_the_air"
INCLUDE_GENRES=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --pages|-p)
      PAGES="$2"
      shift 2
      ;;
    --categories|-c)
      CATEGORIES="$2"
      shift 2
      ;;
    --no-genres)
      INCLUDE_GENRES=false
      shift
      ;;
    --help|-h)
      echo "📺 Bulk TV Show Sync Script"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --pages, -p <number>     Maximum pages to sync per category (default: 5)"
      echo "  --categories, -c <list>  Comma-separated list of categories (default: popular,trending,top_rated,on_the_air)"
      echo "  --no-genres             Skip syncing TV show genres"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Available categories:"
      echo "  - popular: Popular TV shows"
      echo "  - trending: Currently trending TV shows"
      echo "  - top_rated: Top rated TV shows"
      echo "  - on_the_air: Currently airing TV shows"
      echo "  - airing_today: TV shows airing today"
      echo ""
      echo "Examples:"
      echo "  $0"
      echo "  $0 --pages 10"
      echo "  $0 --categories popular,trending --pages 3"
      echo "  $0 --no-genres --pages 20"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Build the command
CMD="node bulk-sync-tvshows.js --pages $PAGES --categories $CATEGORIES"

if [ "$INCLUDE_GENRES" = false ]; then
  CMD="$CMD --no-genres"
fi

echo "🚀 Running: $CMD"
echo ""

# Execute the command
eval $CMD
