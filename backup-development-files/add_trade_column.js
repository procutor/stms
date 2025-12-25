const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add trade column if it doesn't exist
  db.run('ALTER TABLE modules ADD COLUMN trade TEXT', function(err) {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Trade column already exists');
      } else {
        console.error('Error adding trade column:', err.message);
      }
    } else {
      console.log('Trade column added successfully');
    }
    
    db.close();
  });
});