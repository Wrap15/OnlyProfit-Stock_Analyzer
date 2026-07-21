/**
 * Utility to check if the Indian Stock Market (NSE/BSE) is currently open.
 * Indian market hours are Monday to Friday, 9:15 AM to 3:30 PM IST.
 */
export function isIndianMarketOpen(): boolean {
  try {
    const now = new Date();
    
    // Convert current time to India timezone (IST is UTC+5:30)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    const formattedParts = formatter.formatToParts(now);
    const getVal = (type: string) => formattedParts.find(p => p.type === type)?.value || '';
    
    const weekday = getVal('weekday'); // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    const hourStr = getVal('hour');
    const minuteStr = getVal('minute');
    const secondStr = getVal('second');
    
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const second = parseInt(secondStr || '0', 10);
    
    // 1. Weekend check
    if (weekday === 'Sat' || weekday === 'Sun') {
      return false;
    }
    
    // 2. Time check: 9:15:00 AM to 3:30:00 PM IST (15:30:00 sharp)
    // 9:15:00 AM -> 9 * 3600 + 15 * 60 = 33300 seconds
    // 3:30:00 PM -> 15 * 3600 + 30 * 60 = 55800 seconds
    const totalSeconds = hour * 3600 + minute * 60 + second;
    const openSeconds = 9 * 3600 + 15 * 60;   // 9:15 AM (33300s)
    const closeSeconds = 15 * 3600 + 30 * 60; // 3:30 PM sharp (55800s)
    
    return totalSeconds >= openSeconds && totalSeconds < closeSeconds;
  } catch (error) {
    console.error('Error checking market hours:', error);
    const day = new Date().getDay();
    const isWeekday = day >= 1 && day <= 5;
    return isWeekday;
  }
}

/**
 * Returns a user-friendly status message about the market state (IST).
 */
export function getMarketStatusMessage(): { isOpen: boolean; text: string } {
  const isOpen = isIndianMarketOpen();
  if (isOpen) {
    return { isOpen: true, text: 'Market Open (Live updates active)' };
  }
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    weekday: 'short',
  });
  const weekday = formatter.formatToParts(now).find(p => p.type === 'weekday')?.value || '';
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  
  if (isWeekend) {
    return { isOpen: false, text: 'Market Closed (Opens Monday 9:15 AM IST)' };
  }
  return { isOpen: false, text: 'Market Closed (Opens at 9:15 AM IST)' };
}
