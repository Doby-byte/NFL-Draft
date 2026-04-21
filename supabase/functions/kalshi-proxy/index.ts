import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const KALSHI_API_KEY = Deno.env.get('KALSHI_API_KEY') ?? '';
const KALSHI_BASE    = 'https://api.elections.kalshi.com/trade-api/v2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const url  = new URL(req.url);
  const path = url.searchParams.get('path') ?? '';

  if (!path) {
    return new Response(JSON.stringify({ error: 'path param required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(`${KALSHI_BASE}${path}`, {
      headers: {
        'Authorization': `Token ${KALSHI_API_KEY}`,
        'Content-Type':  'application/json',
      },
    });

    const body = await upstream.text();

    // Parse and normalize Kalshi market response into our KalshiOdds shape
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { parsed = body; }

    // If it's a markets list, transform to our flat format
    if (
      typeof parsed === 'object' && parsed !== null &&
      'markets' in parsed && Array.isArray((parsed as Record<string, unknown>).markets)
    ) {
      const markets = (parsed as { markets: Record<string, unknown>[] }).markets;
      const normalized = markets
        .filter(m => typeof m.yes_bid === 'number' && (m.yes_bid as number) > 1)
        .map(m => ({
          player_name: String(m.subtitle ?? m.title ?? ''),
          yes_price:   (m.yes_bid as number) / 100,
          no_price:    (m.no_bid  as number) / 100,
          ticker:      String(m.ticker ?? ''),
          payout_per_dollar: m.yes_ask ? 1 / ((m.yes_ask as number) / 100) : 0,
        }));
      return new Response(JSON.stringify(normalized), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(body, {
      status:  upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
