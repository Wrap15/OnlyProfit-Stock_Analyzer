/**
 * F&O Options chain date generator, premium calculator, and symbol parser.
 */

export interface OptionPriceDetails {
  strike: number;
  callPremium: number;
  callChange: number;
  callChangePercent: number;
  putPremium: number;
  putChange: number;
  putChangePercent: number;
}

export interface ParsedOptionSymbol {
  underlying: string;
  expiry: string;
  strike: number;
  type: 'CE' | 'PE';
}

/**
 * Returns the next 4 Thursdays (weekly expiries for NSE index and stock options).
 */
export function getNextThursdays(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const now = new Date();
  
  // Set current to start from today
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  while (dates.length < 4) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() === 4) { // Thursday is 4
      const day = String(current.getDate()).padStart(2, '0');
      const monthShort = current.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const yearTwoDigit = String(current.getFullYear()).substring(2);
      const value = `${day}${monthShort}${yearTwoDigit}`;
      
      const label = `${day}-${current.toLocaleString('en-US', { month: 'short' })}-${current.getFullYear()}`;
      
      dates.push({ value, label });
    }
  }
  return dates;
}

/**
 * Parses expiry string (e.g. "23JUL26") into a JS Date object set to Thursday market close (15:30 IST)
 */
export function parseExpiryDate(expiryStr: string): Date {
  const match = expiryStr.match(/^(\d{2})([A-Z]{3})(\d{2})$/);
  if (!match) return new Date();
  
  const day = parseInt(match[1], 10);
  const monthStr = match[2];
  const year = 2000 + parseInt(match[3], 10);
  
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIdx = months.indexOf(monthStr);
  
  return new Date(year, monthIdx >= 0 ? monthIdx : 0, day, 15, 30, 0);
}

/**
 * Computes option premium price, absolute change, and percentage change.
 * Intrinsic value + Bell-curve extrinsic time value decaying over time and distance-from-spot.
 */
export function calculateOptionPrice(
  spotPrice: number,
  strike: number,
  expiryStr: string,
  type: 'CE' | 'PE',
  volatility: number = 0.25
): { price: number; change: number; pct: number } {
  // 1. Days to expiry
  const expiryDate = parseExpiryDate(expiryStr);
  const now = new Date();
  const diffTime = Math.max(0, expiryDate.getTime() - now.getTime());
  const diffDays = Math.max(0.1, diffTime / (1000 * 60 * 60 * 24)); // Minimum 0.1 day for calculations
  
  // 2. Intrinsic Value
  const callIntrinsic = Math.max(0, spotPrice - strike);
  const putIntrinsic = Math.max(0, strike - spotPrice);
  
  // 3. Extrinsic/Time Value using a realistic bell curve normalized over T/30
  const distancePct = Math.abs(spotPrice - strike) / spotPrice;
  const timeFactor = Math.sqrt(diffDays / 30);
  const baseTimeValue = spotPrice * 0.015 * timeFactor; // At-the-money premium is roughly 1.5% of spot per month
  const decayFactor = Math.exp(-Math.pow(distancePct / (volatility * 0.15), 2));
  const timeValue = baseTimeValue * decayFactor;
  
  // 4. Final Premium Calculation
  let price = type === 'CE' ? callIntrinsic + timeValue : putIntrinsic + timeValue;
  price = parseFloat(Math.max(0.05, price).toFixed(2)); // minimum price tick ₹0.05
  
  // 5. Compute change based on delta approximation
  // At-the-money options have delta ~0.5. In-the-money goes to 1.0, Out-of-the-money goes to 0.
  const dFactor = distancePct / 0.1; // normalized to 10%
  let delta = 0.5;
  if (type === 'CE') {
    delta = spotPrice >= strike 
      ? Math.min(0.95, 0.5 + 0.45 * Math.min(1, dFactor))
      : Math.max(0.05, 0.5 - 0.45 * Math.min(1, dFactor));
  } else {
    delta = spotPrice <= strike
      ? Math.min(0.95, 0.5 + 0.45 * Math.min(1, dFactor))
      : Math.max(0.05, 0.5 - 0.45 * Math.min(1, dFactor));
    delta = -delta; // Put option has negative delta
  }
  
  // Daily stock price movement approximation is ~1.2%
  const spotChange = spotPrice * 0.012 * (delta >= 0 ? 1 : -1);
  const optionChange = spotChange * delta;
  const priceBefore = Math.max(0.05, price - optionChange);
  const pct = (optionChange / priceBefore) * 100;
  
  return {
    price,
    change: parseFloat(optionChange.toFixed(2)),
    pct: parseFloat(pct.toFixed(2))
  };
}

/**
 * Parses option contract symbol string to extract params.
 */
export function parseOptionSymbol(symbol: string): ParsedOptionSymbol | null {
  // Format: TRENT-23JUL26-5500-CE or RELIANCE-23JUL26-2400-PE
  const match = symbol.match(/^([A-Z\.\^]+)-(\d{2}[A-Z]{3}\d{2})-(\d+)-(CE|PE)$/);
  if (!match) return null;
  
  return {
    underlying: match[1],
    expiry: match[2],
    strike: parseInt(match[3], 10),
    type: match[4] as 'CE' | 'PE'
  };
}
