import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, ChevronDown, BarChart2, Search } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from './lib/utils';
import DailyGame from './components/DailyGame';
import Leaderboard from './components/Leaderboard';

interface Game {
  id: string;
  rank: number;
  name: string;
  currentPlayers: string;
  peakPlayers: string;
  hoursPlayed: string;
  appId: string | null;
}

const RANK_COLORS = [
  '#FF0055', // 1: Vivid Pink/Red
  '#FF4D00', // 2: Bright Orange
  '#FFB800', // 3: Golden Yellow
  '#00E676', // 4: Spring Green
  '#00B0FF', // 5: Light Blue
  '#2979FF', // 6: Royal Blue
  '#651FFF', // 7: Deep Purple
  '#D500F9', // 8: Magenta
  '#F50057', // 9: Pink
  '#1DE9B6', // 10: Teal
];

type SortOption = 'rank' | 'peak' | 'hours';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Interactive State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/top-games');
      const data = await response.json();
      if (data.status === 'success') {
        setGames(data.data);
      } else {
        setError(data.message || 'Failed to load games');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const maxPlayers = useMemo(() => {
    if (!games.length) return 1;
    return Math.max(...games.map(g => parseInt(g.currentPlayers.replace(/,/g, '') || '0', 10)));
  }, [games]);

  const sortedAndFilteredGames = useMemo(() => {
    let filtered = games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (sortBy === 'rank') return filtered.sort((a, b) => a.rank - b.rank);
    
    return filtered.sort((a, b) => {
      const parse = (val: string) => parseInt(val.replace(/,/g, '') || '0', 10);
      if (sortBy === 'peak') return parse(b.peakPlayers) - parse(a.peakPlayers);
      if (sortBy === 'hours') return parse(b.hoursPlayed) - parse(a.hoursPlayed);
      return 0;
    });
  }, [games, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#0B0914] text-neutral-200 font-sans selection:bg-white/20 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF0055]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00B0FF]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="relative">
            <div className="absolute -left-6 top-2 bottom-2 w-1.5 bg-gradient-to-b from-[#FF0055] via-[#FFB800] to-[#00B0FF] rounded-full hidden md:block" />
            <p className="text-[#FFB800] font-bold tracking-[0.25em] text-xs uppercase mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Live Infographic
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 font-display drop-shadow-lg">
              The Steam <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0055] to-[#FFB800]">Top 10</span>
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
              Visualizing the current titans of PC gaming. Ranked by live concurrent players.
            </p>
          </div>
          
          <button 
            onClick={fetchGames}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all disabled:opacity-50 text-xs font-bold tracking-widest uppercase text-white rounded-full shadow-xl shrink-0"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Data
          </button>
        </header>

        {/* Interactive Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search top games..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-full pl-12 pr-6 py-3 text-white focus:outline-none focus:border-[#00B0FF]/50 transition-colors font-mono text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase mr-2">Sort By:</span>
            {(['rank', 'peak', 'hours'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all border",
                  sortBy === sort 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                    : "bg-transparent text-neutral-400 border-white/10 hover:border-white/30 hover:text-white"
                )}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-8 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-3xl flex items-start gap-4 text-[#FF0055] backdrop-blur-md">
            <AlertCircle className="w-8 h-8 shrink-0 mt-1" />
            <div>
              <h3 className="font-black text-2xl mb-2 tracking-tight font-display">Telemetry Failed</h3>
              <p className="text-[#FF0055]/80 text-lg">{error}</p>
              <button 
                onClick={fetchGames}
                className="mt-6 px-6 py-3 bg-[#FF0055] hover:bg-[#FF0055]/80 text-white text-xs font-bold uppercase tracking-widest transition-colors rounded-full shadow-lg shadow-[#FF0055]/20"
              >
                Re-establish Connection
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column: Daily Game & Leaderboard */}
            <div className="lg:col-span-1 space-y-8">
              <DailyGame allGames={games} />
              <Leaderboard allGames={games} />
            </div>

            {/* Right Column: Top 10 Games List */}
            <div className="lg:col-span-2 space-y-4">
            {loading && games.length === 0 ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : sortedAndFilteredGames.length === 0 ? (
              <div className="py-20 text-center border border-white/5 rounded-3xl bg-white/5 backdrop-blur-md">
                <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2 font-display">No games found</h3>
                <p className="text-neutral-500">Try adjusting your search query.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {sortedAndFilteredGames.map((game, index) => {
                  // Keep original rank color even if sorted differently
                  const colorIndex = (game.rank - 1) % RANK_COLORS.length;
                  const color = RANK_COLORS[colorIndex];
                  const players = parseInt(game.currentPlayers.replace(/,/g, '') || '0', 10);
                  const percent = Math.max((players / maxPlayers) * 100, 2);
                  
                  return (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      index={index}
                      color={color}
                      percent={percent}
                      isExpanded={expandedId === game.id}
                      onToggle={() => setExpandedId(expandedId === game.id ? null : game.id)}
                    />
                  );
                })}
              </AnimatePresence>
            )}
            </div>
          </div>
        )}
        
        <footer className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500 uppercase tracking-widest font-bold">
          <p>Data Source: SteamCharts & Steam API</p>
          <p>Last Sync: {new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    </div>
  );
}

function GameCard({ 
  game, 
  index, 
  color, 
  percent, 
  isExpanded, 
  onToggle 
}: { 
  game: Game, 
  index: number, 
  color: string, 
  percent: number, 
  isExpanded: boolean, 
  onToggle: () => void 
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl transition-all duration-500",
        isExpanded ? "bg-[#1A1625] border-white/20 shadow-2xl" : "bg-[#13111C] border-white/5 hover:border-white/10 hover:bg-[#1A1625]",
        "border backdrop-blur-xl"
      )}
      style={{
        boxShadow: isExpanded ? `0 20px 40px -10px ${color}20` : 'none'
      }}
    >
      {/* Inline Bar Chart Background */}
      <div 
        className="absolute top-0 left-0 h-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />

      <button 
        onClick={onToggle}
        className="w-full text-left p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10"
      >
        {/* Rank Number (Massive) */}
        <div 
          className="text-6xl md:text-8xl font-black font-display leading-none tracking-tighter w-16 md:w-24 text-center shrink-0 transition-transform duration-500 group-hover:scale-110"
          style={{ color: color, textShadow: `0 0 30px ${color}40` }}
        >
          {game.rank}
        </div>

        {/* Game Thumbnail */}
        {game.appId && (
          <div className="shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block" style={{ boxShadow: `0 10px 30px -10px ${color}40` }}>
            <img 
              src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_231x87.jpg`}
              alt={game.name}
              className="w-32 md:w-40 h-auto object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Name & Bar */}
        <div className="flex-1 w-full min-w-0">
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight font-display mb-3 group-hover:translate-x-2 transition-transform duration-300 truncate">
            {game.name}
          </h2>
          
          {/* Visual Bar */}
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mb-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, delay: 0.2 + (index * 0.05), ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
          </div>

          {game.appId && (
            <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
              ID: {game.appId}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="w-full md:w-auto grid grid-cols-3 gap-4 md:gap-8 shrink-0">
          <DataPoint label="Live Players" value={game.currentPlayers} color={color} />
          <DataPoint label="24h Peak" value={game.peakPlayers} />
          <DataPoint label="Hours" value={game.hoursPlayed} />
        </div>
        
        {/* Chevron (No longer absolute, fixed overlapping) */}
        <div className="hidden md:flex shrink-0 items-center justify-center ml-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300"
            style={{ 
              borderColor: isExpanded ? color : 'rgba(255,255,255,0.1)',
              backgroundColor: isExpanded ? `${color}20` : 'transparent'
            }}
          >
            <ChevronDown 
              className={cn("w-5 h-5 transition-transform duration-500", isExpanded && "rotate-180")} 
              style={{ color: isExpanded ? color : '#fff' }}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-black/40 border-t border-white/5"
          >
            <div className="p-6 md:p-10">
              <GameDetails appId={game.appId} color={color} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DataPoint({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex flex-col items-start md:items-end">
      <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-2">{label}</span>
      <span 
        className="font-display text-xl md:text-3xl font-bold tracking-tighter"
        style={{ color: color || '#E5E5E5' }}
      >
        {value}
      </span>
    </div>
  );
}

function GameDetails({ appId, color }: { appId: string | null, color: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) {
      setLoading(false);
      setError("No App ID available for this game.");
      return;
    }

    const fetchData = async () => {
      try {
        const [chartRes, detailsRes] = await Promise.all([
          fetch(`/api/game/${appId}/chart`),
          fetch(`/api/game/${appId}/details`)
        ]);
        
        const chartDataResponse = await chartRes.json();
        const detailsDataResponse = await detailsRes.json();
        
        if (chartDataResponse.status === 'success' && Array.isArray(chartDataResponse.data)) {
          const formatted = chartDataResponse.data.map((point: [number, number]) => ({
            time: new Date(point[0]),
            players: point[1]
          }));
          setChartData(formatted);
        } else {
          setError("Could not load chart data.");
        }

        if (detailsDataResponse.status === 'success') {
          setDetails(detailsDataResponse.data);
        }
      } catch (err) {
        setError("Failed to fetch game data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appId]);

  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-neutral-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-6" style={{ color }} />
        <p className="text-xs uppercase tracking-[0.2em] font-bold">Compiling Dataset...</p>
      </div>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-neutral-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
        <AlertCircle className="w-10 h-10 mb-4 opacity-50" />
        <p className="text-sm font-bold tracking-widest uppercase">{error || "No chart data available."}</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0914] border p-5 rounded-2xl shadow-2xl backdrop-blur-xl" style={{ borderColor: `${color}40` }}>
          <p className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            {label.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="font-display text-3xl font-black tracking-tighter flex items-baseline gap-2" style={{ color }}>
            {payload[0].value.toLocaleString()} 
            <span className="text-[10px] font-sans uppercase tracking-widest text-neutral-500">Players</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      {/* Chart Section */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white flex items-center gap-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
            48-Hour Trend Analysis
          </h3>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorPlayers-${appId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#ffffff15" vertical={false} />
              <XAxis 
                dataKey="time" 
                tickFormatter={(time) => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="#ffffff40"
                fontSize={10}
                fontFamily="Space Grotesk, sans-serif"
                fontWeight={600}
                tickMargin={16}
                minTickGap={40}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#ffffff40"
                fontSize={10}
                fontFamily="Space Grotesk, sans-serif"
                fontWeight={600}
                tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                width={50}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="players" 
                stroke={color} 
                strokeWidth={4}
                fillOpacity={1} 
                fill={`url(#colorPlayers-${appId})`} 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-6 flex flex-col">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white flex items-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          About Game
        </h3>
        
        {details ? (
          <div className="space-y-6 flex-1">
            <p 
              className="text-sm text-neutral-300 leading-relaxed font-light" 
              dangerouslySetInnerHTML={{ __html: details.short_description }} 
            />
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {details.genres.map((g: string) => (
                  <span key={g} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
            <div className="h-4 bg-white/5 rounded-full w-4/6 animate-pulse" />
          </div>
        )}

        {appId && (
          <div className="pt-4 border-t border-white/10 mt-auto">
            <a 
              href={`https://store.steampowered.com/app/${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full text-xs font-bold tracking-widest uppercase transition-colors px-6 py-4 rounded-2xl border"
              style={{ 
                color: color, 
                borderColor: `${color}40`,
                backgroundColor: `${color}10`
              }}
            >
              View on Steam Store
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
