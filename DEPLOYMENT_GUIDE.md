# 🚀 School Timetable Management System - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A GitHub account (for code repository)
- A hosting platform account (Vercel recommended)

## 🗄️ Database Setup

### Current Setup: SQLite (Development)
Your project currently uses SQLite for development (`prisma/dev.db`).

### Production Setup: PostgreSQL (Recommended)
For production deployment, you need PostgreSQL:

#### Option 1: Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database

#### Option 2: Railway
1. Create account at [railway.app](https://railway.app)
2. Create a new project with PostgreSQL
3. Copy the connection string

#### Option 3: PlanetScale
1. Create account at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Copy the connection string

## 🔧 Environment Variables Setup

### 1. Create Production Environment File
Create `.env.production`:

```env
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### 2. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository
```bash
# Initialize git (if not done already)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/school-timetable.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

#### Step 3: Environment Variables
In Vercel dashboard:
1. Go to your project > Settings > Environment Variables
2. Add all variables from `.env.production`:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_APP_URL`

#### Step 4: Database Migration
1. Install Vercel CLI: `npm i -g vercel`
2. Run migrations:
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

#### Step 5: Deploy
```bash
vercel --prod
```

### Option 2: Netlify

#### Step 1: Build Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Step 2: Deploy
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Option 3: Traditional VPS/Server

#### Step 1: Server Setup
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

#### Step 2: Application Setup
```bash
# Clone repository
git clone https://github.com/yourusername/school-timetable.git
cd school-timetable

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "school-timetable" -- start
pm2 save
pm2 startup
```

#### Step 3: Nginx Configuration
Create `/etc/nginx/sites-available/school-timetable`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/school-timetable /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Database Migration

### Migrate from SQLite to PostgreSQL

#### Step 1: Backup Current Data
```bash
# Export current data
npx prisma db push --force-reset
```

#### Step 2: Update Prisma Schema
Ensure `prisma/schema.prisma` uses PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 3: Run Migrations
```bash
npx prisma migrate deploy
```

#### Step 4: Seed Database (if needed)
```bash
npx prisma db seed
```

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable logging and monitoring

## 📱 Post-Deployment

### 1. Test the Application
- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Teacher creation with auto-password works
- [ ] Timetable generation functions
- [ ] All API endpoints respond correctly

### 2. Create Production Admin
```bash
# Create super admin user
curl -X POST https://your-domain.vercel.app/api/create-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Administrator",
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Monitor Performance
- Set up error tracking (Sentry)
- Monitor database performance
- Set up backups

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all environment variables are set
   - Clear `.next` folder and rebuild

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure IP whitelist includes hosting provider

3. **Authentication Problems**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Clear browser cookies and try again

## 📞 Support

If you encounter issues:
1. Check the application logs
2. Verify environment variables
3. Test database connectivity
4. Review deployment platform documentation

---

**🎉 Congratulations!** Your School Timetable Management System is now live and ready for use!