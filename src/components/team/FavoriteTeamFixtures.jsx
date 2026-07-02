import React from 'react';
import Card from '../ui/Card';
import Flag from '../ui/Flag';
import { Calendar, MapPin, Trophy } from 'lucide-react';

const FavoriteTeamFixtures = ({ team, teamMatches, teams, selectedTimeZone }) => {
    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    // Helper to format time
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr; // Simply return UTC time for consistency, or standard formatting
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calendar className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Upcoming Fixtures</h3>
            </div>

            <div className="flex flex-col gap-3">
                {teamMatches.length > 0 ? (
                    teamMatches.slice(0, 4).map((match) => {
                        const isHome = match.homeTeam === team.id;
                        const opponentId = isHome ? match.awayTeam : match.homeTeam;
                        const opponent = teams.find(t => t.id === opponentId);

                        return (
                            <Card 
                                key={match.id}
                                className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-green-500/20 hover:bg-slate-900/40 transition-all duration-300"
                            >
                                {/* Matchup info */}
                                <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Flag code={team.countryCode} style={{ fontSize: '1.8rem' }} className="shadow border border-slate-800" />
                                        <span className="text-xs font-black text-white uppercase tracking-tight">{team.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">VS</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Flag code={opponent?.countryCode} style={{ fontSize: '1.8rem' }} className="shadow border border-slate-800" />
                                        <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{opponent?.name || opponentId}</span>
                                    </div>
                                </div>

                                {/* Date, time and venue info */}
                                <div className="flex flex-col sm:items-end text-center sm:text-right gap-1 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                                    <span className="text-[11px] font-black text-white flex items-center justify-center sm:justify-end gap-1.5 leading-none">
                                        <Calendar className="w-3.5 h-3.5 text-green-400" />
                                        {formatDate(match.date)} · {formatTime(match.time)} UTC
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5 text-slate-650" />
                                        {match.location || match.venue}
                                    </span>
                                </div>

                                {/* Group Stage Badge */}
                                <div className="hidden lg:block shrink-0">
                                    <span className="text-[9px] text-slate-400 font-black border border-slate-800 bg-slate-950/40 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {match.stage === 'Group Stage' ? `Group ${match.group}` : match.stage}
                                    </span>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <div className="py-8 text-center text-slate-500 bg-slate-950/10 border border-dashed border-slate-800 rounded-2xl">
                        No upcoming fixtures remaining in the database.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoriteTeamFixtures;
