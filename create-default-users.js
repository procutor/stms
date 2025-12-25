const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./prisma/dev.db');

async function createUsers() {
  const users = [
    {
      email: 'damascenetugireyezu@gmail.com',
      name: 'Super Administrator',
      password: 'sEkamana@123',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'admin@greenwoodprimary.edu',
      name: 'Sarah Johnson',
      password: 'school123',
      role: 'SCHOOL_ADMIN'
    },
    {
      email: 'admin@riversidesecondary.edu',
      name: 'Michael Brown',
      password: 'school123',
      role: 'SCHOOL_ADMIN'
    },
    {
      email: 'admin@techskills.edu',
      name: 'David Wilson',
      password: 'school123',
      role: 'SCHOOL_ADMIN'
    }
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const sql = `INSERT OR REPLACE INTO users (id, email, name, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, userData.email, userData.name, hashedPassword, userData.role, 1, now, now], function(err) {
      if (err) {
        console.error('Error inserting user:', userData.email, err);
      } else {
        console.log('User created:', userData.email);
      }
    });
  }

  // Close database after all operations
  setTimeout(() => {
    db.close();
    console.log('Default users created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Super Admin: damascenetugireyezu@gmail.com / sEkamana@123');
    console.log('Greenwood Primary: admin@greenwoodprimary.edu / school123');
    console.log('Riverside Secondary: admin@riversidesecondary.edu / school123');
    console.log('TechSkills TSS: admin@techskills.edu / school123');
  }, 1000);
}

createUsers();