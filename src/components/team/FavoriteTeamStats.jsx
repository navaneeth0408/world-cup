import React from 'react';
import Card from '../ui/Card';
import { BarChart3, TrendingUp, HelpCircle, ShieldAlert } from 'lucide-react';
import { powerRankingData } from '../../data/powerRankingData';

const FavoriteTeamStats = ({ team, completedMatches }) => {
    // Get team power ranking details
    const statsData = powerRankingData[team.id] || { marketValue: 50 };
    const marketValue = statsData.marketValue || 50;

    // Calculate squad stats
    const squad = team.squad || [];
    const averageAge = squad.length > 0 
        ? (squad.reduce((sum, p) => sum + (p.age || 26), 0) / squad.length).toFixed(1)
        : '26.4';

    // Calculate goals from tournament matches
    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    const teamCompletedMatches = completedMatches.filter(
        m => m.homeTeam === team.id || m.awayTeam === team.id
    );

    teamCompletedMatches.forEach(match => {
        const isHome = match.homeTeam === team.id;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        goalsScored += teamScore || 0;
        goalsConceded += opponentScore || 0;

        if (opponentScore === 0) {
            cleanSheets++;
        }

        if (teamScore > opponentScore) {
            wins++;
        } else if (teamScore === opponentScore) {
            draws++;
        } else {
            losses++;
        }
    });

    const totalGames = teamCompletedMatches.length;
    const winPercentage = totalGames > 0
        ? Math.round((wins / totalGames) * 100)
        : 65; // realistic default or placeholder based on power ranking

    // Deterministic stats based on FIFA Ranking
    const rank = team.fifaRanking || 50;
    const possessionBase = Math.max(40, Math.min(65, 62 - (rank * 0.3)));
    const passingAccuracyBase = Math.max(70, Math.min(92, 90 - (rank * 0.35)));

    const averagePossession = Math.round(possessionBase);
    const passingAccuracy = Math.round(passingAccuracyBase);

    // Stats config
    const statsList = [
        { label: 'FIFA Ranking', value: `#${rank}`, sub: `Confederation: ${team.confederation}` },
        { label: 'Average Age', value: `${averageAge} yrs`, sub: `${squad.length} Squad Players` },
        { label: 'Market Value', value: `€${marketValue}M`, sub: 'Transfermarkt valuation' },
        { label: 'Win Percentage', value: `${winPercentage}%`, sub: `${wins}W · ${draws}D · ${losses}L` },
        { label: 'Goals Scored', value: goalsScored, sub: `${(goalsScored / Math.max(1, totalGames)).toFixed(1)} per match` },
        { label: 'Goals Conceded', value: goalsConceded, sub: `${(goalsConceded / Math.max(1, totalGames)).toFixed(1)} per match` },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Team Statistics</h3>
            </div>

            {/* Grid of basic stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {statsList.map((stat, idx) => (
                    <Card 
                        key={idx}
                        className="bg-slate-900/30 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col justify-between hover:border-green-500/15 transition-colors"
                    >
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</span>
                        <div className="my-2.5">
                            <span className="text-2xl font-black text-white leading-none tracking-tight">{stat.value}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold truncate leading-none">{stat.sub}</span>
                    </Card>
                ))}
            </div>

            {/* Performance progress metrics */}
            <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-5 mt-1 flex flex-col sm:flex-row gap-6 justify-around items-center">
                {/* Possession progress circle */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="8" fill="transparent" />
                            <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                stroke="#22c55e" 
                                strokeWidth="8" 
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - averagePossession / 100)}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute text-lg font-black text-white font-mono">{averagePossession}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Average Possession</span>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1">Control in matches</span>
                    </div>
                </div>

                {/* Passing Accuracy progress circle */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="8" fill="transparent" />
                            <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                stroke="#3b82f6" 
                                strokeWidth="8" 
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - passingAccuracy / 100)}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute text-lg font-black text-white font-mono">{passingAccuracy}%</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Passing Accuracy</span>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1">Distribution efficiency</span>
                    </div>
                </div>

                {/* Clean sheets summary */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-3xl font-black text-green-400 font-mono">{cleanSheets}</span>
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider leading-none">Matches</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Clean Sheets</span>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1">Defensive resilience</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FavoriteTeamStats;
