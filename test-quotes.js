async function test() {
  try {
    const symbols = [
      'RELIANCE.NS', 'ONGC.NS', 'LT.NS', 'RVNL.NS', 'TATASTEEL.NS', 'JSWSTEEL.NS',
      'SUNPHARMA.NS', 'CIPLA.NS', 'BHARTIARTL.NS', 'ZEEL.NS', 'NTPC.NS', 'TATAPOWER.NS'
    ];
    const res = await fetch('http://localhost:3001/api/stock/quote?symbols=' + symbols.join(','));
    const quotes = await res.json();
    for (const q of quotes) {
      console.log(`Symbol: ${q.symbol}, Raw Sector: ${q.sector}, Mapped: ${mapToStandardSector(q.sector)}`);
    }
  } catch (err) {
    console.error('Diagnostic failed:', err.message);
  }
}

// Duplicated local mapToStandardSector helper for validation
function mapToStandardSector(sector) {
  if (!sector) return 'Financials';
  const sec = sector.toLowerCase();
  if (sec.includes('bank') || sec.includes('financial') || sec.includes('insurance')) return 'Financials';
  if (sec.includes('tech') || sec.includes('software') || sec.includes('it services')) return 'Information Technology';
  if (sec.includes('consumer defensive') || sec.includes('fmcg') || sec.includes('staples') || sec.includes('goods') || sec.includes('food') || sec.includes('beverage')) return 'Consumer Staples';
  if (sec.includes('consumer cyclical') || sec.includes('automotive') || sec.includes('discretionary') || sec.includes('retail') || sec.includes('textiles') || sec.includes('apparel')) return 'Consumer Discretionary';
  if (sec.includes('oil') || sec.includes('gas') || sec.includes('energy') || sec.includes('petroleum')) return 'Energy';
  if (sec.includes('industrial') || sec.includes('engineering') || sec.includes('construction') || sec.includes('capital goods')) return 'Industrials';
  if (sec.includes('material') || sec.includes('steel') || sec.includes('metal') || sec.includes('paint') || sec.includes('cement') || sec.includes('chemical')) return 'Materials';
  if (sec.includes('health') || sec.includes('pharma') || sec.includes('hospital') || sec.includes('medicine')) return 'Health Care';
  if (sec.includes('telecom') || sec.includes('communication')) return 'Communication Services';
  if (sec.includes('utility') || sec.includes('power') || sec.includes('water')) return 'Utilities';
  return 'Financials';
}

test();
