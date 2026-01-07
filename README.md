# School Timetable Management System

A Next.js application for managing school timetables, teacher assignments, and class schedules.

## Features

- Automatic timetable generation
- Teacher management and assignments
- Class management
- Time slot configuration
- Export to PDF and CSV

## Tech Stack

- Next.js 14
- TypeScript
- Prisma (SQLite for development, PostgreSQL for production)
- NextAuth.js for authentication
- Tailwind CSS

## Getting Started

```bash
# Install dependencies
yarn install

# Set up the database
npx prisma db push

# Run the development server
yarn dev
```

## Deployment

This project is configured for deployment on Vercel. Make sure to set up the following environment variables:

- `DATABASE_URL` - PostgreSQL connection string (for production)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Your production URL

## License

MIT
