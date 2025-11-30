import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://lkkmslhlpkiippnjzizc.supabase.co/functions/v1';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 60000);
    
    const handleScoreUpdate = () => {
      loadLeaderboard();
    };
    window.addEventListener('scoreUpdated', handleScoreUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scoreUpdated', handleScoreUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setLeaderboard(result.data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-morphism rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#be0eff] to-[#8fb4ff]">
          🏆 Leaderboard
        </h2>
        <div className="text-sm text-gray-400">
          Resets in: <span className="text-[#ae75fb] font-mono">{timeUntilReset}</span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-[#be0eff]/20 to-[#8fb4ff]/20 rounded-lg border border-[#ae75fb]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Weekly Reward Pool</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              1,000,000 $HAKU85
            </p>
          </div>
          <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ae75fb] mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No scores yet today!</p>
            <p className="text-sm mt-2">Be the first to play and claim the top spot!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.id || `${entry.wallet_address}-${index}`}
              className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50'
                  : index === 2
                  ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-2 border-orange-700/50'
                  : 'bg-black/30 border border-[#4e4e4e]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-700 text-white' :
                  'bg-[#343434] text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-mono text-sm">
                    {entry.wallet_address?.slice(0, 6)}...{entry.wallet_address?.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#90B5FF]">{entry.score?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400">Wave {entry.wave || 0}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

window.Leaderboard = Leaderboard;