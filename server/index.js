const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

const movieRoutes = require('./routes/movies');
const genreRoutes = require('./routes/genres');
const watchlistRoutes = require('./routes/watchlist');
const historyRoutes = require('./routes/history');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const vidsrcRoutes = require('./routes/vidsrc');
const autoSyncRoutes = require('./routes/autoSync');
const adminRoutes = require('./routes/admin');
const streamingRoutes = require('./routes/streaming');
const syncManagementRoutes = require('./routes/syncManagement');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001", // Next.js app - development
      "https://darling-druid-4e85af.netlify.app",
      "https://visionary-lebkuchen-a7e181.netlify.app",
      "https://pagerender.netlify.app", // Next.js app production
      /^https:\/\/.*\.netlify\.app$/ // Allow all Netlify subdomains
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for keep-alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/tvshows', require('./routes/tvshows'));
app.use('/api/genres', genreRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/vidsrc', vidsrcRoutes);
app.use('/api/auto-sync', autoSyncRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/streaming', streamingRoutes);
app.use('/api/admin/sync', syncManagementRoutes);
app.use('/api/search', require('./routes/search'));

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auto-reload function to prevent server sleep
const autoReload = () => {
  const https = require('https');
  
  https.get("https://movie-7zq4.onrender.com", (res) => {
    // Auto-reload request sent
  }).on("error", (err) => {
    // Auto-reload failed
  }).on("timeout", () => {
    // Auto-reload request timed out
  }).setTimeout(10000);
};

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start auto-reload pings (enabled for testing)
  console.log('🚀 Starting auto-reload pings every 30 seconds...');
  setInterval(autoReload, 14 * 60 * 1000); // 14 minutes
});
