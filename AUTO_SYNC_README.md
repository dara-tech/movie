# Auto Sync from TMDB

This document explains how to use the automatic synchronization feature that keeps your movie database up-to-date with the latest content from The Movie Database (TMDB).

## Features

- **Automated Scheduling**: Set up cron-based schedules for automatic syncing
- **Multiple Content Types**: Sync popular, trending, top-rated, and upcoming movies
- **Vidsrc Integration**: Automatically generates Vidsrc streaming URLs
- **Real-time Monitoring**: Track sync status and statistics
- **Error Handling**: Robust error handling with detailed logging
- **Admin Panel**: Web-based interface for managing sync settings

## Quick Start

### 1. Start Server with Auto-Sync

```bash
# Start server with auto-sync enabled (daily at 2 AM)
node start-with-sync.js
```

### 2. Use the Admin Panel

1. Start your server: `npm start` (in server directory)
2. Open your browser and go to: `http://localhost:3000/admin/sync`
3. Configure your sync settings and start auto-sync

### 3. Manual Sync via API

```bash
# Perform immediate sync
curl -X POST http://localhost:5001/api/auto-sync/sync-now \
  -H "Content-Type: application/json" \
  -d '{"pages": 5, "includeTrending": true, "includePopular": true}'

# Start daily auto-sync
curl -X POST http://localhost:5001/api/auto-sync/schedule/daily \
  -H "Content-Type: application/json" \
  -d '{"hour": 2, "pages": 5}'
```

## API Endpoints

### Status and Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auto-sync/status` | Get current sync status and statistics |
| POST | `/api/auto-sync/start` | Start auto-sync with custom settings |
| POST | `/api/auto-sync/stop` | Stop auto-sync service |
| POST | `/api/auto-sync/sync-now` | Perform immediate sync |

### Scheduling

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auto-sync/schedules` | Get available schedule templates |
| POST | `/api/auto-sync/schedule/daily` | Set daily sync schedule |
| POST | `/api/auto-sync/schedule/hourly` | Set hourly sync schedule |
| POST | `/api/auto-sync/schedule/custom` | Set custom cron schedule |

## Configuration Options

### Sync Settings

```javascript
{
  "pages": 5,                    // Number of pages to sync (1-20)
  "includeTrending": true,       // Include trending movies
  "includePopular": true,        // Include popular movies
  "includeTopRated": false,      // Include top-rated movies
  "includeUpcoming": false       // Include upcoming movies
}
```

### Schedule Options

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Hourly | `0 * * * *` | Every hour |
| Daily | `0 2 * * *` | Daily at 2 AM UTC |
| Twice Daily | `0 2,14 * * *` | 2 AM and 2 PM UTC |
| Weekly | `0 2 * * 0` | Every Sunday at 2 AM UTC |
| Custom | User-defined | Any valid cron expression |

## Monitoring

### Sync Statistics

The system tracks the following metrics:

- **Total Movies**: Total number of movies processed
- **New Movies**: Movies added for the first time
- **Updated Movies**: Existing movies that were updated
- **Vidsrc URLs**: Movies with generated streaming URLs
- **Errors**: Number of errors encountered

### Status Monitoring

```bash
# Check sync status
curl http://localhost:5001/api/auto-sync/status
```

Response:
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "lastSync": "2024-01-15T02:00:00.000Z",
    "stats": {
      "totalMovies": 150,
      "newMovies": 25,
      "updatedMovies": 125,
      "vidsrcUrls": 140,
      "errors": 2
    },
    "scheduledJobs": ["main"]
  }
}
```

## Error Handling

The auto-sync service includes comprehensive error handling:

- **API Rate Limiting**: Built-in delays to respect TMDB rate limits
- **Network Errors**: Automatic retry logic for transient failures
- **Data Validation**: Validates movie data before database insertion
- **Logging**: Detailed logging for debugging and monitoring

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
TMDB_API_KEY=your_tmdb_api_key_here
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
```

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with auto-sync
pm2 start start-with-sync.js --name "movie-app-with-sync"

# Monitor
pm2 monit

# View logs
pm2 logs movie-app-with-sync
```

### Using Docker

```dockerfile
# Add to your Dockerfile
COPY start-with-sync.js ./
CMD ["node", "start-with-sync.js"]
```

### Using Systemd

Create a service file `/etc/systemd/system/movie-app-sync.service`:

```ini
[Unit]
Description=Movie App with Auto Sync
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node start-with-sync.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### Common Issues

1. **TMDB API Key Invalid**
   - Check your `.env` file
   - Verify the API key at https://www.themoviedb.org/settings/api

2. **Database Connection Failed**
   - Verify MongoDB connection string
   - Check if MongoDB is running

3. **Sync Not Running**
   - Check server logs for errors
   - Verify cron expression is valid
   - Ensure the service is started

4. **High Error Rate**
   - Check TMDB API rate limits
   - Verify network connectivity
   - Review error logs for specific issues

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=auto-sync:*
```

## Advanced Configuration

### Custom Cron Expressions

The system supports any valid cron expression:

```javascript
// Every 6 hours
"0 */6 * * *"

// Every Monday at 3 AM
"0 3 * * 1"

// Every 15 minutes
"*/15 * * * *"
```

### Batch Processing

For large datasets, consider:

- Reducing pages per sync
- Running sync during off-peak hours
- Using multiple smaller sync jobs

### Performance Optimization

- **Database Indexing**: Ensure proper indexes on `tmdbId` and `imdbId`
- **Memory Management**: Monitor memory usage during large syncs
- **Rate Limiting**: Adjust delays based on your TMDB API tier

## Support

For issues or questions:

1. Check the server logs
2. Review the API status endpoint
3. Verify your TMDB API key and quotas
4. Check database connectivity

The auto-sync service is designed to be robust and self-healing, but monitoring and occasional manual intervention may be needed for optimal performance.
