import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Daily game feature will be unavailable.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type UserStreak = {
  id: string;
  current_streak: number;
  best_streak: number;
  total_games_played: number;
};

export type DailyGame = {
  id: string;
  date: string;
  game_id: string;
  game_name: string;
  actual_rank: number;
  created_at: string;
};

export type UserAttempt = {
  id: string;
  daily_game_id: string;
  guessed_rank: number;
  correct: boolean;
  created_at: string;
};

export type HistoricalData = {
  id: string;
  game_id: string;
  game_name: string;
  rank: number;
  date: string;
  players: number;
  recorded_at: string;
};
