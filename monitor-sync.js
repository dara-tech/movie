const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Movie = require('./server/models/Movie');

class SyncMonitor {
  constructor() {
    this.startTime = Date.now();
    this.lastCount = 0;
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviestream');
      console.log('✅ Connected to MongoDB for monitoring');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async getStats() {
    try {
      const totalMovies = await Movie.countDocuments();
      const recentMovies = await Movie.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
      });
      
      const currentTime = Date.now();
      const elapsed = Math.round((currentTime - this.startTime) / 1000);
      const rate = this.lastCount > 0 ? (totalMovies - this.lastCount) / 60 : 0; // Movies per minute
      
      return {
        totalMovies,
        recentMovies,
        elapsed,
        rate
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return null;
    }
  }

  async monitor() {
    await this.connectDB();
    
    console.log('📊 Starting sync monitoring...');
    console.log('Press Ctrl+C to stop monitoring\n');
    
    const interval = setInterval(async () => {
      const stats = await this.getStats();
      if (stats) {
        const { totalMovies, recentMovies, elapsed, rate } = stats;
        
        console.log(`📈 Sync Progress - ${new Date().toLocaleTimeString()}`);
        console.log(`   Total Movies: ${totalMovies.toLocaleString()}`);
        console.log(`   Recent (1min): ${recentMovies}`);
        console.log(`   Rate: ${rate.toFixed(1)} movies/min`);
        console.log(`   Elapsed: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
        
        if (totalMovies >= 100000) {
          console.log('🎯 TARGET REACHED! 100,000+ movies!');
          clearInterval(interval);
          process.exit(0);
        }
        
        console.log('---');
        this.lastCount = totalMovies;
      }
    }, 60000); // Check every minute
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping monitor...');
      clearInterval(interval);
      mongoose.disconnect();
      process.exit(0);
    });
  }
}

// Run the monitor
const monitor = new SyncMonitor();
monitor.monitor().catch(console.error);
