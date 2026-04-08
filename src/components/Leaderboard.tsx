import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { HistoricalData } from '../lib/supabase';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

const RANK_COLORS = [
  '#FF0055', '#FF4D00', '#FFB800', '#00E676', '#00B0FF',
  '#2979FF', '#651FFF', '#D500F9', '#F50057', '#1DE9B6',
];

interface LeaderboardProps {
  allGames: Array<{ rank: number; name: string }>;
}

type TimeRange = 'today' | 'week' | 'month';

export default function Leaderboard({ allGames }: LeaderboardProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);

  useEffect(() => {
    fetchHistoricalData();
  }, [timeRange]);

  const fetchHistoricalData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Check if Supabase is configured
      if (!supabase.supabaseUrl || !supabase.supabaseKey) {
        setSupabaseAvailable(false);
        setLoading(false);
        return;
      }

      const daysBack = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const { data, error: err } = await supabase
        .from('historical_data')
        .select('*')
        .gte('recorded_at', cutoffDate.toISOString())
        .order('recorded_at', { ascending: false });

      if (err) throw err;
      setHistoricalData(data || []);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to load game rankings history.');
    } finally {
      setLoading(false);
    }
  };

  const getGameHistory = (gameName: string) => {
    return historicalData
      .filter(h => h.game_name.toLowerCase() === gameName.toLowerCase())
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  };

  const getGameTrend = (gameName: string) => {
    const history = getGameHistory(gameName);
    if (history.length < 2) return { trend: null, oldRank: null, newRank: null };

    const oldestRank = history[0].rank;
    const newestRank = history[history.length - 1].rank;

    return {
      trend: oldestRank > newestRank ? 'up' : oldestRank < newestRank ? 'down' : 'stable',
      oldRank: oldestRank,
      newRank: newestRank,
    };
  };

  const topGamesWithTrends = allGames
    .map(game => ({
      ...game,
      ...getGameTrend(game.name),
    }))
    .filter(game => game.trend !== null);

  if (!supabaseAvailable) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 border border-amber-500/20 backdrop-blur-md">
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-amber-100">Rankings Comparison</h3>
          <p className="text-sm text-amber-100/70">Supabase not configured. Add your credentials to .env to see ranking comparisons.</p>
          <p className="text-xs text-amber-100/50 mt-2">See SUPABASE_SETUP.md for instructions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FF0055]/5 via-transparent to-[#00B0FF]/5 border border-white/10 backdrop-blur-md">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-3/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-3xl p-8 backdrop-blur-xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 shrink-0 mt-1 text-[#FF0055]" />
        <div>
          <h3 className="font-bold text-white mb-1">Rankings History Unavailable</h3>
          <p className="text-sm text-[#FF0055]/80">{error}</p>
          <p className="text-xs text-neutral-500 mt-3">Set up your Supabase project and configure the historical_data table to enable this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#13111C] border border-white/5 rounded-3xl p-8 backdrop-blur-xl"
    >
      <div className="mb-8 pb-8 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-2">
              Rankings Comparison
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-white font-display">
              Game Movements
            </h3>
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${
                  timeRange === range
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {range === 'today' ? '24h' : range === 'week' ? '7d' : '30d'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : topGamesWithTrends.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm font-bold tracking-widest uppercase">No ranking data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topGamesWithTrends.map((game, index) => {
            const color = RANK_COLORS[game.rank - 1] || RANK_COLORS[0];
            const trendDirection = game.trend === 'up' ? 'up' : game.trend === 'down' ? 'down' : 'stable';
            const trendColor = trendDirection === 'up' ? '#00E676' : trendDirection === 'down' ? '#FF0055' : '#FFB800';
            const rankChange = game.newRank - game.oldRank;

            return (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedGame(selectedGame === game.name ? null : game.name)}
                className="group cursor-pointer p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="text-2xl font-black font-display text-center w-12 shrink-0"
                      style={{ color }}
                    >
                      {game.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm md:text-base truncate group-hover:translate-x-1 transition-transform">
                        {game.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-[0.1em] font-bold">
                        {timeRange === 'today'
                          ? 'Last 24 Hours'
                          : timeRange === 'week'
                          ? 'Last 7 Days'
                          : 'Last 30 Days'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Rank Change</p>
                      <p className="font-display font-black text-sm">
                        #{game.oldRank} → #{game.newRank}
                      </p>
                    </div>

                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: `${trendColor}20` }}>
                      {trendDirection === 'up' ? (
                        <TrendingUp className="w-5 h-5" style={{ color: trendColor }} />
                      ) : trendDirection === 'down' ? (
                        <TrendingDown className="w-5 h-5" style={{ color: trendColor }} />
                      ) : (
                        <Minus className="w-5 h-5" style={{ color: trendColor }} />
                      )}
                    </div>
                  </div>
                </div>

                {selectedGame === game.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-white/5 text-xs text-neutral-400"
                  >
                    <p>
                      {trendDirection === 'up' && `📈 Rising in popularity: Jumped from #${game.oldRank} to #${game.newRank}`}
                      {trendDirection === 'down' && `📉 Declining: Dropped from #${game.oldRank} to #${game.newRank}`}
                      {trendDirection === 'stable' && `➡️ Stable position at #${game.rank}`}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
