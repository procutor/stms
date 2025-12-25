# Quick Setup Guide

## Prerequisites Installation

### 1. Install Node.js (18+)
Download from: https://nodejs.org/

### 2. Install PostgreSQL
Download from: https://www.postgresql.org/download/

### 3. Create Database
```sql
CREATE DATABASE school_timetable_db;
CREATE USER school_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE school_timetable_db TO school_admin;
```

## Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env.local` and update:
```env
DATABASE_URL="postgresql://school_admin:your_password@localhost:5432/school_timetable_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Application
Visit: http://localhost:3000

## Test Accounts (After Seeding)

### Super Admin
- **Email**: admin@system.com
- **Password**: admin123
- **Access**: Approve schools, monitor platform

### School Admins
- **Greenwood Primary**: admin@greenwoodprimary.edu / school123
- **Riverside Secondary**: admin@riversidesecondary.edu / school123  
- **TechSkills TSS**: admin@techskills.edu / school123

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## Production Deployment

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="secure-random-secret"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Build & Deploy
```bash
npm run build
npm run start
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env.local`
- Ensure database exists

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Prisma Issues
```bash
# Reset database
npm run db:push --force-reset
npm run db:seed
```

## Support
- Check `README.md` for detailed documentation
- Review API routes in `/src/app/api/`
- Examine database schema in `prisma/schema.prisma`