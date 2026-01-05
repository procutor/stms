(async () => {
  const response = await fetch('http://localhost:3000/api/schools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolName: 'Test School 3',
      schoolType: 'PRIMARY',
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Remera',
      email: 'test3@school.com',
      phone: '123456789',
      adminName: 'Test Admin',
      password: 'password123'
    })
  });
  const data = await response.json();
  console.log('Response:', data);
  console.log('Status:', response.status);
})();