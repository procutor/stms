const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./prisma/dev.db');

db.all("SELECT id, email, name, role, schoolId, isActive FROM users", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('User details:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Email: ${row.email}`);
      console.log(`Name: ${row.name}`);
      console.log(`Role: ${row.role}`);
      console.log(`School ID: ${row.schoolId}`);
      console.log(`Active: ${row.isActive}`);
      console.log('---');
    });
  }
  db.close();
});