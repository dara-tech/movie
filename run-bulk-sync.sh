#!/bin/bash

echo "🎬 Starting Bulk Movie Sync to reach 100,000+ movies..."
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your TMDB_API_KEY and MONGODB_URI"
    exit 1
fi

# Check if server is running
if ! curl -s http://localhost:5001/api/movies?limit=1 > /dev/null; then
    echo "❌ Server not running. Please start the server first:"
    echo "   cd /Users/cheolsovandara/Documents/D/Developments/2026/movie && node server/index.js"
    exit 1
fi

echo "✅ Server is running"
echo "🚀 Starting bulk sync..."

# Run the bulk sync
node bulk-sync-movies.js

echo ""
echo "🎉 Bulk sync completed!"
echo "Check the output above for results."
