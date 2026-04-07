# Daily Game Feature - Supabase Setup Guide

This guide walks you through setting up the Supabase backend for the Daily Game feature (the game-matching feature similar to Zip on LinkedIn).

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A Supabase project created
3. Your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings

## 1. Set Environment Variables

Add your Supabase credentials to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Create Database Tables

In your Supabase project dashboard, go to **SQL Editor** and run the following SQL scripts to create the required tables:

### Table 1: daily_games

Stores the game featured for each day.

```sql
CREATE TABLE daily_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  actual_rank INT NOT NULL CHECK (actual_rank >= 1 AND actual_rank <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_games_date ON daily_games(date);
```

### Table 2: user_attempts

Tracks user guesses for each daily game.

```sql
CREATE TABLE user_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_game_id UUID NOT NULL REFERENCES daily_games(id) ON DELETE CASCADE,
  guessed_rank INT NOT NULL CHECK (guessed_rank >= 1 AND guessed_rank <= 10),
  correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_attempts_daily_game ON user_attempts(daily_game_id);
```

### Table 3: user_streaks

Tracks user statistics and streaks.

```sql
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  total_games_played INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 4: historical_data

Archives game rankings over time for comparison views.

```sql
CREATE TABLE historical_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  rank INT NOT NULL CHECK (rank >= 1 AND rank <= 10),
  date DATE NOT NULL,
  players INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historical_data_game ON historical_data(game_name);
CREATE INDEX idx_historical_data_date ON historical_data(date);
CREATE INDEX idx_historical_data_recorded_at ON historical_data(recorded_at);
```

## 3. Populate Initial Data

After creating the tables, add some sample data:

### Add a Daily Game

```sql
INSERT INTO daily_games (date, game_id, game_name, actual_rank)
VALUES (CURRENT_DATE, 'counter-strike-2', 'Counter-Strike 2', 1);
```

### Initialize User Streak (for anonymous users)

```sql
INSERT INTO user_streaks (current_streak, best_streak, total_games_played)
VALUES (0, 0, 0);
```

### Add Historical Data

```sql
-- Example: Add historical rankings for a game
INSERT INTO historical_data (game_id, game_name, rank, date, players, recorded_at)
VALUES 
  ('counter-strike-2', 'Counter-Strike 2', 1, CURRENT_DATE - INTERVAL '3 days', 1000000, NOW() - INTERVAL '3 days'),
  ('counter-strike-2', 'Counter-Strike 2', 2, CURRENT_DATE - INTERVAL '2 days', 950000, NOW() - INTERVAL '2 days'),
  ('counter-strike-2', 'Counter-Strike 2', 1, CURRENT_DATE - INTERVAL '1 day', 1100000, NOW() - INTERVAL '1 day');
```

## 4. (Optional) Enable Row Level Security (RLS)

For production apps, enable RLS on your tables:

```sql
-- Enable RLS on all tables
ALTER TABLE daily_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;

-- Allow public select on read-only tables
CREATE POLICY "Allow public read" ON daily_games FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON historical_data FOR SELECT USING (true);

-- Allow inserts to user_attempts and user_streaks (could be restricted to authenticated users)
CREATE POLICY "Allow public insert" ON user_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON user_streaks FOR INSERT WITH CHECK (true);
```

## 5. Test the Feature

1. Start your development server
2. You should see the **Daily Game** component on the left sidebar
3. Select a rank (1-10) and submit your guess
4. The component will show if you're correct and update your streak

## 6. Automate Daily Game Updates

To automatically update the daily game each day, you can:

- **Option A**: Use Supabase Edge Functions to trigger updates
- **Option B**: Use a cron job service (e.g., AWS Lambda, GitHub Actions) to update the daily_games table
- **Option C**: Manually update the daily_games table each day

Example function to get today's top game:

```sql
-- This would be called by your automation service
INSERT INTO daily_games (date, game_id, game_name, actual_rank)
VALUES (CURRENT_DATE, 'new-game-id', 'New Game Name', 1)
ON CONFLICT (date) DO NOTHING;
```

## Troubleshooting

- **"Supabase credentials not found"**: Make sure your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **"Failed to load daily game"**: Check that your `daily_games` table has an entry for today's date
- **"No ranking data available"**: Add data to the `historical_data` table for comparison views to work

## Architecture Overview

- **DailyGame.tsx**: Displays today's game, handles guesses, shows streak
- **Leaderboard.tsx**: Shows game ranking movements over 24h/7d/30d periods
- **supabase.ts**: Client initialization and type definitions
- **Backend Tables**: Store all game data, user attempts, and historical tracking

For questions or issues, refer to the [Supabase documentation](https://supabase.com/docs).
