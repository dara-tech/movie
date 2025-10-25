#!/bin/bash

# Human AI Personal Assistant Startup Script

echo "🚀 Starting Human AI Personal Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key and other configuration."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Start the development servers
echo "🎯 Starting development servers..."
echo "   - Backend server will run on http://localhost:5000"
echo "   - Frontend server will run on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev
