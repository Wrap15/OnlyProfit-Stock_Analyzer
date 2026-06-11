import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTickertapeSid } from '@/lib/yahooFinance';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    let cleanSym = symbol.toUpperCase().trim();
    if (!cleanSym.startsWith('^') && !cleanSym.endsWith('.NS') && !cleanSym.endsWith('.BO') && !/^\d+$/.test(cleanSym)) {
      cleanSym = `${cleanSym}.NS`;
    }
    const sid = getTickertapeSid(cleanSym);

    const annualIncomeUrl = `https://api.tickertape.in/stocks/financials/income/${sid}/annual/normal`;
    const quarterlyIncomeUrl = `https://api.tickertape.in/stocks/financials/income/${sid}/interim/normal`;
    const annualCashflowUrl = `https://api.tickertape.in/stocks/financials/cashflow/${sid}/annual/normal`;

    const [annualIncomeRes, quarterlyIncomeRes, annualCashflowRes] = await Promise.allSettled([
      axios.get(annualIncomeUrl, { headers: HEADERS, timeout: 4000 }),
      axios.get(quarterlyIncomeUrl, { headers: HEADERS, timeout: 4000 }),
      axios.get(annualCashflowUrl, { headers: HEADERS, timeout: 4000 })
    ]);

    let annualIncomeData: any[] = [];
    let quarterlyIncomeData: any[] = [];
    let annualCashflowData: any[] = [];

    if (annualIncomeRes.status === 'fulfilled' && annualIncomeRes.value.data?.success) {
      annualIncomeData = annualIncomeRes.value.data.data || [];
    }
    if (quarterlyIncomeRes.status === 'fulfilled' && quarterlyIncomeRes.value.data?.success) {
      quarterlyIncomeData = quarterlyIncomeRes.value.data.data || [];
    }
    if (annualCashflowRes.status === 'fulfilled' && annualCashflowRes.value.data?.success) {
      annualCashflowData = annualCashflowRes.value.data.data || [];
    }

    if (annualIncomeData.length === 0 && quarterlyIncomeData.length === 0) {
      return NextResponse.json({ success: false, error: 'No financial statements found' }, { status: 404 });
    }

    // Map annual data
    const annual = annualIncomeData.map((inc: any) => {
      const displayPeriod = inc.displayPeriod || '';
      const year = displayPeriod.replace('FY ', '').trim();
      const cf = annualCashflowData.find((c: any) => c.displayPeriod === displayPeriod);

      const revenue = inc.incTrev ?? 0;
      const profit = inc.incNinc ?? 0;
      const ebitda = inc.incEbi ?? 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const cashflow = cf?.cafFcf ?? 0;

      return {
        year,
        revenue,
        profit,
        ebitda,
        margin,
        cashflow
      };
    });

    // Map quarterly data
    const quarterly = quarterlyIncomeData.map((q: any) => {
      const displayPeriod = q.displayPeriod || '';
      const revenue = q.qIncTrev ?? 0;
      const profit = q.qIncNinc ?? 0;
      const ebitda = q.qIncEbi ?? 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        year: displayPeriod,
        revenue,
        profit,
        ebitda,
        margin,
        cashflow: profit * 0.95 // estimate/seed quarterly cash flow
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        annual,
        quarterly
      }
    });

  } catch (error: any) {
    console.error(`Failed to fetch financials for ${symbol}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch financials' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
