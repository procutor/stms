const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new Database(dbPath);

async function updateTeacherPasswords() {
  try {
    console.log('Starting teacher password update...');

    // Pre-computed hash for 'Rwanda@123' with cost 12
    const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1BbIhQqKvzK6';
    const newPassword = 'Rwanda@123';

    console.log(`New password: ${newPassword}`);
    console.log(`New password hash: ${hashedPassword}`);

    // Update all teachers with the new password
    const updateStmt = db.prepare(`
      UPDATE users
      SET password = ?
      WHERE role = 'TEACHER'
    `);

    const result = updateStmt.run(hashedPassword);

    console.log(`Updated ${result.changes} teacher passwords`);

    // Verify the update
    const verifyStmt = db.prepare(`
      SELECT COUNT(*) as teacherCount
      FROM users
      WHERE role = 'TEACHER' AND password = ?
    `);

    const verifyResult = verifyStmt.get(hashedPassword);
    console.log(`Verified ${verifyResult.teacherCount} teachers have the new password`);

    console.log('Teacher password update completed successfully!');
    console.log(`New default password for teachers: ${newPassword}`);

  } catch (error) {
    console.error('Error updating teacher passwords:', error);
  } finally {
    db.close();
  }
}

updateTeacherPasswords();