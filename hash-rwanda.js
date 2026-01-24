const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'Rwanda@123';
  const hash = await bcrypt.hash(password, 12);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

hashPassword();