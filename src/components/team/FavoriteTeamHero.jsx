import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Flag from '../ui/Flag';
import { Calendar, MapPin, Clock, Shield } from 'lucide-react';

const FavoriteTeamHero = ({ team, nextMatch, opponent, onChangeTeam }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!nextMatch) return;

        const calculateTimeLeft = () => {
            // nextMatch.date is YYYY-MM-DD, nextMatch.time is HH:MM (UTC)
            const matchDateTimeStr = `${nextMatch.date}T${nextMatch.time}:00Z`;
            const difference = +new Date(matchDateTimeStr) - +new Date();

            if (difference <= 0) {
                setTimeLeft('Match In Progress / Completed');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [nextMatch]);

    // Format match date nicely
    const formatMatchDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    return (
        <Card className="relative overflow-hidden bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-stretch gap-6 shadow-xl hover:border-green-500/30 transition-all duration-300">
            {/* Ambient background glows */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Left side: Team details */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start flex-1 relative z-10 text-center md:text-left">
                <Flag code={team.countryCode} style={{ fontSize: '8rem' }} className="shadow-2xl rounded-lg border border-slate-700/50" />
                <div className="flex flex-col justify-between h-full pt-1">
                    <div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                            <Badge variant="green">FIFA RANK #{team.fifaRanking}</Badge>
                            <Badge variant="blue">GROUP {team.group}</Badge>
                            <Badge variant="gray">{team.confederation}</Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-2 leading-none">
                            {team.name}
                        </h1>
                        <p className="text-slate-400 font-semibold text-sm">
                            Manager: <span className="text-slate-200 font-bold">{team.manager || 'TBD'}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/60 text-left">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">World Cup Status</span>
                            <span className="text-xs font-bold text-green-400 flex items-center gap-1 mt-0.5">
                                <Shield className="w-3.5 h-3.5" />
                                Active (Group Stage)
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Qualification</span>
                            <span className="text-xs font-bold text-white mt-0.5 block">
                                Top 2 or Best 3rd
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Next Match Countdown */}
            <div className="flex flex-col justify-between items-center md:items-end text-center md:text-right bg-slate-950/45 border border-slate-850 p-6 rounded-2xl min-w-[280px] relative z-10 shadow-inner">
                {nextMatch ? (
                    <div className="w-full flex flex-col justify-between h-full gap-4">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Next Matchup</span>
                            <div className="flex items-center justify-center md:justify-end gap-3 mt-1.5">
                                <span className="font-black text-white text-base tracking-tight">{team.name}</span>
                                <span className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">VS</span>
                                <div className="flex items-center gap-2">
                                    <Flag code={opponent?.countryCode} style={{ fontSize: '1.5rem' }} className="shadow-sm border border-slate-800" />
                                    <span className="font-black text-slate-300 text-base tracking-tight">{opponent?.name || nextMatch.awayTeam}</span>
                                </div>
                            </div>
                        </div>

                        {/* Countdown Grid */}
                        <div className="flex flex-col items-center md:items-end my-2">
                            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest flex items-center gap-1 mb-2">
                                <Clock className="w-3.5 h-3.5 text-green-400" /> Match Countdown
                            </span>
                            {typeof timeLeft === 'object' && timeLeft !== null ? (
                                <div className="flex gap-2">
                                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                                        <span className="text-lg font-black text-white font-mono">{timeLeft.days}</span>
                                        <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">Days</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                                        <span className="text-lg font-black text-white font-mono">{timeLeft.hours}</span>
                                        <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">Hrs</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                                        <span className="text-lg font-black text-white font-mono">{timeLeft.minutes}</span>
                                        <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">Min</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-[44px] border-green-500/20">
                                        <span className="text-lg font-black text-green-400 font-mono">{timeLeft.seconds}</span>
                                        <span className="text-[8px] text-green-500/60 font-extrabold uppercase tracking-widest leading-none mt-0.5 font-mono">Sec</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {timeLeft || 'Calculating...'}
                                </span>
                            )}
                        </div>

                        {/* Match details (Date & Venue) */}
                        <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-400 font-semibold flex flex-col gap-1 items-center md:items-end">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {formatMatchDate(nextMatch.date)} · {nextMatch.time} UTC
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {nextMatch.location || nextMatch.venue}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-slate-500">
                        <Clock className="w-8 h-8 mb-2 text-slate-600" />
                        <span className="text-xs font-bold">No upcoming matches scheduled</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FavoriteTeamHero;
