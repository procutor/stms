const fetch = require('node-fetch');

async function createTestSchool() {
  try {
    const response = await fetch('http://localhost:3000/api/schools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolName: 'Test School',
        schoolType: 'PRIMARY',
        address: 'Test Address',
        province: 'Test Province',
        district: 'Test District',
        sector: 'Test Sector',
        email: 'admin@testschool.com',
        phone: '1234567890',
        adminName: 'Test Admin',
        password: 'password123'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('School created successfully!');
      console.log('Login credentials:');
      console.log('Email: admin@testschool.com');
      console.log('Password: password123');
    } else {
      console.error('Failed to create school:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestSchool();