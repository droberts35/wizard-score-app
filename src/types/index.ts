export type Player = {
  id: string;
  name: string;
};

export type PlayerStats = {
  id: string;
  name: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
};

export type RoundResult = {
  round: number;
  playerId: string;
  bid: number;
  tricksWon: number;
  score: number;
};

export type Game = {
  id: string;
  name: string;
  date: string; // ISO
  players: Player[];
  history: RoundResult[]; // flattened results for all rounds
  roundsCount: number; // completed rounds
  completed?: boolean;
  dealers?: Record<number, string>; // new: mapping roundNumber -> playerId
};