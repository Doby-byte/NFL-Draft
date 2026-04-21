-- Players: seeded pre-draft, updated as picks are made
create table if not exists players (
  id              serial primary key,
  name            text not null unique,
  position        text not null,
  school          text,
  buzz_grade      float default 50,
  consensus_rank  int   default 999,
  taken           boolean default false,
  taken_at_pick   int,
  taken_by_team   text,
  created_at      timestamptz default now()
);

-- Draft picks: one row per pick slot
create table if not exists draft_picks (
  id                    serial primary key,
  pick_number           int not null unique,
  round                 int not null,
  team                  text not null,

  bot_guess             text not null,
  bot_guess_confidence  text not null,
  ai_rationale          text,
  compass_score         float,
  edge_vs_market        float,
  bet_call              text not null,

  auto_bet_placed       boolean default false,
  auto_bet_amount       float   default 0,
  auto_bet_side         text,
  suggested_bet_amount  float   default 0,
  missed_window         boolean default false,

  odds_at_phase1        float,
  odds_at_phase2        float,
  odds_drift            float,

  player_picked         text,
  bot_guess_correct     boolean,
  auto_bet_outcome      text,
  auto_bet_payout       float,
  auto_bet_profit       float,

  suggested_bet_outcome text,
  suggested_bet_payout  float,
  suggested_bet_profit  float,

  signal_snapshot       jsonb,
  all_player_scores     jsonb,

  created_at            timestamptz default now(),
  resolved_at           timestamptz
);

create index if not exists draft_picks_pick_number_idx    on draft_picks (pick_number);
create index if not exists draft_picks_bot_correct_idx    on draft_picks (bot_guess_correct);
create index if not exists draft_picks_auto_outcome_idx   on draft_picks (auto_bet_outcome);
