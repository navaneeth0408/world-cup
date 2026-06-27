import React, { useState, useMemo } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import TeamCard from '../components/team/TeamCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search } from 'lucide-react';
import FavoriteTeamHub from '../components/team/FavoriteTeamHub';

const Teams = () => {
  const { teams, matches, loading } = useTournament();
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorite'
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('alphabetical');

  const filteredAndSortedTeams = useMemo(() => {
    // 1. Filter
    const filtered = (teams || []).filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || team.confederation === filter;
      return matchesSearch && matchesFilter;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'rank-low-high') {
        return b.fifaRanking - a.fifaRanking;
      }
      if (sortBy === 'rank-high-low') {
        return a.fifaRanking - b.fifaRanking;
      }
      if (sortBy === 'appearances-most-least') {
        return b.historicalAppearances - a.historicalAppearances;
      }
      // default: alphabetical (A-Z)
      return a.name.localeCompare(b.name);
    });
  }, [teams, search, filter, sortBy]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const confederations = ['ALL', 'UEFA', 'CONMEBOL', 'CAF', 'AFC', 'CONCACAF', 'OFC'];

  const handleFilterChange = (conf) => {
    setFilter(conf);
    setSortBy('alphabetical');
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Teams Center
            </h1>
            <p className="text-gray-500 font-medium">Browse qualified nations or access your personalized team command center.</p>
          </div>
        </div>

        {/* Tabs Selector */}
        <div className="flex gap-2 bg-slate-900/60 backdrop-blur-md p-1 rounded-xl w-fit border border-slate-800/85 mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'all'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40'
              }`}
          >
            All Teams
          </button>
          <button
            onClick={() => setActiveTab('favorite')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'favorite'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40'
              }`}
          >
            ⭐ My Team
          </button>
        </div>

        {activeTab === 'all' ? (
          <>
            {/* Search & Sort Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900/10 border border-slate-900 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Qualified Teams</h2>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">The 48 nations competing for the ultimate prize.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:max-w-xl">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-550" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm font-semibold"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative w-full sm:w-auto inline-block text-left shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-green-500/50 transition-colors font-bold shadow-lg appearance-none cursor-pointer"
                  >
                    <option value="alphabetical" className="bg-gray-950">Alphabetical (A-Z)</option>
                    <option value="rank-low-high" className="bg-gray-950">FIFA Rank (Low to High)</option>
                    <option value="rank-high-low" className="bg-gray-950">FIFA Rank (High to Low)</option>
                    <option value="appearances-most-least" className="bg-gray-950">World Cup Appearances (Most to Least)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              {confederations.map(conf => (
                <button
                  key={conf}
                  onClick={() => handleFilterChange(conf)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === conf
                    ? 'bg-green-500 text-gray-950 shadow-md shadow-green-500/10'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800/80'
                    }`}
                >
                  {conf}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {filteredAndSortedTeams.map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>

            {filteredAndSortedTeams.length === 0 && (
              <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-900 border-dashed">
                <p className="text-gray-500 font-bold text-sm">No teams found matching your criteria.</p>
              </div>
            )}
          </>
        ) : (
          <div className="animate-fade-in">
            <FavoriteTeamHub teams={teams} matches={matches} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Teams;