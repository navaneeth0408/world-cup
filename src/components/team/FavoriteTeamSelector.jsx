import React, { useState } from 'react';
import Card from '../ui/Card';
import Flag from '../ui/Flag';
import { Sparkles, Search, Users } from 'lucide-react';

const FavoriteTeamSelector = ({ teams, onSelectTeam }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConfed, setSelectedConfed] = useState('ALL');

    const confeds = ['ALL', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

    const filteredTeams = teams.filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesConfed = selectedConfed === 'ALL' || team.confederation === selectedConfed;
        return matchesSearch && matchesConfed;
    }).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Card className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Personalize Your Experience
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-3">
                    CHOOSE YOUR FAVORITE TEAM
                </h2>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    Select your favorite national team to unlock a personalized World Cup command center. Track live fixtures, stats, news, lineup predictions, and tournament probabilities in real-time.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search teams (e.g. Argentina, Germany...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-green-500/50 text-white rounded-xl pl-11 pr-4 py-3 text-sm font-semibold outline-none transition-colors placeholder:text-slate-500"
                    />
                </div>

                {/* Confederation Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
                    {confeds.map(confed => (
                        <button
                            key={confed}
                            onClick={() => setSelectedConfed(confed)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                                selectedConfed === confed
                                    ? 'bg-green-500 text-slate-950'
                                    : 'bg-slate-950/40 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850'
                            }`}
                        >
                            {confed}
                        </button>
                    ))}
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 relative z-10 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => onSelectTeam(team.id)}
                            className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 hover:border-green-500/40 hover:bg-slate-900/30 transition-all duration-200 group text-center"
                        >
                            <Flag 
                                code={team.countryCode} 
                                className="w-12 h-8 rounded border border-slate-800 shadow-md group-hover:scale-105 transition-transform" 
                            />
                            <div className="flex flex-col items-center min-w-0 w-full">
                                <span className="text-[11px] font-black text-slate-400 group-hover:text-green-400 uppercase tracking-widest">
                                    GROUP {team.group}
                                </span>
                                <span className="text-xs font-bold text-white truncate max-w-full leading-normal mt-0.5">
                                    {team.name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                    Rank #{team.fifaRanking}
                                </span>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        <Users className="w-8 h-8 mb-2 text-slate-600" />
                        <span className="text-sm font-semibold">No qualifying teams match your filter.</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FavoriteTeamSelector;
