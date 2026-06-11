const https = require('https');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com/'
  }
};

function testSpark() {
  const url = 'https://query1.finance.yahoo.com/v7/finance/spark?symbols=GOLDIAM.NS&range=1d&interval=5m';
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      try {
        const json = JSON.parse(data);
        const meta = json?.spark?.result?.[0]?.response?.[0]?.meta;
        console.log('Goldiam Price from Spark:', meta?.regularMarketPrice);
        console.log('Goldiam PrevClose from Spark:', meta?.previousClose || meta?.chartPreviousClose);
      } catch (err) {
        console.log(data);
      }
    });
  }).on('error', err => {
    console.error(err.message);
  });
}

testSpark();
