import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import type { UserProfile } from '@/types';

const SLOTS = ['user_1', 'user_2', 'user_3', 'user_4'] as const;

const SLOT_COLORS = [
  'border-blue-500/60   bg-blue-500/10   hover:bg-blue-500/20',
  'border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/20',
  'border-green-500/60  bg-green-500/10  hover:bg-green-500/20',
  'border-orange-500/60 bg-orange-500/10 hover:bg-orange-500/20',
];

export function UserSelect() {
  const { setCurrentUser } = useUserStore();
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Detect local network URL for family sharing
  const networkUrl = `http://${window.location.hostname}:5174`;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('*')
      .in('id', SLOTS)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, UserProfile> = {};
          data.forEach((p: UserProfile) => { map[p.id] = p; });
          setProfiles(map);
        }
      });
  }, []);

  async function saveProfile(id: string, name: string) {
    if (!name.trim()) return;
    setSaving(true);
    const profile: UserProfile = { id, display_name: name.trim() };
    await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });
    setProfiles(prev => ({ ...prev, [id]: profile }));
    setSaving(false);
    setEditing(null);
    // Log in immediately after naming
    setCurrentUser(profile);
  }

  function startEdit(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(id);
    setNameInput(profiles[id]?.display_name ?? '');
  }

  function selectUser(id: string) {
    const profile = profiles[id];
    if (!profile) {
      // Start naming flow
      setEditing(id);
      setNameInput('');
    } else {
      setCurrentUser(profile);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-black text-blue-400">DraftEdge</div>
          <div className="text-slate-400 text-sm">2026 NFL Draft — Who are you?</div>
        </div>

        {/* Profile slots */}
        <div className="grid grid-cols-2 gap-3">
          {SLOTS.map((id, i) => {
            const profile = profiles[id];
            const isEditing = editing === id;
            return (
              <div
                key={id}
                onClick={() => !isEditing && selectUser(id)}
                className={`relative border rounded-xl p-5 cursor-pointer transition-all min-h-[110px] flex flex-col items-center justify-center gap-2 ${SLOT_COLORS[i]}`}
              >
                {isEditing ? (
                  <div
                    className="w-full space-y-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveProfile(id, nameInput); if (e.key === 'Escape') setEditing(null); }}
                      placeholder="Your name..."
                      maxLength={20}
                      className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(null)}
                        className="flex-1 bg-slate-700 text-slate-300 rounded-lg py-1.5 text-xs"
                      >Cancel</button>
                      <button
                        onClick={() => saveProfile(id, nameInput)}
                        disabled={saving || !nameInput.trim()}
                        className="flex-1 bg-blue-600 disabled:opacity-50 text-white rounded-lg py-1.5 text-xs font-semibold"
                      >{saving ? '...' : 'Save'}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl">{['🧢', '👑', '🏈', '⚡'][i]}</div>
                    {profile ? (
                      <>
                        <div className="text-base font-bold text-white text-center leading-tight">{profile.display_name}</div>
                        <div className="text-xs text-slate-400">Tap to play</div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500 text-center">Tap to set your name</div>
                    )}
                    {/* Edit pencil */}
                    {profile && (
                      <button
                        onClick={e => startEdit(id, e)}
                        className="absolute top-2 right-2 text-slate-600 hover:text-slate-300 text-xs p-1 rounded transition-colors"
                        title="Rename"
                      >✏️</button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* AI always present note */}
        <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3">
          <div className="text-2xl">🤖</div>
          <div>
            <div className="text-sm font-semibold text-slate-200">AI</div>
            <div className="text-xs text-slate-500">Always competing — places real bets via Kalshi</div>
          </div>
          <div className="ml-auto text-xs text-slate-600">Auto</div>
        </div>

        {/* Network URL card — shown when running on LAN */}
        {!isLocalhost && (
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl px-4 py-3 text-center space-y-1">
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Join on your phone</div>
            <div className="font-mono text-blue-200 text-sm">{networkUrl}</div>
            <div className="text-xs text-slate-500">Same WiFi network required</div>
          </div>
        )}
        {isLocalhost && (
          <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl px-4 py-3 text-center space-y-1">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Share with family</div>
            <div className="text-xs text-slate-400">Start the app with <code className="bg-slate-700 px-1 rounded">npm run dev</code> — family devices see their network IP here</div>
          </div>
        )}
      </div>
    </div>
  );
}
