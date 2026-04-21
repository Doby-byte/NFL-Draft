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

  const prompt = `You are a NFL Draft betting analyst. Here is the COMPASS analysis for pick #${payload.pick}:

${JSON.stringify(payload.top_player, null, 2)}

Team: ${payload.team}
Team needs (priority order): ${payload.team_needs.join(', ')}

${payload.instruction}

Respond with this exact JSON structure, no markdown:
{
  "sentiment_summary": "one sentence on any breaking news or insider signals",
  "rationale": "3 direct sentences explaining this recommendation",
  "sentiment_score": 0.0,
  "final_recommendation": "${payload.top_player.bet_call}",
  "confidence": "${payload.top_player.confidence}"
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
        model:      'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      error?: { message: string };
    };

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.content?.[0]?.text ?? '{}';

    // Strip any markdown fences
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
