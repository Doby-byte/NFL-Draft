import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(price: number): string {
  return `${Math.round(price * 100)}¢`;
}

export function formatEdge(edge: number): string {
  const pts = Math.round(Math.abs(edge) * 100);
  return `${edge >= 0 ? '+' : '-'}${pts}pts`;
}

export function formatPayout(payoutPerDollar: number): string {
  return `$${payoutPerDollar.toFixed(2)}`;
}

export function espnLogoUrl(teamAbbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png`;
}

export function confidenceColor(confidence: string): string {
  return confidence === 'HIGH'   ? 'text-green-400'  :
         confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-slate-400';
}

export function betCallColor(betCall: string): string {
  return betCall === 'BET_YES' ? 'text-green-400'  :
         betCall === 'BET_NO'  ? 'text-red-400'    : 'text-slate-400';
}

export function betCallBg(betCall: string): string {
  return betCall === 'BET_YES' ? 'bg-green-500/20 border-green-500/40'  :
         betCall === 'BET_NO'  ? 'bg-red-500/20 border-red-500/40'      :
                                 'bg-slate-700/40 border-slate-600/40';
}
