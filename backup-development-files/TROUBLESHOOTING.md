# Troubleshooting Guide

## Network/Proxy Issues

If you encounter network connectivity errors like:
```
npm error network aborted
npm error code ECONNRESET
```

### Solutions:

### 1. Clear NPM Cache
```bash
npm cache clean --force
```

### 2. Use Different Registry
```bash
# Try using a different npm re'gistry
npm config set registry https://registry.npmjs.org/'

# Or try Yarn instead
npm install -g yarn
yarn install
```

### 3. Configure Proxy (if behind corporate firewall)
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### 4. Use Different Installation Method
```bash
# Try with --legacy-peer-deps
npm install --legacy-peer-deps

# Or try with --force
npm install --force
```

### 5. Manual Installation
If npm continues to fail, you can try:
- Using Yarn: `npm install -g yarn && yarn install`
- Using pnpm: `npm install -g pnpm && pnpm install`

## Database Connection Issues

### PostgreSQL Not Running
```bash
# Windows
net start postgresql

# Or start PostgreSQL service from Services panel
```

### Wrong Database Credentials
- Check your `.env.local` file
- Verify DATABASE_URL format: `postgresql://username:password@localhost:5432/database_name`

## Common Next.js Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## File Permissions (Linux/Mac)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /path/to/project
```

## System Requirements
- Node.js 18+ 
- PostgreSQL 12+
- 4GB+ RAM recommended
- Windows 10+, macOS 10.14+, or Linux

## Getting Help
1. Check the main README.md for detailed setup instructions
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Try the seed command: `npm run db:seed`

The codebase itself is complete and production-ready - these are just environment/setup issues.