import type { Game, PlayerStats } from '../types';

const GAMES_KEY = 'wiz_games_v1';
const PLAYERS_KEY = 'wiz_players_v1';

export function loadGames(): Game[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Game[];
  } catch {
    return [];
  }
}

export function saveGames(games: Game[]) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function loadPlayers(): PlayerStats[] {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlayerStats[];
  } catch {
    return [];
  }
}

export function savePlayers(players: PlayerStats[]) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

/**
 * Compute totals for a game: returns map playerId -> cumulative total
 */
import { scoreForPlayer } from './scoring';
export function computeTotalsForGame(game: Game): Record<string, number> {
  const totals: Record<string, number> = {};
  game.players.forEach(p => (totals[p.id] = 0));
  // history contains RoundResult entries; sum by player
  game.history.forEach(r => {
    totals[r.playerId] = (totals[r.playerId] || 0) + r.score;
  });
  return totals;
}

/**
 * Determine winner(s) for a completed game: highest total
 */
export function determineWinners(game: Game): string[] {
  const totals = computeTotalsForGame(game);
  const max = Math.max(...Object.values(totals), -Infinity);
  return Object.entries(totals).filter(([, v]) => v === max).map(([id]) => id);
}