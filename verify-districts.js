const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/homecells/districts',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Districts found:', result.data?.length || 0);
      result.data?.forEach(d => {
        console.log(`   📍 ${d.name}`);
      });
    } catch (e) {
      console.log('Error:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.end();
