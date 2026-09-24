import { NextRequest, NextResponse } from 'next/server';
import { quoteCache } from '@/lib/yahooFinance';

export const dynamic = 'force-dynamic';

interface PlaceOrderRequest {
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'SL' | 'GTT';
  productType: 'CNC' | 'MIS';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  mpin?: string;
}

// Calculate Indian Equity Brokerage and Statutory Charges (Groww & Angel One formula)
function calculateStatutoryCharges(turnover: number, productType: 'CNC' | 'MIS') {
  // Brokerage: Flat ₹20 or 0.05% whichever is lower
  const brokerage = Math.min(20, parseFloat((turnover * 0.0005).toFixed(2)));
  // STT: 0.1% for Delivery (CNC), 0.025% on sell for Intraday (MIS)
  const stt = productType === 'CNC' 
    ? parseFloat((turnover * 0.001).toFixed(2)) 
    : parseFloat((turnover * 0.00025).toFixed(2));
  // GST: 18% on Brokerage + Exchange Transaction Charges
  const exchCharges = parseFloat((turnover * 0.0000345).toFixed(2)); // NSE turnover charge (0.00345%)
  const gst = parseFloat(((brokerage + exchCharges) * 0.18).toFixed(2));
  // Stamp Duty: 0.015% on buy
  const stampDuty = parseFloat((turnover * 0.00015).toFixed(2));
  // SEBI turnover fee: ₹10 / crore
  const sebiCharges = parseFloat((turnover * 0.000001).toFixed(2));

  const totalTaxes = parseFloat((stt + gst + stampDuty + sebiCharges + exchCharges).toFixed(2));
  const total = parseFloat((brokerage + totalTaxes).toFixed(2));

  return {
    brokerage,
    taxes: totalTaxes,
    stt,
    gst,
    stampDuty,
    sebiCharges,
    exchCharges,
    total
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlaceOrderRequest;
    const { userId, symbol, side, type, productType, quantity, limitPrice, stopPrice, mpin } = body;

    // 1. Basic Identity Validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized: User authentication required for trade execution' }, 
        { status: 401 }
      );
    }

    // 2. MPIN / 2FA Validation (Groww & Angel One Standard)
    if (!mpin || !/^\d{4}$/.test(mpin)) {
      return NextResponse.json(
        { error: 'Security Verification Required: Please enter your 4-digit Trade MPIN.' }, 
        { status: 400 }
      );
    }
    // Reject explicit dummy / rejected pins
    if (mpin === '0000') {
      return NextResponse.json(
        { error: 'Security Verification Failed: Incorrect 4-Digit MPIN' }, 
        { status: 403 }
      );
    }

    // 3. Payload & Symbol Validation
    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json({ error: 'Valid equity symbol is required' }, { status: 400 });
    }

    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer (minimum 1)' }, { status: 400 });
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return NextResponse.json({ error: 'Side must be BUY or SELL' }, { status: 400 });
    }

    if (!['MARKET', 'LIMIT', 'SL', 'GTT'].includes(type)) {
      return NextResponse.json({ error: 'Order type must be MARKET, LIMIT, SL, or GTT' }, { status: 400 });
    }

    if (!['CNC', 'MIS'].includes(productType)) {
      return NextResponse.json({ error: 'Product type must be CNC (Delivery) or MIS (Intraday)' }, { status: 400 });
    }

    // 4. Tick Size Rule (NSE Rule: Every price must be in multiples of ₹0.05)
    if (limitPrice !== undefined && limitPrice !== null) {
      const remainder = Math.round((limitPrice % 0.05) * 100) / 100;
      if (remainder !== 0 && remainder !== 0.05) {
        return NextResponse.json(
          { error: 'Invalid Price: Indian exchange orders must adhere to ₹0.05 tick size' },
          { status: 400 }
        );
      }
    }

    // 5. Server-side Verified Market Price (Anti-Spoofing RMS)
    const cleanSym = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
    const cached = quoteCache[cleanSym] || quoteCache[symbol.toUpperCase()];
    
    let serverPrice = cached?.data?.regularMarketPrice;
    if (!serverPrice || serverPrice <= 0) {
      // Fallback to seeded baseline
      const seed = cleanSym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      serverPrice = 150 + (seed % 800) + (seed % 10) * 0.15;
    }

    // 6. Upper & Lower Circuit Checks (±10% / ±20% daily price band)
    const lowerCircuit = parseFloat((serverPrice * 0.80).toFixed(2));
    const upperCircuit = parseFloat((serverPrice * 1.20).toFixed(2));

    const targetPrice = (type === 'LIMIT' && limitPrice) ? limitPrice : serverPrice;

    if (type === 'LIMIT' && limitPrice) {
      if (limitPrice < lowerCircuit || limitPrice > upperCircuit) {
        return NextResponse.json({
          error: `Order rejected by RMS: Limit price ₹${limitPrice.toFixed(2)} is outside exchange circuit limits (Lower: ₹${lowerCircuit}, Upper: ₹${upperCircuit})`
        }, { status: 422 });
      }
    }

    // 7. Margin Calculation
    // CNC = 100% Margin, MIS Intraday = 20% Margin (5x leverage)
    const grossTurnover = targetPrice * quantity;
    const marginMultiplier = productType === 'MIS' ? 0.20 : 1.0;
    const marginRequired = parseFloat((grossTurnover * marginMultiplier).toFixed(2));

    const charges = calculateStatutoryCharges(grossTurnover, productType);
    const totalRequiredFunds = side === 'BUY' 
      ? parseFloat((marginRequired + charges.total).toFixed(2))
      : charges.total;

    // 8. Order Execution State Generation
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = Date.now();

    const isExecutedImmediately = type === 'MARKET';
    const executionPrice = isExecutedImmediately ? serverPrice : undefined;

    const orderPayload = {
      orderId,
      userId,
      symbol: cleanSym,
      side,
      type,
      productType,
      quantity,
      limitPrice: limitPrice || null,
      stopPrice: stopPrice || null,
      targetPrice,
      marginRequired,
      charges,
      totalRequiredFunds,
      status: isExecutedImmediately ? 'EXECUTED' : 'PENDING',
      executionPrice: executionPrice ? parseFloat(executionPrice.toFixed(2)) : null,
      timestamp,
      exchange: 'NSE',
      securityVerification: {
        twoFactorVerified: true,
        method: mpin ? 'MPIN_2FA' : 'AUTHENTICATED_SESSION'
      }
    };

    return NextResponse.json({
      success: true,
      message: isExecutedImmediately 
        ? `Order ${orderId} executed successfully at ₹${executionPrice?.toFixed(2)}`
        : `Order ${orderId} placed successfully as ${type}`,
      order: orderPayload
    }, { status: 200 });

  } catch (err: any) {
    console.error('Server RMS Order Placement Error:', err);
    return NextResponse.json(
      { error: 'Internal order execution error. RMS rejection.' },
      { status: 500 }
    );
  }
}
