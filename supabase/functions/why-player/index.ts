import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS }); }

  const { pick, team, team_full, player, position, school, compass, scout, board_rank, kalshi_pct } = body as {
    pick: number; team: string; team_full: string; player: string; position: string;
    school: string; compass: number; scout: number; board_rank: number; kalshi_pct: number;
  };

  const prompt = `NFL Draft 2026 — Pick #${pick} | Team: ${team_full} (${team})

Prospect: ${player} — ${position} out of ${school}
COMPASS score: ${compass}/100 | Scout grade: ${Math.round(scout * 100)} | Board rank: #${board_rank} | Kalshi: ${kalshi_pct}¢

Steel-man both sides. Give the 2–3 strongest arguments FOR this player being selected here, and the 2–3 strongest arguments AGAINST. Be specific, direct, and grounded in football logic. No hedging.

Respond ONLY with this JSON, no markdown:
{
  "for":     ["reason 1", "reason 2", "reason 3"],
  "against": ["reason 1", "reason 2", "reason 3"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);

    const text    = data.content?.[0]?.text ?? '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match   = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
