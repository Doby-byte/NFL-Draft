/**
 * Creates user_profiles and user_picks tables for family mode.
 * Run: npx tsx scripts/setup_family_tables.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SQL = `
-- User profiles: 4 fixed slots (user_1..user_4)
create table if not exists user_profiles (
  id           text primary key,
  display_name text not null,
  created_at   timestamptz default now()
);

-- RLS
alter table user_profiles enable row level security;
drop policy if exists "public read user_profiles" on user_profiles;
drop policy if exists "public write user_profiles" on user_profiles;
create policy "public read user_profiles"  on user_profiles for select using (true);
create policy "public write user_profiles" on user_profiles for insert with check (true);
create policy "public update user_profiles" on user_profiles for update using (true);

-- Family picks: pretend bets, resolved when MarkPickModal fires
create table if not exists user_picks (
  id                    serial primary key,
  pick_number           int    not null,
  user_id               text   not null references user_profiles(id),
  player_chosen         text   not null,
  kalshi_odds_at_pick   float8,
  correct               boolean,
  hypothetical_payout   float8,
  hypothetical_profit   float8,
  created_at            timestamptz default now(),
  unique(pick_number, user_id)
);

alter table user_picks enable row level security;
drop policy if exists "public read user_picks" on user_picks;
drop policy if exists "public write user_picks" on user_picks;
drop policy if exists "public update user_picks" on user_picks;
create policy "public read user_picks"   on user_picks for select using (true);
create policy "public insert user_picks" on user_picks for insert with check (true);
create policy "public update user_picks" on user_picks for update using (true);

-- Index for leaderboard queries
create index if not exists user_picks_user_id_idx on user_picks(user_id);
create index if not exists user_picks_pick_number_idx on user_picks(pick_number);
`;

// Execute via pg REST endpoint workaround — use rpc if available, else raw
async function run() {
  // Use supabase-js to call each statement individually via raw query
  // (supabase-js doesn't expose raw SQL — use fetch against the db API)
  const url   = process.env.VITE_SUPABASE_URL!;
  const key   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log('DB reachable:', res.status);

  // Use the pg/management endpoint
  const sqlRes = await fetch(`${url.replace('.supabase.co', '.supabase.co')}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!sqlRes.ok) {
    // Fall back: use supabase-js upsert approach — tables might already exist
    console.log('Direct SQL not available via REST. Attempting via supabase RPC...');

    // Try creating tables via the Supabase SQL editor endpoint
    const sqlEditorRes = await fetch(`${url}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ sql: SQL }),
    });
    const body = await sqlEditorRes.text();
    console.log('RPC result:', sqlEditorRes.status, body.slice(0, 300));
    return;
  }

  const body = await sqlRes.text();
  console.log('✅ Tables created:', body.slice(0, 200));
}

run().catch(console.error);
