const https = require('https');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com/'
  }
};

function testSpark() {
  const url = 'https://query1.finance.yahoo.com/v7/finance/spark?symbols=AAPL,^NSEI,GC=F&range=1d&interval=5m';
  console.log('Testing Spark API...');
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Spark Status:', res.statusCode);
      console.log('Spark Response:', data.slice(0, 500));
    });
  }).on('error', err => {
    console.error('Spark Error:', err.message);
  });
}

function testChart() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?range=1d&interval=1d';
  console.log('Testing Chart API...');
  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Chart Status:', res.statusCode);
      console.log('Chart Response:', data.slice(0, 500));
    });
  }).on('error', err => {
    console.error('Chart Error:', err.message);
  });
}

testSpark();
testChart();
