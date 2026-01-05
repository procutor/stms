(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Test School Debug',
        schoolType: 'PRIMARY',
        province: 'Kigali',
        district: 'Gasabo',
        sector: 'Remera',
        email: 'testdebug@school.com',
        phone: '123456789',
        adminName: 'Test Admin',
        password: 'password123'
      })
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response text:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Success:', data);
    } else {
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
})();