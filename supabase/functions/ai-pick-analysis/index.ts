import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface NeedEntry { position: string; rank: number; }

interface Payload {
  pick: number;
  team: string;
  team_needs_ranked: NeedEntry[];   // full ranked list from live app data
  team_no_need: string[];           // positions with zero org need
  top_player: {
    name: string;
    position: string;
    compass: number;
    edge_vs_market: number;
    bet_call: string;
    confidence: string;
    suggested_bet: number;
    s1_scout_grade: number;
    s2_board_rank: number;
    s3_mock_alignment: number;
    s4_position_premium: number;
    s5_team_need: number;
    s6_kalshi_now: number;
    s7_7day_avg: number;
    momentum: number;
  };
  instruction: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { top_player: p, pick, team, team_needs_ranked, team_no_need } = payload;

  const needsStr   = team_needs_ranked.map(n => `${n.position} (rank ${n.rank})`).join(', ') || 'none listed';
  const noNeedStr  = team_no_need.join(', ') || 'none';

  const systemPrompt = `You are a sharp NFL Draft analyst providing real-time pick analysis during the 2026 NFL Draft (April 24–26, 2026).

CRITICAL DATA RULES — violating these makes your analysis useless:
1. The team_needs_ranked and team_no_need data below comes from the live app and reflects the current April 2026 roster reality. It is AUTHORITATIVE. Never override it with your training knowledge about specific rosters.
2. If a position appears in team_no_need, the team has ZERO need there — do not suggest they might draft that position.
3. Use web search to find any breaking news or insider reports from the past 48 hours about this pick. Your training data ends months ago — search for what is actually happening right now.
4. Do not mention specific players' past teams or signings unless you verify them via search. Roster situations change constantly in the offseason.`;

  const userPrompt = `Pick #${pick} | Team: ${team}

CURRENT TEAM NEEDS (authoritative, April 2026):
- Priority needs: ${needsStr}
- NO need at: ${noNeedStr}

Prospect: ${p.name} (${p.position})
COMPASS: ${p.compass}/100 | Market edge: ${p.edge_vs_market > 0 ? '+' : ''}${Math.round(p.edge_vs_market * 100)}pts | Bet: ${p.bet_call} (${p.confidence})
Signals — Scout: ${Math.round(p.s1_scout_grade * 100)} | Board: ${Math.round(p.s2_board_rank * 100)} | Mock alignment: ${Math.round(p.s3_mock_alignment * 100)} | Position premium: ${Math.round(p.s4_position_premium * 100)} | Team need: ${Math.round(p.s5_team_need * 100)} | Market: ${Math.round(p.s6_kalshi_now * 100)} | Trend: ${Math.round(p.s7_7day_avg * 100)}
Momentum: ${p.momentum > 0 ? '+' : ''}${Math.round(p.momentum * 100)} pts

Task:
1. Search the web for breaking news, beat reporter tweets, and insider signals about pick #${pick}, ${team}, and ${p.name} in the last 48 hours.
2. Write pick_rationale: 2–3 sentences explaining why ${team} takes ${p.name} here. Ground it in their actual current needs (above), the player's best traits, and scheme fit. Be specific and confident. No hedging.
3. Write rationale: 1–2 tight sentences on the COMPASS score and bet call — which 1–2 signals are driving it.
4. Write sentiment_summary: one sentence on the freshest news or insider signal you found. If nothing notable, say so plainly.

Respond ONLY with this JSON, no markdown:
{
  "pick_rationale": "...",
  "rationale": "...",
  "sentiment_summary": "...",
  "sentiment_score": 0.0,
  "final_recommendation": "${p.bet_call}",
  "confidence": "${p.confidence}"
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
        max_tokens: 1500,
        system:     systemPrompt,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await res.json() as {
      content: Array<{ type: string; text?: string }>;
      error?: { message: string };
    };

    if (data.error) throw new Error(data.error.message);

    // Extract the last text block (after any tool_use / tool_result blocks)
    const textBlock = [...(data.content ?? [])].reverse().find(b => b.type === 'text');
    const text = textBlock?.text ?? '{}';

    // Strip markdown fences, then pull the first {...} JSON object out of the text
    // (Claude sometimes prepends prose when web_search is used)
    const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON found in response: ${stripped.slice(0, 200)}`);
    const parsed = JSON.parse(jsonMatch[0]);

    // Strip web-search citation tags that leak into text fields
    function stripCitations(s: unknown): unknown {
      if (typeof s === 'string') return s.replace(/<\/?a?n?cite[^>]*>/gi, '').replace(/\s{2,}/g, ' ').trim();
      if (typeof s === 'object' && s !== null) {
        return Object.fromEntries(Object.entries(s as Record<string, unknown>).map(([k, v]) => [k, stripCitations(v)]));
      }
      return s;
    }
    const clean = stripCitations(parsed);

    return new Response(JSON.stringify(clean), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
