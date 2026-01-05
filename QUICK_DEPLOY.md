# 🚀 Quick Deployment Guide

## ⚡ Quick Start (5 Minutes)

### 1. Prepare Your Repository
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/yourusername/school-timetable.git
git push -u origin main
```

### 2. Get PostgreSQL Database
**Supabase (Recommended):**
1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Copy connection string from Settings > Database

### 3. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_APP_URL`: Same as NEXTAUTH_URL

### 4. Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📦 Alternative: Automated Script
```bash
# Run the deployment script
bash deploy.sh

# Or use npm scripts
npm run prepare:deploy
npm run deploy:vercel
```

## ✅ What's Included
- ✅ Next.js application ready for deployment
- ✅ Vercel configuration (vercel.json)
- ✅ Environment variables template (.env.example)
- ✅ Database migration scripts
- ✅ Production build optimization
- ✅ Auto teacher password generation ({lastname}@123)

## 🔧 Post-Deployment
1. Test the application at your Vercel URL
2. Create your first admin user
3. Add schools and start using the system!

## 📞 Need Help?
- Full guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Your app is ready to deploy right now! 🎉