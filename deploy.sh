#!/bin/bash

# School Timetable Management System - Quick Deployment Script
# This script helps prepare and deploy your application

echo "🚀 School Timetable Management System - Deployment Script"
echo "=================================================="

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

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate NextAuth secret
echo "🔐 Generating NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "Generated secret: $NEXTAUTH_SECRET"

# Build the application
echo "🏗️ Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️ .env.production not found. Creating from .env.example..."
    cp .env.example .env.production
    echo "📝 Please edit .env.production with your production values:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - NEXTAUTH_SECRET (already generated above)"
    echo "   - NEXTAUTH_URL (your production domain)"
    echo "   - NEXT_PUBLIC_APP_URL (your production domain)"
    echo ""
    echo "Press Enter when you've updated .env.production..."
    read
fi

echo "🎯 Deployment options:"
echo "1. Vercel (Recommended) - Run: vercel --prod"
echo "2. Netlify - Upload to Netlify with build command: npm run build"
echo "3. Traditional Server - Run: npm start"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"

# Check if vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo ""
    echo "🌟 Vercel CLI detected! You can deploy now with:"
    echo "   vercel --prod"
else
    echo ""
    echo "💡 Install Vercel CLI for easy deployment:"
    echo "   npm i -g vercel"
    echo "   vercel --prod"
fi

echo ""
echo "✅ Deployment preparation complete!"
echo "📚 Check DEPLOYMENT_GUIDE.md for detailed instructions"