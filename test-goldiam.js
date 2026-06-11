const https = require('https');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  }
};

function testGoldiam() {
  const url = 'https://api.tickertape.in/stocks/quotes?sids=GOLDIAM';
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      try {
        console.log(JSON.parse(data));
      } catch (err) {
        console.log(data);
      }
    });
  }).on('error', err => {
    console.error(err.message);
  });
}

testGoldiam();
