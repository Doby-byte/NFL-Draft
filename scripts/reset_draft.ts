/**
 * Resets all draft data for a fresh start or re-test.
 * Clears: draft_picks, user_picks, player taken status.
 * Keeps:  user_profiles (names stay), players list (roster stays).
 *
 * Run: npx tsx scripts/reset_draft.ts
 * Add --users flag to also wipe user_profiles: npx tsx scripts/reset_draft.ts --users
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const wipeUsers = process.argv.includes('--users');

async function reset() {
  console.log('🔄 Resetting draft data...\n');

  // 1. Clear all user picks
  const { error: e1, count: c1 } = await supabase
    .from('user_picks').delete().neq('id', 0);
  if (e1) { console.error('user_picks:', e1.message); }
  else    { console.log(`✅ user_picks cleared`); }

  // 2. Clear all draft picks
  const { error: e2 } = await supabase
    .from('draft_picks').delete().neq('id', 0);
  if (e2) { console.error('draft_picks:', e2.message); }
  else    { console.log(`✅ draft_picks cleared`); }

  // 3. Reset all players to not taken
  const { error: e3 } = await supabase
    .from('players')
    .update({ taken: false, taken_at_pick: null, taken_by_team: null })
    .neq('id', 0);
  if (e3) { console.error('players reset:', e3.message); }
  else    { console.log(`✅ players reset (all available)`); }

  // 4. Optionally wipe user profiles
  if (wipeUsers) {
    const { error: e4 } = await supabase
      .from('user_profiles').delete().neq('id', '');
    if (e4) { console.error('user_profiles:', e4.message); }
    else    { console.log(`✅ user_profiles wiped`); }
  } else {
    console.log(`ℹ️  user_profiles kept (run with --users to also wipe names)`);
  }

  console.log('\n🏈 Draft reset complete. Refresh the app to start fresh.');
}

reset().catch(console.error);
