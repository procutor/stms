const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./prisma/dev.db');

db.all("SELECT email, name, role, isActive FROM users", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Users in database:', rows.length);
    rows.forEach(row => {
      console.log(`- ${row.email} (${row.role}) - Active: ${row.isActive}`);
    });
  }
  db.close();
});