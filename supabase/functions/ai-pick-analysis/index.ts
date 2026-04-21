import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface NeedEntry { position: string; rank: number; }

interface TopPlayerEntry {
  name: string;
  position: string;
  school?: string;
  kalshi_pct: number;
  compass: number;
}

interface Payload {
  pick: number;
  team: string;
  team_needs_ranked: NeedEntry[];
  team_no_need: string[];
  top_player: {
    name: string; position: string; compass: number;
    edge_vs_market: number; bet_call: string; confidence: string;
    suggested_bet: number; s1_scout_grade: number; s2_board_rank: number;
    s3_mock_alignment: number; s4_position_premium: number; s5_team_need: number;
    s6_kalshi_now: number; s7_7day_avg: number; momentum: number;
  };
  // Top 5 players for pre-loaded steelman analyses (saves Why? round-trips)
  top_players_for_steelman?: TopPlayerEntry[];
  instruction: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let payload: Payload;
  try { payload = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { top_player: p, pick, team, team_needs_ranked, team_no_need, top_players_for_steelman = [] } = payload;

  const needsStr  = team_needs_ranked.map(n => `${n.position} (rank ${n.rank})`).join(', ') || 'none listed';
  const noNeedStr = team_no_need.join(', ') || 'none';

  // Build steelman section — batched into same prompt to save round-trips
  const steelmanSection = top_players_for_steelman.length > 0
    ? `\n\nSTEELMAN PRE-LOAD — for each prospect below give 2 reasons FOR and 2 reasons AGAINST being selected here. Be specific and grounded in football logic:\n${
        top_players_for_steelman.map(pl =>
          `- ${pl.name} (${pl.position}, ${pl.school ?? '?'}) — COMPASS ${pl.compass}, Kalshi ${pl.kalshi_pct}¢`
        ).join('\n')
      }\n\nInclude in JSON under "steelmans" as:\n"steelmans": { "Player Name": {"for":["r1","r2"],"against":["r1","r2"]}, ... }`
    : '';

  const systemPrompt = `You are a sharp NFL Draft analyst providing real-time pick analysis during the 2026 NFL Draft (April 24–26, 2026).

CRITICAL DATA RULES:
1. team_needs_ranked and team_no_need are AUTHORITATIVE April 2026 data. Never override with training knowledge.
2. If a position is in team_no_need, the team has ZERO need there.
3. Use web search for breaking news and insider reports from the past 48 hours.
4. Do not mention players' past teams unless verified via search.`;

  const userPrompt = `Pick #${pick} | Team: ${team}

CURRENT TEAM NEEDS (authoritative, April 2026):
- Priority: ${needsStr}
- NO need at: ${noNeedStr}

Top Prospect: ${p.name} (${p.position})
COMPASS: ${p.compass}/100 | Edge: ${p.edge_vs_market > 0 ? '+' : ''}${Math.round(p.edge_vs_market * 100)}pts | Bet: ${p.bet_call} (${p.confidence})
Signals — Scout: ${Math.round(p.s1_scout_grade * 100)} | Board: ${Math.round(p.s2_board_rank * 100)} | Mock: ${Math.round(p.s3_mock_alignment * 100)} | Pos premium: ${Math.round(p.s4_position_premium * 100)} | Need: ${Math.round(p.s5_team_need * 100)} | Market: ${Math.round(p.s6_kalshi_now * 100)} | Trend: ${Math.round(p.s7_7day_avg * 100)} | Momentum: ${p.momentum > 0 ? '+' : ''}${Math.round(p.momentum * 100)}pts
${steelmanSection}

Tasks:
1. Web search: breaking news about pick #${pick}, ${team}, and ${p.name} in last 48h.
2. pick_rationale: 2–3 sentences — why ${team} takes ${p.name}. Ground in current needs, player traits, scheme fit. Specific, confident.
3. rationale: 1–2 tight sentences on COMPASS score and bet call.
4. sentiment_summary: one sentence on freshest insider signal or news.
${top_players_for_steelman.length > 0 ? '5. steelmans: for each player listed above, 2 FOR and 2 AGAINST reasons.' : ''}

Respond ONLY with this JSON, no markdown:
{
  "pick_rationale": "...",
  "rationale": "...",
  "sentiment_summary": "...",
  "sentiment_score": 0.0,
  "final_recommendation": "${p.bet_call}",
  "confidence": "${p.confidence}"${top_players_for_steelman.length > 0 ? `,\n  "steelmans": {}` : ''}
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':    'web-search-2025-03-05',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system:     systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await res.json() as {
      content: Array<{ type: string; text?: string }>;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);

    const textBlock = [...(data.content ?? [])].reverse().find(b => b.type === 'text');
    const text = textBlock?.text ?? '{}';

    const stripped  = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${stripped.slice(0, 200)}`);
    const parsed = JSON.parse(jsonMatch[0]);

    function stripCitations(s: unknown): unknown {
      if (typeof s === 'string') return s.replace(/<\/?a?n?cite[^>]*>/gi, '').replace(/\s{2,}/g, ' ').trim();
      if (Array.isArray(s)) return s.map(stripCitations);
      if (typeof s === 'object' && s !== null)
        return Object.fromEntries(Object.entries(s as Record<string, unknown>).map(([k, v]) => [k, stripCitations(v)]));
      return s;
    }

    return new Response(JSON.stringify(stripCitations(parsed)), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
