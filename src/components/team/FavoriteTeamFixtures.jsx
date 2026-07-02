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
                                className="bg-slate-900/30 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-green-500/20 hover:bg-slate-900/40 transition-all duration-300"
                            >
                                {/* Group Stage Badge / Stage info */}
                                <div className="shrink-0 order-first sm:order-last">
                                    <span className="text-[9px] text-slate-400 font-black border border-slate-800 bg-slate-950/40 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {match.stage === 'Group Stage' ? `Group ${match.group}` : match.stage}
                                    </span>
                                </div>

                                {/* Matchup info */}
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center w-full max-w-[340px] sm:w-[320px] shrink-0">
                                    {/* Team A */}
                                    <div className="flex items-center justify-end gap-2.5 text-right min-w-0">
                                        <span className="text-xs font-black text-white uppercase tracking-tight truncate">{isHome ? team.name : (opponent?.name || opponentId)}</span>
                                        <Flag code={isHome ? team.countryCode : opponent?.countryCode} style={{ fontSize: '1.8rem' }} className="shadow border border-slate-800 shrink-0" />
                                    </div>

                                    {/* VS Badge */}
                                    <div className="flex justify-center shrink-0">
                                        <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full leading-none">VS</span>
                                    </div>

                                    {/* Team B */}
                                    <div className="flex items-center justify-start gap-2.5 text-left min-w-0">
                                        <Flag code={isHome ? opponent?.countryCode : team.countryCode} style={{ fontSize: '1.8rem' }} className="shadow border border-slate-800 shrink-0" />
                                        <span className="text-xs font-black text-slate-300 uppercase tracking-tight truncate">{isHome ? (opponent?.name || opponentId) : team.name}</span>
                                    </div>
                                </div>

                                {/* Date, time and venue info */}
                                <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-1.5 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                                    <span className="text-[11px] font-black text-white flex items-center justify-center sm:justify-end gap-1.5 leading-none">
                                        <Calendar className="w-3.5 h-3.5 text-green-400" />
                                        {formatDate(match.date)} · {formatTime(match.time)} UTC
                                    </span>
                                    <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wide flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
                                        <MapPin className="w-3 h-3 text-slate-650" />
                                        {match.location || match.venue}
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
