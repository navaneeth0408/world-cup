import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, MapPin, ChevronRight, Play, Trophy, Star, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getLocalDateString,
  formatLocalDateStr,
  formatLocalTime,
  getTodayLocalDateString
} from '../utils/schedule';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    group: string;
    venue: string;
    status: 'upcoming' | 'completed' | 'live';
    homeScore: number | null;
    awayScore: number | null;
    scorers?: { name: string; teamId: string; minute?: string | number; ownGoal?: boolean; penalty?: boolean; assist?: string }[];
    cards?: { name: string; teamId: string; type: 'yellow' | 'red'; minute?: string | number }[];
    playerOfMatch?: string;
    highlightUrl?: string;
    stage?: string;
    location?: string;
}

interface Player {
    number: number;
    name: string;
    position: string;
    age?: number;
    captain?: boolean;
    club?: string;
    transfermarktUrl?: string;
}

interface Team {
    id: string;
    name: string;
    countryCode: string;
    squad?: Player[];
}

interface Venue {
    id: string;
    name: string;
    city: string;
}

const groupsList = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const Matches: React.FC = () => {
    const { matches, teams, venues, loading } = useTournament() as {
        matches: Match[],
        teams: Team[],
        venues: Venue[],
        loading: boolean
    };
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const teamParam = searchParams.get('team') || '';

    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [selectedDate, setSelectedDate] = useState<string>('ALL');
    const shouldScrollToTodayRef = useRef(false);

    useEffect(() => {
        setSelectedGroup('ALL');
        setSelectedDate('ALL');
    }, [activeTab]);

    const [selectedTimeZone, setSelectedTimeZone] = useState<string>(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return 'UTC';
        }
    });

    const timezoneOptions = [
        { label: 'UTC', value: 'UTC' },
        { label: 'EST (UTC-5)', value: 'America/New_York' },
        { label: 'CST (UTC-6)', value: 'America/Chicago' },
        { label: 'PST (UTC-8)', value: 'America/Los_Angeles' },
        { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
        { label: 'CET (UTC+1)', value: 'Europe/Paris' },
        { label: 'GST (UTC+4)', value: 'Asia/Dubai' },
        { label: 'AEST (UTC+10)', value: 'Australia/Sydney' }
    ];

    const finalTimezones = useMemo(() => {
        const exists = timezoneOptions.some(t => t.value === selectedTimeZone);
        if (!exists && selectedTimeZone) {
            return [
                { label: `Local (${selectedTimeZone})`, value: selectedTimeZone },
                ...timezoneOptions
            ];
        }
        return timezoneOptions;
    }, [selectedTimeZone]);

    const availableDates = useMemo(() => {
        const datesSet = new Set<string>();
        matches.forEach((match: Match) => {
            if (activeTab === 'upcoming') {
                if (match.status === 'completed') return;
            } else {
                if (match.status !== 'completed') return;
            }
            const localDate = getLocalDateString(match.date, match.time, selectedTimeZone);
            if (localDate) {
                datesSet.add(localDate);
            }
        });

        return Array.from(datesSet).sort().map(d => {
            return {
                value: d,
                label: formatLocalDateStr(d)
            };
        });
    }, [matches, activeTab, selectedTimeZone]);

    const filteredMatches = useMemo(() => {
        return matches.filter((match: Match) => {
            if (activeTab === 'upcoming') {
                if (match.status === 'completed') return false;
            } else {
                if (match.status !== 'completed') return false;
            }
            if (selectedGroup !== 'ALL') {
                if (match.group !== selectedGroup) return false;
            }
            if (selectedDate !== 'ALL') {
                const localDate = getLocalDateString(match.date, match.time, selectedTimeZone);
                if (localDate !== selectedDate) return false;
            }
            if (teamParam) {
                if (match.homeTeam !== teamParam && match.awayTeam !== teamParam) return false;
            }
            return true;
        }).sort((a: Match, b: Match) => {
            if (activeTab === 'upcoming') {
                return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
            }
            return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        });
    }, [matches, activeTab, selectedGroup, selectedDate, selectedTimeZone, teamParam]);

    const groupedMatches = useMemo(() => {
        const groups: { [key: string]: Match[] } = {};
        filteredMatches.forEach((match: Match) => {
            const localDate = getLocalDateString(match.date, match.time, selectedTimeZone);
            if (!groups[localDate]) {
                groups[localDate] = [];
            }
            groups[localDate].push(match);
        });
        return groups;
    }, [filteredMatches, selectedTimeZone]);

    const sortedGroupedDates = useMemo(() => {
        return Object.keys(groupedMatches).sort((a, b) => {
            if (activeTab === 'upcoming') {
                return a.localeCompare(b);
            }
            return b.localeCompare(a);
        });
    }, [groupedMatches, activeTab]);

    const scrollToToday = () => {
        const todayStr = getTodayLocalDateString(selectedTimeZone);
        const targetDate = sortedGroupedDates.find(dateStr => dateStr >= todayStr);
        if (targetDate) {
            const element = document.querySelector(`[data-date="${targetDate}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleTodayClick = () => {
        setSelectedDate('ALL');
        shouldScrollToTodayRef.current = true;
        if (activeTab === 'past') {
            setActiveTab('upcoming');
        } else {
            setTimeout(() => {
                scrollToToday();
            }, 50);
        }
    };

    useEffect(() => {
        if (activeTab === 'upcoming' && shouldScrollToTodayRef.current) {
            shouldScrollToTodayRef.current = false;
            const timer = setTimeout(() => {
                scrollToToday();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, sortedGroupedDates]);

    if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-[#0b0f19] to-gray-950 pb-20 text-slate-100">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 mt-12 animate-in fade-in duration-500">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                            <Trophy className="w-3.5 h-3.5" /> FIFA World Cup 2026
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                            MATCH SCHEDULE
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mt-1">Follow every fixture live from the stadiums of North America.</p>
                    </div>

                    {/* Timezone Selector Dropdown */}
                    <div className="relative inline-block text-left w-fit shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-bold">TIMEZONE</span>
                        <div className="relative">
                            <select
                                value={selectedTimeZone}
                                onChange={(e) => setSelectedTimeZone(e.target.value)}
                                className="bg-slate-900/80 border border-slate-800 text-slate-200 text-xs rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-green-500/50 cursor-pointer appearance-none transition-all font-bold shadow-lg backdrop-blur-md"
                            >
                                {finalTimezones.map((tz) => (
                                    <option key={tz.value} value={tz.value} className="bg-slate-950 text-slate-200">
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2 bg-slate-900/60 backdrop-blur-md p-1 rounded-xl w-fit border border-slate-800/80">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'upcoming'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'past'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Past (Results)
                        </button>
                    </div>
                </div>

                {/* Filters & Today Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40 backdrop-blur-sm shadow-md">
                    <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-2">Groups:</span>
                        {groupsList.map((group) => (
                            <button
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all uppercase ${
                                    selectedGroup === group
                                        ? 'bg-green-500 text-gray-950 shadow-sm shadow-green-500/20'
                                        : 'bg-slate-950/40 text-slate-400 hover:text-white border border-slate-800/60'
                                }`}
                                style={{ fontSize: '11px' }}
                            >
                                {group}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Date Filter Dropdown */}
                        <div className="relative inline-block text-left">
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 pr-9 outline-none focus:border-green-500/50 cursor-pointer appearance-none transition-all font-bold shadow-md uppercase"
                            >
                                <option value="ALL" className="bg-slate-950 text-slate-200">ALL DATES</option>
                                {availableDates.map((d) => (
                                    <option key={d.value} value={d.value} className="bg-slate-950 text-slate-200">
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <button
                            onClick={handleTodayClick}
                            className="px-4 py-2 rounded-xl text-xs font-black border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors uppercase tracking-wider shrink-0 shadow-sm"
                            style={{ fontSize: '11px' }}
                        >
                        Today
                        </button>
                    </div>
                </div>

                {/* Active Team Filter Banner */}
                {teamParam && (
                    <div className="mb-6 flex items-center justify-between bg-green-500/10 border border-green-500/25 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-400">
                                Filtering by team: <span className="text-white font-black uppercase">{teams.find(t => t.id === teamParam)?.name || teamParam}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/matches')}
                            className="text-[10px] text-slate-400 hover:text-white font-black uppercase tracking-wider transition-all bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800"
                        >
                            Clear Filter
                        </button>
                    </div>
                )}

                {/* Match List */}
                <div className="space-y-10">
                    {sortedGroupedDates.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/10 rounded-3xl border border-slate-800/80 border-dashed animate-pulse">
                            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-sm tracking-wide">No matches scheduled for this period.</p>
                        </div>
                    ) : (
                        sortedGroupedDates.map((date) => {
                            const dateMatches = groupedMatches[date];
                            return (
                                <div key={date} data-date={date} className="relative">
                                    {/* Premium Date Header */}
                                    <div className="sticky top-0 z-10 py-3 bg-gradient-to-b from-[#0b0f19] via-[#0b0f19] to-transparent mb-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-green-500 shrink-0" />
                                            <span>{formatLocalDateStr(date)}</span>
                                            <span className="flex-1 h-[1px] bg-gradient-to-r from-slate-800 via-slate-800/40 to-transparent"></span>
                                        </h3>
                                    </div>

                                    {/* Symmetrical Compact Match Cards */}
                                    <div className="space-y-3.5">
                                        {dateMatches.map((match: Match) => {
                                            const homeTeam = teams.find(t => t.id === match.homeTeam);
                                            const awayTeam = teams.find(t => t.id === match.awayTeam);
                                            const venue = venues.find(v => v.id === match.venue);

                                            const homeScorers = match.scorers?.filter(s => s.teamId === match.homeTeam) || [];
                                            const awayScorers = match.scorers?.filter(s => s.teamId === match.awayTeam) || [];
                                            const homeCards = match.cards?.filter(c => c.teamId === match.homeTeam && c.type === 'red') || [];
                                            const awayCards = match.cards?.filter(c => c.teamId === match.awayTeam && c.type === 'red') || [];

                                            return (
                                                <div
                                                    key={match.id}
                                                    className="bg-slate-900/20 hover:bg-slate-900/50 backdrop-blur-md border border-slate-800/60 hover:border-green-500/30 rounded-2xl overflow-hidden hover:scale-[1.005] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/35 relative"
                                                    onClick={() => navigate(`/match/${match.id}`)}
                                                >
                                                    <div className="px-4 py-3.5 pr-8 md:px-6 md:py-4">
                                                        {/* Symmetrical Layout */}
                                                        <div className="flex items-center justify-between gap-1 md:gap-4">
                                                            {/* Home Team */}
                                                            <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                                                                <div className="flex flex-col items-end min-w-0">
                                                                    <span className="text-xs md:text-sm font-black text-white uppercase truncate tracking-tight w-full leading-normal">
                                                                        {homeTeam?.name || match.homeTeam}
                                                                    </span>
                                                                    
                                                                    {/* Home Events - Aligned Right Under Team Name */}
                                                                    {activeTab === 'past' && (homeScorers.length > 0 || homeCards.length > 0) && (
                                                                        <div className="hidden md:flex flex-col items-end gap-1 mt-1.5 w-full">
                                                                            {homeScorers.map((s, idx) => (
                                                                                <span key={`s-${idx}`} className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 leading-tight text-right">
                                                                                    <span>⚽</span>
                                                                                    <span>
                                                                                        {s.name}
                                                                                        {s.ownGoal && <span className="text-red-500 lowercase ml-0.5 font-bold">(og)</span>}
                                                                                        {s.penalty && <span className="text-amber-500 lowercase ml-0.5 font-bold">(pen)</span>}
                                                                                        {s.minute && <span className="text-slate-500 font-normal ml-0.5">'{s.minute}</span>}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                            {homeCards.map((c, idx) => (
                                                                                <span key={`c-${idx}`} className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5 leading-tight text-right">
                                                                                    <div className="w-1.5 h-2.5 rounded-[1px] bg-red-600 shadow-sm shrink-0" title="Red Card" />
                                                                                    <span>
                                                                                        {c.name}
                                                                                        {c.minute && <span className="text-slate-500 font-normal ml-0.5">'{c.minute}</span>}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {homeTeam?.countryCode ? (
                                                                    <Flag code={homeTeam.countryCode} circular={true} className="w-8 h-8 md:w-11 md:h-11 border border-slate-800/80 shadow-md shrink-0 group-hover:border-green-500/20 transition-colors" />
                                                                ) : (
                                                                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 text-slate-500 font-black text-[9px] md:text-xs select-none shadow-sm">TBD</div>
                                                                )}
                                                            </div>

                                                            {/* Middle Section: Scoreboard / Time */}
                                                            <div className="flex flex-col items-center justify-center min-w-[80px] md:min-w-[130px] px-1 md:px-2 shrink-0">
                                                                {activeTab === 'past' ? (
                                                                    <div className="flex flex-col items-center gap-1.5">
                                                                        {/* Large Premium Score */}
                                                                        <div className="flex items-center bg-slate-950 border border-slate-800/60 px-4 py-1 rounded-xl gap-3 shadow-inner font-mono text-center tracking-tight select-none">
                                                                            <span className="text-xl md:text-2xl font-black text-white group-hover:text-green-400 transition-colors">{match.homeScore}</span>
                                                                            <span className="text-slate-800 font-black text-sm">:</span>
                                                                            <span className="text-xl md:text-2xl font-black text-white group-hover:text-green-400 transition-colors">{match.awayScore}</span>
                                                                        </div>
                                                                        
                                                                        {/* Status and stage details */}
                                                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                                                                            <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 text-slate-300 rounded-md text-[8px] font-black leading-none">FT</span>
                                                                            {match.stage === 'Group Stage' ? (
                                                                                <span>Group {match.group}</span>
                                                                            ) : (
                                                                                <span className="text-purple-400/90">{match.stage}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-1.5">
                                                                        {/* Kickoff time */}
                                                                        <div className="flex items-center bg-slate-850/50 border border-slate-800 px-3.5 py-1 rounded-xl text-xs font-black text-slate-200 shadow-sm">
                                                                            {formatLocalTime(match.date, match.time, selectedTimeZone)}
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                                                                            {match.stage === 'Group Stage' ? (
                                                                                <span>Group {match.group}</span>
                                                                            ) : (
                                                                                <span className="text-purple-400/80">{match.stage}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Location / Stadium */}
                                                                <span className="text-[9px] text-slate-500 flex items-center gap-1 justify-center whitespace-nowrap uppercase font-bold tracking-tight text-center mt-1">
                                                                    <MapPin className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                                                                    <span className="truncate max-w-[100px]">{venue?.name || match.location || match.venue}</span>
                                                                </span>
                                                            </div>

                                                            {/* Away Team */}
                                                            <div className="flex items-center justify-start gap-3 flex-1 min-w-0 text-left">
                                                                {awayTeam?.countryCode ? (
                                                                    <Flag code={awayTeam.countryCode} circular={true} className="w-8 h-8 md:w-11 md:h-11 border border-slate-800/80 shadow-md shrink-0 group-hover:border-green-500/20 transition-colors" />
                                                                ) : (
                                                                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 text-slate-500 font-black text-[9px] md:text-xs select-none shadow-sm">TBD</div>
                                                                )}
                                                                
                                                                <div className="flex flex-col items-start min-w-0">
                                                                    <div className="w-full">
                                                                        <span className="text-xs md:text-sm font-black text-white uppercase truncate tracking-tight w-full leading-normal">
                                                                            {awayTeam?.name || match.awayTeam}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {/* Away Events - Aligned Left Under Team Name */}
                                                                    {activeTab === 'past' && (awayScorers.length > 0 || awayCards.length > 0) && (
                                                                        <div className="hidden md:flex flex-col items-start gap-1 mt-1.5 w-full">
                                                                            {awayScorers.map((s, idx) => (
                                                                                <span key={`s-${idx}`} className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 leading-tight text-left">
                                                                                    <span>⚽</span>
                                                                                    <span>
                                                                                        {s.name}
                                                                                        {s.ownGoal && <span className="text-red-500 lowercase ml-0.5 font-bold">(og)</span>}
                                                                                        {s.penalty && <span className="text-amber-500 lowercase ml-0.5 font-bold">(pen)</span>}
                                                                                        {s.minute && <span className="text-slate-500 font-normal ml-0.5">'{s.minute}</span>}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                            {awayCards.map((c, idx) => (
                                                                                <span key={`c-${idx}`} className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5 leading-tight text-left">
                                                                                    <div className="w-1.5 h-2.5 rounded-[1px] bg-red-600 shadow-sm shrink-0" title="Red Card" />
                                                                                    <span>
                                                                                        {c.name}
                                                                                        {c.minute && <span className="text-slate-500 font-normal ml-0.5">'{c.minute}</span>}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Scorers & Cards list (shown below the main row on mobile only) */}
                                                        {activeTab === 'past' && (homeScorers.length > 0 || awayScorers.length > 0 || homeCards.length > 0 || awayCards.length > 0) && (
                                                            <div className="mt-3.5 pt-3 border-t border-slate-800/40 flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wide md:hidden">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {/* Home Events */}
                                                                    <div className="flex flex-col items-end gap-1 border-r border-slate-800/50 pr-3 min-w-0">
                                                                        {homeScorers.map((s, idx) => (
                                                                            <div key={`ms-h-${idx}`} className="flex items-center gap-1 justify-end w-full min-w-0">
                                                                                <span className="truncate">{s.name}</span>
                                                                                <span className="text-[9px] text-slate-500 font-normal shrink-0">'{s.minute}</span>
                                                                                <span className="shrink-0">⚽</span>
                                                                            </div>
                                                                        ))}
                                                                        {homeCards.map((c, idx) => (
                                                                            <div key={`mc-h-${idx}`} className="flex items-center gap-1 justify-end w-full min-w-0">
                                                                                <span className="truncate">{c.name}</span>
                                                                                <span className="text-[9px] text-slate-500 font-normal shrink-0">'{c.minute}</span>
                                                                                <div className="w-1.5 h-2.5 rounded-[1px] bg-red-600 shrink-0" />
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Away Events */}
                                                                    <div className="flex flex-col items-start gap-1 pl-3 min-w-0">
                                                                        {awayScorers.map((s, idx) => (
                                                                            <div key={`ms-a-${idx}`} className="flex items-center gap-1 justify-start w-full min-w-0">
                                                                                <span className="shrink-0">⚽</span>
                                                                                <span className="truncate">{s.name}</span>
                                                                                <span className="text-[9px] text-slate-500 font-normal shrink-0">'{s.minute}</span>
                                                                            </div>
                                                                        ))}
                                                                        {awayCards.map((c, idx) => (
                                                                            <div key={`mc-a-${idx}`} className="flex items-center gap-1 justify-start w-full min-w-0">
                                                                                <div className="w-1.5 h-2.5 rounded-[1px] bg-red-600 shrink-0" />
                                                                                <span className="truncate">{c.name}</span>
                                                                                <span className="text-[9px] text-slate-500 font-normal shrink-0">'{c.minute}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Combined POTM & Highlights Row */}
                                                    {(match.playerOfMatch || match.status === 'completed') && (
                                                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/40 bg-slate-950/20 backdrop-blur-sm">
                                                            {match.playerOfMatch ? (
                                                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-amber-500/15 border border-amber-500/30 rounded-full text-[9px] font-extrabold uppercase text-amber-400 select-none shadow-sm shadow-amber-500/5">
                                                                    <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                                                    <span>POTM: {match.playerOfMatch}</span>
                                                                </div>
                                                            ) : (
                                                                <div />
                                                            )}

                                                            {match.status === 'completed' && (() => {
                                                                const homeTeamName = homeTeam?.name || match.homeTeam;
                                                                const awayTeamName = awayTeam?.name || match.awayTeam;
                                                                const query = encodeURIComponent(`${homeTeamName} vs ${awayTeamName} 2026 World Cup highlights`);
                                                                const url = match.highlightUrl || `https://www.youtube.com/results?search_query=${query}`;
                                                                return (
                                                                    <a
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-650 to-rose-700 hover:from-red-550 hover:to-rose-600 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md shadow-red-950/40 hover:scale-105 hover:shadow-red-650/20 group/hl-btn"
                                                                    >
                                                                        <Play className="w-2.5 h-2.5 fill-white shrink-0" />
                                                                        <span>Highlights</span>
                                                                    </a>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                        {/* Absolute positioned list indicator Chevron */}
                                                        <ChevronRight className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-650 group-hover:text-green-500 transition-all pointer-events-none group-hover:translate-x-0.5 duration-200" />
                                                    </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default Matches;
