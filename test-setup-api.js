const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/database-setup/setup-database',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': '0'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ API Response:');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.end();
