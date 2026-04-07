import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { DailyGame as DailyGameType, UserAttempt, UserStreak } from '../lib/supabase';
import { AlertCircle, CheckCircle, Trophy, Flame } from 'lucide-react';

const RANK_COLORS = [
  '#FF0055', '#FF4D00', '#FFB800', '#00E676', '#00B0FF',
  '#2979FF', '#651FFF', '#D500F9', '#F50057', '#1DE9B6',
];

interface DailyGameProps {
  allGames: Array<{ rank: number; name: string; currentPlayers: string }>;
}

export default function DailyGame({ allGames }: DailyGameProps) {
  const [dailyGame, setDailyGame] = useState<DailyGameType | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [todayAttempt, setTodayAttempt] = useState<UserAttempt | null>(null);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchDailyGame();
  }, []);

  const fetchDailyGame = async () => {
    try {
      setError(null);
      setLoading(true);

      // Get today's daily game
      const today = new Date().toISOString().split('T')[0];
      const { data: gameData, error: gameError } = await supabase
        .from('daily_games')
        .select('*')
        .eq('date', today)
        .single();

      if (gameError && gameError.code !== 'PGRST116') throw gameError;

      if (gameData) {
        setDailyGame(gameData);

        // Check if user already attempted today
        const { data: attemptData } = await supabase
          .from('user_attempts')
          .select('*')
          .eq('daily_game_id', gameData.id)
          .maybeSingle();

        if (attemptData) {
          setTodayAttempt(attemptData);
          setShowResult(true);
        }
      } else {
        setError('No daily game available yet.');
      }

      // Get user streak
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .maybeSingle();

      if (streakData) {
        setUserStreak(streakData);
      }
    } catch (err) {
      console.error('Error fetching daily game:', err);
      setError('Failed to load daily game.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (!dailyGame || selectedRank === null) return;

    setIsSubmitting(true);
    try {
      const isCorrect = selectedRank === dailyGame.actual_rank;

      const { error: insertError } = await supabase
        .from('user_attempts')
        .insert({
          daily_game_id: dailyGame.id,
          guessed_rank: selectedRank,
          correct: isCorrect,
        });

      if (insertError) throw insertError;

      // Update streak
      if (userStreak) {
        const newStreak = isCorrect ? userStreak.current_streak + 1 : 0;
        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            best_streak: Math.max(newStreak, userStreak.best_streak),
            total_games_played: userStreak.total_games_played + 1,
          })
          .eq('id', userStreak.id);
      }

      setTodayAttempt({
        id: 'new',
        daily_game_id: dailyGame.id,
        guessed_rank: selectedRank,
        correct: isCorrect,
        created_at: new Date().toISOString(),
      });
      setShowResult(true);
    } catch (err) {
      console.error('Error submitting guess:', err);
      setError('Failed to submit guess.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameImage = (gameName: string) => {
    const game = allGames.find(g => g.name.toLowerCase() === gameName.toLowerCase());
    return game?.currentPlayers || '?';
  };

  if (loading) {
    return (
      <div className="bg-[#13111C] border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
        <div className="h-64 flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse mx-auto mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] font-bold">Loading Daily Game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dailyGame) {
    return (
      <div className="bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-3xl p-8 backdrop-blur-xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 shrink-0 mt-1 text-[#FF0055]" />
        <div>
          <h3 className="font-bold text-white mb-1">Daily Game Unavailable</h3>
          <p className="text-sm text-[#FF0055]/80">{error}</p>
          <p className="text-xs text-neutral-500 mt-3">Set up your Supabase project and configure the daily_games table to enable this feature.</p>
        </div>
      </div>
    );
  }

  if (!dailyGame) return null;

  const isCorrect = todayAttempt?.correct;
  const rankColor = RANK_COLORS[dailyGame.actual_rank - 1] || RANK_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#13111C] border rounded-3xl p-8 backdrop-blur-xl transition-all ${
        showResult ? 'border-white/10' : 'border-white/5'
      }`}
      style={showResult ? { boxShadow: `0 20px 40px -10px ${rankColor}20` } : {}}
    >
      {/* Streak Display */}
      {userStreak && (
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF4D00]" />
            <span className="text-sm font-bold text-white">
              Streak: <span className="text-[#FF4D00]">{userStreak.current_streak}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFB800]" />
            <span className="text-sm font-bold text-white">
              Best: <span className="text-[#FFB800]">{userStreak.best_streak}</span>
            </span>
          </div>
          <div className="ml-auto text-xs text-neutral-500">
            {userStreak.total_games_played} games played
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3">
          Game of the Day
        </p>
        <h3 className="text-3xl md:text-4xl font-black text-white font-display mb-4">
          {dailyGame.game_name}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="guess"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <p className="text-center text-neutral-400 text-sm">
              Where do you think this game ranks in the top 10?
            </p>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => (
                <motion.button
                  key={rank}
                  onClick={() => setSelectedRank(rank)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`py-3 rounded-lg font-bold text-sm transition-all border ${
                    selectedRank === rank
                      ? 'border-white bg-white text-black'
                      : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                  }`}
                  style={selectedRank === rank ? { boxShadow: `0 0 20px ${RANK_COLORS[rank - 1]}40` } : {}}
                >
                  {rank}
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={handleSubmitGuess}
              disabled={selectedRank === null || isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white text-black font-bold rounded-full disabled:opacity-50 transition-all uppercase text-sm tracking-widest shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Guess'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              {isCorrect ? (
                <motion.div
                  initial={{ rotate: 0, scale: 0 }}
                  animate={{ rotate: 360, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="flex items-center justify-center"
                >
                  <CheckCircle className="w-16 h-16 text-[#00E676]" />
                </motion.div>
              ) : (
                <AlertCircle className="w-16 h-16 text-[#FF0055]" />
              )}
            </div>

            <div>
              <h4 className={`text-2xl font-black mb-2 ${isCorrect ? 'text-[#00E676]' : 'text-[#FF0055]'}`}>
                {isCorrect ? 'Correct!' : 'Not Quite!'}
              </h4>
              <p className="text-white text-lg font-bold">
                #{dailyGame.actual_rank} <span className="text-neutral-400 text-sm font-normal ml-2">(You guessed #{todayAttempt?.guessed_rank})</span>
              </p>
            </div>

            <p className="text-xs text-neutral-500 uppercase tracking-[0.1em]">
              Come back tomorrow for a new game!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
