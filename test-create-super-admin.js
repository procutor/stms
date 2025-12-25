const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/create-super-admin',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(chunk.toString());
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();