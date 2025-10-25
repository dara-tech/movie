const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviestream');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin users
const createAdminUsers = async () => {
  try {
    console.log('Creating admin users...');

    // Check if admin users already exist
    const existingAdmin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (existingAdmin) {
      console.log('Admin users already exist. Skipping creation.');
      return;
    }

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = new User({
      username: 'superadmin',
      email: 'superadmin@moviestream.com',
      password: superAdminPassword,
      role: 'super_admin',
      isActive: true,
      preferences: {
        assistantName: 'Admin Assistant',
        theme: 'dark',
        language: 'en'
      },
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        bio: 'System Administrator'
      }
    });

    await superAdmin.save();
    console.log('✅ Super Admin created:');
    console.log('   Email: superadmin@moviestream.com');
    console.log('   Password: admin123');
    console.log('   Role: super_admin');

    // Create Regular Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@moviestream.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      preferences: {
        assistantName: 'Admin Assistant',
        theme: 'dark',
        language: 'en'
      },
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Content Administrator'
      }
    });

    await admin.save();
    console.log('✅ Admin created:');
    console.log('   Email: admin@moviestream.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    // Create Test Regular User
    const userPassword = await bcrypt.hash('user123', 10);
    const user = new User({
      username: 'testuser',
      email: 'user@moviestream.com',
      password: userPassword,
      role: 'user',
      isActive: true,
      preferences: {
        assistantName: 'Alex',
        theme: 'dark',
        language: 'en'
      },
      profile: {
        firstName: 'Test',
        lastName: 'User',
        bio: 'Regular user for testing'
      }
    });

    await user.save();
    console.log('✅ Test User created:');
    console.log('   Email: user@moviestream.com');
    console.log('   Password: user123');
    console.log('   Role: user');

    console.log('\n🎉 All users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ SUPER ADMIN (Full Access)                              │');
    console.log('│ Email: superadmin@moviestream.com                     │');
    console.log('│ Password: admin123                                     │');
    console.log('│ Access: /admin (all features)                         │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ ADMIN (Management Access)                             │');
    console.log('│ Email: admin@moviestream.com                          │');
    console.log('│ Password: admin123                                    │');
    console.log('│ Access: /admin (most features)                        │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ REGULAR USER (Standard Access)                        │');
    console.log('│ Email: user@moviestream.com                           │');
    console.log('│ Password: user123                                     │');
    console.log('│ Access: /dashboard, /movies, /watchlist, /history     │');
    console.log('└─────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('Error creating admin users:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createAdminUsers();
  process.exit(0);
};

// Run the script
main();
