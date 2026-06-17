import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    const getLocalDateString = (dateStr: string, timeStr: string, tz: string) => {
        if (!dateStr) return '';
        const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return dateStr;
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const parts = formatter.formatToParts(date);
            const year = parts.find(p => p.type === 'year')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const day = parts.find(p => p.type === 'day')?.value;
            return `${year}-${month}-${day}`;
        } catch (e) {
            return dateStr;
        }
    };

    const formatLocalDateStr = (localDateStr: string) => {
        if (!localDateStr) return '';
        const [y, m, d] = localDateStr.split('-');
        const dateObj = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        return dateObj.toLocaleDateString('en-GB', options);
    };

    const formatLocalTime = (dateStr: string, timeStr: string, tz: string) => {
        if (!dateStr) return timeStr;
        const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return timeStr;
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return formatter.format(date).toUpperCase();
        } catch (e) {
            return timeStr;
        }
    };

    const getTodayLocalDateString = (tz: string) => {
        const date = new Date();
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const parts = formatter.formatToParts(date);
            const year = parts.find(p => p.type === 'year')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const day = parts.find(p => p.type === 'day')?.value;
            return `${year}-${month}-${day}`;
        } catch (e) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    };

    const availableDates = useMemo(() => {
        const datesSet = new Set<string>();
        (matches as Match[]).forEach((match: Match) => {
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
        return (matches as Match[]).filter((match: Match) => {
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
            return true;
        }).sort((a: Match, b: Match) => {
            if (activeTab === 'upcoming') {
                return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
            }
            return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        });
    }, [matches, activeTab, selectedGroup, selectedDate, selectedTimeZone]);

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
        <div className="min-h-screen bg-gray-950 pb-20">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 mt-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">MATCH SCHEDULE</h1>
                    <p className="text-gray-500 font-medium text-sm">Follow every match from the biggest stage in football.</p>
                </div>

                {/* Tabs & Timezone Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-4 bg-gray-900/50 p-1 rounded-xl w-fit border border-gray-800">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'upcoming'
                                ? 'bg-green-500 text-gray-950 shadow-lg shadow-green-500/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'past'
                                ? 'bg-green-500 text-gray-950 shadow-lg shadow-green-500/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Past (Results)
                        </button>
                    </div>

                    {/* Timezone Selector Dropdown */}
                    <div className="relative inline-block text-left w-fit self-start sm:self-auto">
                        <select
                            value={selectedTimeZone}
                            onChange={(e) => setSelectedTimeZone(e.target.value)}
                            className="bg-gray-950 border border-gray-800 text-gray-300 text-[11px] md:text-xs rounded-full px-4 py-1.5 pr-8 outline-none focus:border-green-500/50 cursor-pointer appearance-none transition-colors font-bold shadow-lg"
                        >
                            {finalTimezones.map((tz) => (
                                <option key={tz.value} value={tz.value} className="bg-gray-950 text-gray-200">
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Filters & Today Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gray-900/20 p-4 rounded-2xl border border-gray-800/40">
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {groupsList.map((group) => (
                            <button
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all uppercase ${
                                    selectedGroup === group
                                        ? 'bg-[#22c55e] text-gray-950 shadow-md shadow-[#22c55e]/15'
                                        : 'bg-transparent text-gray-400 hover:text-white border border-gray-800'
                                }`}
                                style={{ fontSize: '12px' }}
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
                                className="bg-gray-950 border border-gray-800 text-gray-300 text-xs rounded-lg px-3 py-1.5 pr-8 outline-none focus:border-green-500/50 cursor-pointer appearance-none transition-colors font-bold shadow-md uppercase"
                            >
                                <option value="ALL" className="bg-gray-950 text-gray-200">ALL DATES</option>
                                {availableDates.map((d) => (
                                    <option key={d.value} value={d.value} className="bg-gray-950 text-gray-200">
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <button
                            onClick={handleTodayClick}
                            className="px-3 py-1.5 rounded-md text-xs font-bold border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors uppercase tracking-wider shrink-0"
                            style={{ fontSize: '12px' }}
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Match List */}
                <div className="space-y-12">
                    {sortedGroupedDates.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800 border-dashed">
                            <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No matches found for this period.</p>
                        </div>
                    ) : (
                        sortedGroupedDates.map((date) => {
                            const dateMatches = groupedMatches[date];
                            return (
                                <div key={date} data-date={date}>
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-4">
                                        <span className="bg-gray-800 h-[1px] flex-1"></span>
                                        {formatLocalDateStr(date)}
                                        <span className="bg-gray-800 h-[1px] flex-1"></span>
                                    </h3>
                                    <div className="space-y-3">
                                        {dateMatches.map((match: Match) => {
                                            const homeTeam = (teams as Team[]).find((t: Team) => t.id === match.homeTeam);
                                            const awayTeam = (teams as Team[]).find((t: Team) => t.id === match.awayTeam);
                                            const venue = (venues as Venue[]).find((v: Venue) => v.id === match.venue);

                                            const homeScorers = match.scorers?.filter(s => s.teamId === match.homeTeam) || [];
                                            const awayScorers = match.scorers?.filter(s => s.teamId === match.awayTeam) || [];
                                            const homeCards = match.cards?.filter(c => c.teamId === match.homeTeam) || [];
                                            const awayCards = match.cards?.filter(c => c.teamId === match.awayTeam) || [];

                                            return (
                                                <div
                                                    key={match.id}
                                                    className="bg-gradient-to-br from-gray-900/95 to-gray-900/40 backdrop-blur-md border border-gray-800/80 rounded-xl overflow-hidden hover:scale-[1.01] hover:-translate-y-0.5 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 cursor-pointer group shadow-md shadow-black/25"
                                                    onClick={() => navigate(`/match/${match.id}`)}
                                                >
                                                    <div className="flex items-center p-3 md:p-4 gap-2">
                                                        {/* Home Team */}
                                                        <div className="flex flex-col flex-1 items-start min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <Flag code={homeTeam?.countryCode} circular={true} className="w-10 h-10 border border-gray-800/60 shadow-md shrink-0" />
                                                                <span className="text-xs md:text-sm font-extrabold text-white uppercase truncate tracking-tight">{homeTeam?.name || match.homeTeam}</span>
                                                            </div>
                                                            {activeTab === 'past' && (homeScorers.length > 0 || homeCards.length > 0) && (
                                                                <div className="flex flex-col items-start gap-0.5 mt-1.5 pl-[52px]">
                                                                    {homeScorers.map((s, idx) => (
                                                                        <span key={idx} className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1 leading-tight">
                                                                            <span className="text-gray-500">⚽</span>
                                                                            <span>
                                                                                {s.name}
                                                                                {s.ownGoal && <span className="text-red-500 lowercase ml-0.5">(og)</span>}
                                                                                {s.penalty && <span className="text-yellow-500 lowercase ml-0.5">(pen)</span>}
                                                                                {s.minute && <span className="text-gray-600 font-normal ml-0.5">'{s.minute}</span>}
                                                                            </span>
                                                                        </span>
                                                                    ))}
                                                                    {homeCards.map((c, idx) => (
                                                                        <span key={idx} className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1.5 leading-tight">
                                                                            <div className={`w-1.5 h-2 rounded-[1px] shrink-0 ${c.type === 'red' ? 'bg-red-500 shadow-sm shadow-red-500/30' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} title={`${c.name} (${c.minute}')`} />
                                                                            <span>
                                                                                {c.name}
                                                                                {c.minute && <span className="text-gray-600 font-normal ml-0.5">'{c.minute}</span>}
                                                                            </span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Middle Section: Broadcast Scoreboard */}
                                                        <div className="flex flex-col items-center justify-center min-w-[130px] md:min-w-[150px] px-2 gap-1 shrink-0">
                                                            {activeTab === 'past' ? (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="flex items-center bg-gray-950/70 border border-gray-800 px-3.5 py-1 rounded-lg gap-2 shadow-inner font-mono">
                                                                        <span className="text-base md:text-lg font-black text-white group-hover:text-green-400 transition-colors">{match.homeScore}</span>
                                                                        <span className="text-gray-700 font-bold">:</span>
                                                                        <span className="text-base md:text-lg font-black text-white group-hover:text-green-400 transition-colors">{match.awayScore}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                                                        <span className="px-1 py-0.5 bg-gray-800 text-gray-400 border border-gray-700/60 rounded text-[8px] font-black mr-0.5">FT</span>
                                                                        <span>Group {match.group}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="flex items-center bg-gray-800/40 border border-gray-700/50 px-3 py-1 rounded-lg text-xs font-black text-gray-300">
                                                                        {formatLocalTime(match.date, match.time, selectedTimeZone)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                                                        <span>Group {match.group}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <span className="text-[8px] text-gray-600 flex items-center gap-1 justify-center whitespace-nowrap uppercase font-bold tracking-tight text-center mt-0.5">
                                                                <MapPin className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                                                                <span className="truncate max-w-[110px]">{venue?.name || match.venue}</span>
                                                            </span>
                                                        </div>

                                                        {/* Away Team */}
                                                        <div className="flex flex-col flex-1 items-end min-w-0 text-right">
                                                            <div className="flex items-center justify-end gap-3 w-full">
                                                                <span className="text-xs md:text-sm font-extrabold text-white uppercase truncate tracking-tight">{awayTeam?.name || match.awayTeam}</span>
                                                                <Flag code={awayTeam?.countryCode} circular={true} className="w-10 h-10 border border-gray-800/60 shadow-md shrink-0" />
                                                                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-green-500 transition-colors shrink-0 ml-1.5" />
                                                            </div>
                                                            {activeTab === 'past' && (awayScorers.length > 0 || awayCards.length > 0) && (
                                                                <div className="flex flex-col items-end gap-0.5 mt-1.5 pr-[52px]">
                                                                    {awayScorers.map((s, idx) => (
                                                                        <span key={idx} className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1 justify-end leading-tight">
                                                                            <span>
                                                                                {s.name}
                                                                                {s.ownGoal && <span className="text-red-500 lowercase ml-0.5">(og)</span>}
                                                                                {s.penalty && <span className="text-yellow-500 lowercase ml-0.5">(pen)</span>}
                                                                                {s.minute && <span className="text-gray-600 font-normal ml-0.5">'{s.minute}</span>}
                                                                            </span>
                                                                            <span className="text-gray-500">⚽</span>
                                                                        </span>
                                                                    ))}
                                                                    {awayCards.map((c, idx) => (
                                                                        <span key={idx} className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1.5 justify-end leading-tight">
                                                                            <span>
                                                                                {c.name}
                                                                                {c.minute && <span className="text-gray-600 font-normal ml-0.5">'{c.minute}</span>}
                                                                            </span>
                                                                            <div className={`w-1.5 h-2 rounded-[1px] shrink-0 ${c.type === 'red' ? 'bg-red-500 shadow-sm shadow-red-500/30' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} title={`${c.name} (${c.minute}')`} />
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Combined POTM & Highlights Row */}
                                                    {(match.playerOfMatch || match.status === 'completed') && (
                                                        <div className="flex items-center justify-between px-3 md:px-4 py-2 border-t border-gray-800/40 bg-gray-950/20">
                                                            {match.playerOfMatch ? (
                                                                <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-extrabold uppercase tracking-wider bg-amber-950/20 border border-amber-500/20 px-2.5 py-0.5 rounded-full select-none shadow-sm shadow-amber-500/5">
                                                                    <span className="text-[10px]">⭐</span>
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
                                                                        className="flex items-center gap-1.5 px-3 py-1 bg-[#ff0000] hover:bg-[#cc0000] text-white text-[10px] font-black uppercase tracking-widest rounded transition-all duration-200 shadow-md shadow-red-600/10 hover:shadow-red-600/20 group/hl-btn"
                                                                    >
                                                                        <span className="text-[9px] select-none">▶</span>
                                                                        <span>Highlights</span>
                                                                    </a>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
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
