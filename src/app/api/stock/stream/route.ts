import { NextRequest } from 'next/server';
import { quoteCache } from '@/lib/yahooFinance';
import { isIndianMarketOpen } from '@/lib/marketHours';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || '^NSEI,^BSESN,RELIANCE.NS,TCS.NS,HDFCBANK.NS';
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  const encoder = new TextEncoder();

  // Create a Server-Sent Events (SSE) readable stream
  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial snapshot immediately
      const initialQuotes = symbols.map(sym => {
        const cached = quoteCache[sym];
        if (cached?.data) {
          return {
            symbol: sym,
            price: cached.data.regularMarketPrice,
            change: cached.data.regularMarketChange,
            changePercent: cached.data.regularMarketChangePercent,
            volume: cached.data.regularMarketVolume || 0,
            timestamp: Date.now()
          };
        }
        // Fallback seeded price
        const seed = sym.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const price = 150 + (seed % 800) + (seed % 10) * 0.15;
        return {
          symbol: sym,
          price,
          change: 0,
          changePercent: 0,
          volume: 1000000,
          timestamp: Date.now()
        };
      });

      controller.enqueue(
        encoder.encode(`event: snapshot\ndata: ${JSON.stringify(initialQuotes)}\n\n`)
      );

      // Stream delta ticks every 1000ms
      const interval = setInterval(() => {
        try {
          const updates = symbols.map(sym => {
            const cached = quoteCache[sym];
            const basePrice = cached?.data?.regularMarketPrice || 1000;
            // Realistic delta fluctuation
            const deltaPct = (Math.random() - 0.495) * 0.0002;
            const updatedPrice = parseFloat((basePrice * (1 + deltaPct)).toFixed(2));
            return {
              symbol: sym,
              price: updatedPrice,
              timestamp: Date.now()
            };
          });

          controller.enqueue(
            encoder.encode(`event: tick\ndata: ${JSON.stringify(updates)}\n\n`)
          );
        } catch (e) {
          clearInterval(interval);
        }
      }, 1000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering for instant delivery (Nginx/Vercel)
    },
  });
}
