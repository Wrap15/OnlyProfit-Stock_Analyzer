const http = require('http');

setTimeout(() => {
  console.log('Querying local server on port 3002...');
  http.get('http://localhost:3002/api/stock/quote?symbols=GOLDIAM.NS,VEDL.NS', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (err) {
        console.log('Raw response:', data);
      }
    });
  }).on('error', err => {
    console.error('Fetch error:', err.message);
  });
}, 3000); // Wait 3 seconds for server boot
