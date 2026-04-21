import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Payload {
  pick: number;
  team: string;
  team_needs: string[];
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

  const { top_player: p, pick, team, team_needs } = payload;

  const prompt = `You are Mel Kiper Jr., ESPN's premier NFL Draft analyst with decades of expertise. You have deep knowledge of every prospect's college tape, combine metrics, and every NFL team's roster needs, scheme, and draft tendencies.

Pick #${pick} | Team: ${team} | Top needs: ${team_needs.join(', ')}

Prospect: ${p.name} (${p.position})
COMPASS score: ${p.compass}/100 | Market edge: ${p.edge_vs_market > 0 ? '+' : ''}${Math.round(p.edge_vs_market * 100)}pts
Signals — Scout: ${Math.round(p.s1_scout_grade * 100)} | Board: ${Math.round(p.s2_board_rank * 100)} | Mock: ${Math.round(p.s3_mock_alignment * 100)} | Pos premium: ${Math.round(p.s4_position_premium * 100)} | Team need: ${Math.round(p.s5_team_need * 100)} | Market: ${Math.round(p.s6_kalshi_now * 100)} | Trend: ${Math.round(p.s7_7day_avg * 100)}
Momentum: ${p.momentum > 0 ? '+' : ''}${Math.round(p.momentum * 100)} pts | Bet call: ${p.bet_call} (${p.confidence})

${payload.instruction}

Respond with ONLY this JSON, no markdown:
{
  "pick_rationale": "2-3 sentences as Mel Kiper. Lead with the player's defining trait or best quality, then explain specifically why this team takes him here — scheme fit, roster hole, draft history, or coaching staff preference. Be confident and specific, not generic.",
  "rationale": "1-2 tight sentences on why the COMPASS score and bet call are what they are. Reference the 1-2 strongest signals driving it.",
  "sentiment_summary": "One sentence: any relevant breaking news, beat reporter signals, or insider buzz about this pick. If nothing notable, say so briefly.",
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
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      error?: { message: string };
    };

    if (data.error) throw new Error(data.error.message);

    const text    = data.content?.[0]?.text ?? '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
