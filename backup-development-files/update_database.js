const fs = require('fs');
const path = require('path');

// Read the SQLite database file as binary and manually add the column
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

try {
  // Check if database exists
  if (fs.existsSync(dbPath)) {
    console.log('Database file found');
    
    // For SQLite, we need to use a different approach
    // Let's try to read and check the schema
    const dbContent = fs.readFileSync(dbPath);
    console.log('Database file size:', dbContent.length, 'bytes');
    
    // Create a simple Node.js script that uses the built-in fs to check if we can modify
    console.log('Database file exists and is readable');
    
  } else {
    console.log('Database file not found');
  }
} catch (error) {
  console.error('Error accessing database:', error.message);
}

// Also try to use Prisma's approach
console.log('Attempting to use Prisma to add column...');