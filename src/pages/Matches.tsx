import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
// @ts-ignore
import KnockoutBracket from '../components/simulator/KnockoutBracket';
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
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'powerhouse' | 'knockout'>('upcoming');
    const navigate = useNavigate();

    const knockoutBracket = useMemo(() => {
        return computeActualKnockouts(teams, matches);
    }, [teams, matches]);

    const [searchParams] = useSearchParams();
    const teamParam = searchParams.get('team') || '';

    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [selectedDate, setSelectedDate] = useState<string>('ALL');
    const shouldScrollToTodayRef = useRef(false);
    const [selectedMatchup, setSelectedMatchup] = useState<any | null>(null);
    const [selectedPowerhouseTeam, setSelectedPowerhouseTeam] = useState<string>('ALL');

    useEffect(() => {
        setSelectedGroup('ALL');
        setSelectedDate('ALL');
        setSelectedPowerhouseTeam('ALL');
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

    const ALLOWED_PAIRS = [
        // Argentina
        ['argentina', 'brazil'],
        ['argentina', 'england'],
        ['argentina', 'mexico'],
        ['argentina', 'portugal'],
        ['argentina', 'spain'],
        ['argentina', 'france'],
        ['argentina', 'germany'],
        ['argentina', 'netherlands'],
        ['argentina', 'belgium'],
        ['argentina', 'colombia'],

        // England
        ['england', 'mexico'],
        ['england', 'brazil'],
        ['england', 'argentina'],
        ['england', 'germany'],
        ['england', 'netherlands'],
        ['england', 'france'],
        ['england', 'portugal'],
        ['england', 'spain'],
        ['england', 'usa'],
        ['england', 'belgium'],

        // Brazil
        ['brazil', 'england'],
        ['brazil', 'argentina'],
        ['brazil', 'germany'],
        ['brazil', 'netherlands'],
        ['brazil', 'france'],
        ['brazil', 'portugal'],
        ['brazil', 'spain'],
        ['brazil', 'usa'],
        ['brazil', 'belgium'],
        ['brazil', 'japan'],

        // Portugal
        ['portugal', 'croatia'],
        ['portugal', 'spain'],
        ['portugal', 'usa'],
        ['portugal', 'belgium'],
        ['portugal', 'france'],
        ['portugal', 'germany'],
        ['portugal', 'netherlands'],

        // Spain
        ['spain', 'usa'],
        ['spain', 'belgium'],
        ['spain', 'germany'],
        ['spain', 'netherlands'],
        ['spain', 'france'],

        // USA
        ['usa', 'belgium'],
        ['usa', 'netherlands'],
        ['usa', 'france'],
        ['usa', 'germany'],
        ['usa', 'mexico'],
        ['usa', 'japan'],

        // Belgium
        ['belgium', 'netherlands'],
        ['belgium', 'france'],
        ['belgium', 'germany'],
        ['belgium', 'mexico'],

        // France
        ['france', 'germany'],
        ['france', 'netherlands'],

        // Germany
        ['germany', 'netherlands'],

        // Netherlands
        ['netherlands', 'morocco']
    ];

    const powerhouseMatchups = useMemo(() => {
        if (!matches || matches.length === 0 || !teams || teams.length === 0) return [];

        const advancesTo: { [key: number]: { parent: number, slot: 'home' | 'away' } } = {};
        matches.forEach(m => {
            const matchIdNum = m.match_id;
            if (matchIdNum > 72) {
                const parseWinnerMatch = (teamString: any) => {
                    if (typeof teamString !== 'string') return null;
                    const match = teamString.match(/Winner Match\s+(\d+)/i);
                    return match ? parseInt(match[1], 10) : null;
                };

                const homeParentMatch = parseWinnerMatch(m.homeTeam);
                const awayParentMatch = parseWinnerMatch(m.awayTeam);
                
                if (homeParentMatch) {
                    advancesTo[homeParentMatch] = { parent: matchIdNum, slot: 'home' };
                }
                if (awayParentMatch) {
                    advancesTo[awayParentMatch] = { parent: matchIdNum, slot: 'away' };
                }
            }
        });

        const getMatchPath = (startMatchId: number) => {
            const path: number[] = [];
            let current: number | null = startMatchId;
            while (current) {
                path.push(current);
                const next = advancesTo[current];
                current = next ? next.parent : null;
            }
            return path;
        };

        const r32Matches = matches.filter(m => m.match_id >= 73 && m.match_id <= 88);

        const getStageName = (matchId: number) => {
            if (matchId >= 73 && matchId <= 88) return 'Round of 32';
            if (matchId >= 89 && matchId <= 96) return 'Round of 16';
            if (matchId >= 97 && matchId <= 100) return 'Quarter-finals';
            if (matchId === 101 || matchId === 102) return 'Semi-finals';
            if (matchId === 103) return 'Third Place';
            if (matchId === 104) return 'Final';
            return '';
        };

        const isAllowedClash = (idA: string, idB: string) => {
            const lowA = idA.toLowerCase();
            const lowB = idB.toLowerCase();
            return ALLOWED_PAIRS.some(pair => 
                (pair[0] === lowA && pair[1] === lowB) || 
                (pair[0] === lowB && pair[1] === lowA)
            );
        };

        const results: any[] = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];

                const startMatchA = r32Matches.find(m => 
                    m.homeTeam.toLowerCase() === teamA.id.toLowerCase() || 
                    m.awayTeam.toLowerCase() === teamA.id.toLowerCase()
                );
                const startMatchB = r32Matches.find(m => 
                    m.homeTeam.toLowerCase() === teamB.id.toLowerCase() || 
                    m.awayTeam.toLowerCase() === teamB.id.toLowerCase()
                );

                if (!startMatchA || !startMatchB) continue;

                const pathA = getMatchPath(startMatchA.match_id);
                const pathB = getMatchPath(startMatchB.match_id);

                const commonMatchId = pathA.find(id => pathB.includes(id));
                if (!commonMatchId) continue;

                const stage = getStageName(commonMatchId);
                
                if (!isAllowedClash(teamA.id, teamB.id)) continue;

                const meetingMatch = matches.find(m => m.match_id === commonMatchId);
                if (meetingMatch && meetingMatch.status === 'completed') continue;

                results.push({
                    teamA,
                    teamB,
                    stage,
                    matchId: commonMatchId,
                    venue: meetingMatch ? venues.find(v => v.id === meetingMatch.venue) : null,
                    match: meetingMatch
                });
            }
        }

        const stagePriority: { [key: string]: number } = {
            'Round of 32': 1,
            'Round of 16': 2,
            'Quarter-finals': 3,
            'Semi-finals': 4,
            'Final': 5
        };

        return results.sort((a, b) => (stagePriority[a.stage] || 99) - (stagePriority[b.stage] || 99));
    }, [matches, teams, venues]);

    const uniquePowerhouseTeams = useMemo(() => {
        if (!teams || teams.length === 0) return [];
        const teamMap = new Map<string, Team>();
        powerhouseMatchups.forEach(pm => {
            if (pm.teamA) teamMap.set(pm.teamA.id, pm.teamA);
            if (pm.teamB) teamMap.set(pm.teamB.id, pm.teamB);
        });
        return Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [powerhouseMatchups, teams]);

    const filteredPowerhouseMatchups = useMemo(() => {
        if (selectedPowerhouseTeam === 'ALL') return powerhouseMatchups;
        return powerhouseMatchups.filter(pm => 
            pm.teamA.id.toLowerCase() === selectedPowerhouseTeam.toLowerCase() || 
            pm.teamB.id.toLowerCase() === selectedPowerhouseTeam.toLowerCase()
        );
    }, [powerhouseMatchups, selectedPowerhouseTeam]);

    const getLeafTeamsForMatch = (matchId: number): string[] => {
        if (!matches || matches.length === 0) return [];
        const m = matches.find(x => x.match_id === matchId);
        if (!m) return [];
        if (matchId >= 73 && matchId <= 88) {
            return [m.homeTeam, m.awayTeam].filter(Boolean);
        }
        
        const parseWinnerMatch = (teamString: any) => {
            if (typeof teamString !== 'string') return null;
            const match = teamString.match(/Winner Match\s+(\d+)/i);
            return match ? parseInt(match[1], 10) : null;
        };

        const homeParent = parseWinnerMatch(m.homeTeam);
        const awayParent = parseWinnerMatch(m.awayTeam);
        
        let leaves: string[] = [];
        if (homeParent) {
            leaves = leaves.concat(getLeafTeamsForMatch(homeParent));
        } else if (m.homeTeam) {
            leaves.push(m.homeTeam);
        }
        if (awayParent) {
            leaves = leaves.concat(getLeafTeamsForMatch(awayParent));
        } else if (m.awayTeam) {
            leaves.push(m.awayTeam);
        }
        return leaves;
    };

    const getPathStepsForTeam = (team: Team, startMatchId: number, targetMatchId: number) => {
        if (!matches || matches.length === 0) return [];
        const path: number[] = [];
        
        const advancesToMap: { [key: number]: number } = {};
        matches.forEach(m => {
            if (m.match_id > 72) {
                const parseWinnerMatch = (tStr: any) => {
                    if (typeof tStr !== 'string') return null;
                    const match = tStr.match(/Winner Match\s+(\d+)/i);
                    return match ? parseInt(match[1], 10) : null;
                };
                const homeParent = parseWinnerMatch(m.homeTeam);
                const awayParent = parseWinnerMatch(m.awayTeam);
                if (homeParent) advancesToMap[homeParent] = m.match_id;
                if (awayParent) advancesToMap[awayParent] = m.match_id;
            }
        });

        let curr = startMatchId;
        while (curr) {
            path.push(curr);
            if (curr === targetMatchId) break;
            curr = advancesToMap[curr];
        }

        const steps: any[] = [];
        for (let i = 0; i < path.length - 1; i++) {
            const mId = path[i];
            const nextMId = path[i+1];
            const matchObj = matches.find(m => m.match_id === mId);
            
            const nextMatchObj = matches.find(m => m.match_id === nextMId);
            let opponentLabel = '';
            let potentialOpponents: string[] = [];

            if (nextMatchObj) {
                const parseWinnerMatch = (tStr: any) => {
                    if (typeof tStr !== 'string') return null;
                    const match = tStr.match(/Winner Match\s+(\d+)/i);
                    return match ? parseInt(match[1], 10) : null;
                };

                const nextHomeParent = parseWinnerMatch(nextMatchObj.homeTeam);
                const nextAwayParent = parseWinnerMatch(nextMatchObj.awayTeam);

                if (nextHomeParent === mId) {
                    if (nextAwayParent) {
                        opponentLabel = `Winner of Match ${nextAwayParent}`;
                        potentialOpponents = getLeafTeamsForMatch(nextAwayParent);
                    } else {
                        opponentLabel = nextMatchObj.awayTeam;
                        potentialOpponents = [nextMatchObj.awayTeam];
                    }
                } else if (nextAwayParent === mId) {
                    if (nextHomeParent) {
                        opponentLabel = `Winner of Match ${nextHomeParent}`;
                        potentialOpponents = getLeafTeamsForMatch(nextHomeParent);
                    } else {
                        opponentLabel = nextMatchObj.homeTeam;
                        potentialOpponents = [nextMatchObj.homeTeam];
                    }
                }
            }

            const getStageName = (matchId: number) => {
                if (matchId >= 73 && matchId <= 88) return 'Round of 32';
                if (matchId >= 89 && matchId <= 96) return 'Round of 16';
                if (matchId >= 97 && matchId <= 100) return 'Quarter-finals';
                if (matchId === 101 || matchId === 102) return 'Semi-finals';
                return 'Knockouts';
            };

            steps.push({
                matchId: mId,
                stage: getStageName(mId),
                match: matchObj,
                teamToWin: team,
                opponentLabel,
                potentialOpponents: potentialOpponents.map(id => {
                    const t = teams.find(x => x.id.toLowerCase() === id.toLowerCase());
                    return t ? t.name : id;
                })
            });
        }

        return steps;
    };

    const getTeamName = (id: string) => {
        if (!id) return '';
        const t = teams.find(x => x.id.toLowerCase() === id.toLowerCase());
        return t ? t.name : id;
    };

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
                        <button
                            onClick={() => setActiveTab('powerhouse')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'powerhouse'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Powerhouse Clashes
                        </button>
                        <button
                            onClick={() => setActiveTab('knockout')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${activeTab === 'knockout'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                        >
                            Knockout Bracket
                        </button>
                    </div>
                </div>

                {activeTab !== 'powerhouse' && activeTab !== 'knockout' && (
                    <>
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
                    </>
                )}

                {/* Powerhouse Matchups */}
                {activeTab === 'powerhouse' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm p-6 rounded-3xl relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                                    Potential Powerhouse Clashes
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                                    Below are the possible knockout match-ups between powerhouse nations. Meeting stages are mathematically determined based on the official tournament bracket. Both teams must qualify and win all their prior matches to face each other.
                                </p>
                            </div>
                        </div>

                        {uniquePowerhouseTeams.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/40 backdrop-blur-sm shadow-md">
                                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-2">Filter by Team:</span>
                                <button
                                    onClick={() => setSelectedPowerhouseTeam('ALL')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase border ${
                                        selectedPowerhouseTeam === 'ALL'
                                            ? 'bg-green-500 text-gray-950 border-green-500 shadow-sm shadow-green-500/20'
                                            : 'bg-slate-950/40 text-slate-400 border-slate-800/60 hover:text-white'
                                    }`}
                                    style={{ fontSize: '11px' }}
                                >
                                    All
                                </button>
                                {uniquePowerhouseTeams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedPowerhouseTeam(team.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase flex items-center gap-1.5 border ${
                                            selectedPowerhouseTeam === team.id
                                                ? 'bg-green-500 text-gray-950 border-green-500 shadow-sm shadow-green-500/20'
                                                : 'bg-slate-950/40 text-slate-400 border-slate-800/60 hover:text-white'
                                        }`}
                                        style={{ fontSize: '11px' }}
                                    >
                                        <Flag code={team.countryCode} style={{ fontSize: '12px' }} />
                                        {team.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredPowerhouseMatchups.map((pm, idx) => {
                                const borderColors: { [key: string]: string } = {
                                    'Final': 'border-yellow-500/30 hover:border-yellow-500/50 shadow-yellow-500/5',
                                    'Semi-finals': 'border-green-500/30 hover:border-green-500/50 shadow-green-500/5',
                                    'Quarter-finals': 'border-blue-500/30 hover:border-blue-500/50 shadow-blue-500/5',
                                    'Round of 16': 'border-purple-500/30 hover:border-purple-500/50 shadow-purple-500/5',
                                    'Round of 32': 'border-slate-800 hover:border-slate-700'
                                };
                                const badgeColors: { [key: string]: string } = {
                                    'Final': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
                                    'Semi-finals': 'bg-green-500/10 border-green-500/20 text-green-400',
                                    'Quarter-finals': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                                    'Round of 16': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                                    'Round of 32': 'bg-slate-800 border-slate-700 text-slate-400'
                                };

                                return (
                                    <div 
                                        key={idx}
                                        className={`bg-slate-900/20 hover:bg-slate-900/50 border rounded-3xl p-5 md:p-6 transition-all duration-300 shadow-lg relative group cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/5 ${borderColors[pm.stage] || 'border-slate-800'}`}
                                        onClick={() => setSelectedMatchup(pm)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 border rounded-full ${badgeColors[pm.stage] || 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                                {pm.stage}
                                            </span>
                                            {pm.match && (
                                                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-md">
                                                    Match {pm.matchId}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-850/60">
                                            <div className="flex flex-col items-center flex-1 text-center min-w-0">
                                                <div className="w-12 h-8 rounded overflow-hidden shadow-sm mb-2 shrink-0 flex items-center justify-center bg-slate-950/20 group-hover:scale-105 transition-transform">
                                                    <Flag code={pm.teamA.countryCode} style={{ fontSize: '24px' }} />
                                                </div>
                                                <span className="font-black text-white text-xs sm:text-sm uppercase tracking-tight truncate w-full">{pm.teamA.name}</span>
                                            </div>

                                            <div className="text-[10px] font-black text-slate-500 border border-slate-850 bg-slate-950 rounded-full w-7 h-7 flex items-center justify-center shrink-0">
                                                VS
                                            </div>

                                            <div className="flex flex-col items-center flex-1 text-center min-w-0">
                                                <div className="w-12 h-8 rounded overflow-hidden shadow-sm mb-2 shrink-0 flex items-center justify-center bg-slate-950/20 group-hover:scale-105 transition-transform">
                                                    <Flag code={pm.teamB.countryCode} style={{ fontSize: '24px' }} />
                                                </div>
                                                <span className="font-black text-white text-xs sm:text-sm uppercase tracking-tight truncate w-full">{pm.teamB.name}</span>
                                            </div>
                                        </div>

                                        {pm.match && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span className="truncate">{pm.venue?.name || pm.match.location || 'Stadium TBD'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span>
                                                        {formatLocalDateStr(pm.match.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Match List */}
                {activeTab !== 'powerhouse' && activeTab !== 'knockout' && (
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

                                            const winnerId = match.winner || match.winnerId;
                                            const winnerTeam = winnerId ? teams.find(t => t.id === winnerId) : null;
                                            const isKnockoutDraw = (match.match_id > 72 || match.stage !== 'Group Stage') && match.homeScore === match.awayScore && !!winnerId;

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
                                                        <div className="relative flex items-center justify-between px-4 py-2 border-t border-slate-800/40 bg-slate-950/20 backdrop-blur-sm">
                                                            {match.playerOfMatch ? (
                                                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-amber-500/15 border border-amber-500/30 rounded-full text-[9px] font-extrabold uppercase text-amber-400 select-none shadow-sm shadow-amber-500/5">
                                                                    <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                                                    <span>POTM: {match.playerOfMatch}</span>
                                                                </div>
                                                            ) : (
                                                                <div />
                                                            )}

                                                            {isKnockoutDraw && winnerTeam && (
                                                                <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                                                                    <span className="text-[7.5px] md:text-[8.5px] font-black text-green-400 uppercase tracking-widest text-center select-none bg-green-500/10 px-3 py-0.5 border border-green-500/20 rounded-full animate-pulse shadow-sm shadow-green-500/5">
                                                                        {winnerTeam.name} went through after penalties
                                                                    </span>
                                                                </div>
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
                )}

                {activeTab === 'knockout' && (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
                        <div className="bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm p-6 rounded-3xl relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-green-500" />
                                    Knockout Bracket
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                                    Real-world tournament progress. Completed matches show actual results; upcoming matches are TBD.
                                </p>
                            </div>
                        </div>

                        {/* Bracket Display */}
                        <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800/80 shadow-inner overflow-hidden">
                            <KnockoutBracket
                                rounds={{
                                    roundOf32: knockoutBracket.roundOf32,
                                    roundOf16: knockoutBracket.roundOf16,
                                    quarterFinals: knockoutBracket.quarterFinals,
                                    semiFinals: knockoutBracket.semiFinals,
                                    final: [knockoutBracket.final],
                                    thirdPlace: knockoutBracket.thirdPlace
                                }}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* Path Modal Overlay */}
            {selectedMatchup && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMatchup(null)}
                >
                    <div 
                        className="bg-[#0b0f19] border border-slate-800/80 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button 
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            onClick={() => setSelectedMatchup(null)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal Header */}
                        <div className="text-center pb-4 border-b border-slate-900">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 mb-3 inline-block">
                                Potential Stage: {selectedMatchup.stage}
                            </span>
                            <div className="flex items-center justify-center gap-6 my-2">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-10 rounded overflow-hidden shadow-md flex items-center justify-center bg-slate-950/40 border border-slate-800 mb-2">
                                        <Flag code={selectedMatchup.teamA.countryCode} style={{ fontSize: '32px' }} />
                                    </div>
                                    <span className="font-black text-white text-sm uppercase tracking-tight">{selectedMatchup.teamA.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-500">VS</span>
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-10 rounded overflow-hidden shadow-md flex items-center justify-center bg-slate-950/40 border border-slate-800 mb-2">
                                        <Flag code={selectedMatchup.teamB.countryCode} style={{ fontSize: '32px' }} />
                                    </div>
                                    <span className="font-black text-white text-sm uppercase tracking-tight">{selectedMatchup.teamB.name}</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Required results path to set up this powerhouse clash in <span className="text-white font-bold">Match {selectedMatchup.matchId}</span>.
                            </p>
                        </div>

                        {/* Path Details */}
                        <div className="space-y-6">
                            {selectedMatchup.stage === 'Round of 32' ? (
                                <div className="text-center py-6 bg-slate-900/10 border border-slate-800/40 rounded-2xl">
                                    <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-350 font-bold uppercase tracking-wider">Direct Matchup</p>
                                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                        These teams play each other directly in the Round of 32. No prior results are required!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Team A Path */}
                                    <div className="space-y-4 border-r border-slate-900/50 pr-0 md:pr-4">
                                        <h4 className="text-xs font-black text-green-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                                            <Flag code={selectedMatchup.teamA.countryCode} style={{ fontSize: '14px' }} />
                                            {selectedMatchup.teamA.name} Path
                                        </h4>
                                        <div className="relative pl-4 border-l border-slate-800 space-y-5">
                                            {getPathStepsForTeam(
                                                selectedMatchup.teamA, 
                                                matches.find(m => m.match_id >= 73 && m.match_id <= 88 && (m.homeTeam.toLowerCase() === selectedMatchup.teamA.id.toLowerCase() || m.awayTeam.toLowerCase() === selectedMatchup.teamA.id.toLowerCase()))?.match_id || 0,
                                                selectedMatchup.matchId
                                            ).map((step, sIdx) => (
                                                <div key={sIdx} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border border-slate-950 shadow-sm" />
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{step.stage}</span>
                                                            <span className="text-[8px] font-bold text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">Match {step.matchId}</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-200">
                                                            Must win vs <span className="text-white font-extrabold">{getTeamName(step.match?.homeTeam.toLowerCase() === step.teamToWin.id.toLowerCase() ? step.match?.awayTeam : step.match?.homeTeam)}</span>
                                                        </p>
                                                        {step.potentialOpponents.length > 1 && (
                                                            <p className="text-[9px] text-slate-500 italic leading-tight">
                                                                (Or vs {step.opponentLabel}: {step.potentialOpponents.filter(x => x.toLowerCase() !== step.teamToWin.name.toLowerCase()).slice(0, 3).join(', ')}...)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="relative">
                                                <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-yellow-500 border border-slate-950 flex items-center justify-center shadow-md">
                                                    <Star className="w-2 h-2 text-slate-950 fill-slate-950" />
                                                </div>
                                                <div className="space-y-1 pl-1">
                                                    <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">Clash Stage</span>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">Reaches {selectedMatchup.stage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team B Path */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-green-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                                            <Flag code={selectedMatchup.teamB.countryCode} style={{ fontSize: '14px' }} />
                                            {selectedMatchup.teamB.name} Path
                                        </h4>
                                        <div className="relative pl-4 border-l border-slate-800 space-y-5">
                                            {getPathStepsForTeam(
                                                selectedMatchup.teamB, 
                                                matches.find(m => m.match_id >= 73 && m.match_id <= 88 && (m.homeTeam.toLowerCase() === selectedMatchup.teamB.id.toLowerCase() || m.awayTeam.toLowerCase() === selectedMatchup.teamB.id.toLowerCase()))?.match_id || 0,
                                                selectedMatchup.matchId
                                            ).map((step, sIdx) => (
                                                <div key={sIdx} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border border-slate-950 shadow-sm" />
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{step.stage}</span>
                                                            <span className="text-[8px] font-bold text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">Match {step.matchId}</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-200">
                                                            Must win vs <span className="text-white font-extrabold">{getTeamName(step.match?.homeTeam.toLowerCase() === step.teamToWin.id.toLowerCase() ? step.match?.awayTeam : step.match?.homeTeam)}</span>
                                                        </p>
                                                        {step.potentialOpponents.length > 1 && (
                                                            <p className="text-[9px] text-slate-500 italic leading-tight">
                                                                (Or vs {step.opponentLabel}: {step.potentialOpponents.filter(x => x.toLowerCase() !== step.teamToWin.name.toLowerCase()).slice(0, 3).join(', ')}...)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="relative">
                                                <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-yellow-500 border border-slate-950 flex items-center justify-center shadow-md">
                                                    <Star className="w-2 h-2 text-slate-950 fill-slate-950" />
                                                </div>
                                                <div className="space-y-1 pl-1">
                                                    <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">Clash Stage</span>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">Reaches {selectedMatchup.stage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
                            <span>FIFA World Cup 2026</span>
                            <span>Calculated mathematically from bracket tree</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const computeActualKnockouts = (teams: any[], matches: any[]) => {
  const resolveTeam = (teamId: string, r32: any[], r16: any[], qf: any[], sf: any[]) => {
    if (!teamId) return null;
    const cleanId = teamId.toLowerCase();
    const directTeam = teams.find(t => t.id === cleanId);
    if (directTeam) return directTeam;

    if (cleanId.startsWith("winner match ")) {
      const matchNum = parseInt(cleanId.replace("winner match ", ""), 10);
      let prevMatch;
      if (matchNum >= 73 && matchNum <= 88) prevMatch = r32.find(m => m.match_id === matchNum);
      else if (matchNum >= 89 && matchNum <= 96) prevMatch = r16.find(m => m.match_id === matchNum);
      else if (matchNum >= 97 && matchNum <= 100) prevMatch = qf.find(m => m.match_id === matchNum);
      else if (matchNum >= 101 && matchNum <= 102) prevMatch = sf.find(m => m.match_id === matchNum);
      return prevMatch?.winner || null;
    }

    if (cleanId.startsWith("loser match ")) {
      const matchNum = parseInt(cleanId.replace("loser match ", ""), 10);
      let prevMatch;
      if (matchNum >= 101 && matchNum <= 102) prevMatch = sf.find(m => m.match_id === matchNum);
      return prevMatch?.loser || null;
    }

    return null;
  };

  const getTeam = (teamId: string) => teams.find(t => t.id === teamId) || null;

  const mapMatch = (m: any, r32: any[] = [], r16: any[] = [], qf: any[] = [], sf: any[] = []) => {
    if (!m) return { t1: null, t2: null, score: [null, null] as [number | null, number | null], winner: null, loser: null };
    const t1 = resolveTeam(m.homeTeam, r32, r16, qf, sf);
    const t2 = resolveTeam(m.awayTeam, r32, r16, qf, sf);
    const isCompleted = m.status === 'completed' && m.homeScore !== null && m.awayScore !== null;
    const score = isCompleted ? [m.homeScore, m.awayScore] as [number | null, number | null] : [null, null] as [number | null, number | null];
    const winner = isCompleted ? getTeam(m.winnerId || m.winner) : null;
    const loser = isCompleted ? (winner?.id === t1?.id ? t2 : t1) : null;
    return {
      t1,
      t2,
      score,
      winner,
      loser,
      id: m.id,
      match_id: m.match_id
    };
  };

  const getMatchByNum = (num: number, r32: any[] = [], r16: any[] = [], qf: any[] = [], sf: any[] = []) => {
    const m = matches.find(x => x.match_id === num);
    return mapMatch(m, r32, r16, qf, sf);
  };

  const roundOf32 = [73, 76, 75, 78, 74, 77, 79, 80, 82, 81, 84, 83, 85, 88, 86, 87].map(num => getMatchByNum(num));
  const roundOf16 = [91, 89, 94, 93, 90, 92, 95, 96].map(num => getMatchByNum(num, roundOf32));
  const quarterFinals = [99, 97, 98, 100].map(num => getMatchByNum(num, roundOf32, roundOf16));
  const semiFinals = [102, 101].map(num => getMatchByNum(num, roundOf32, roundOf16, quarterFinals));
  const final = getMatchByNum(104, roundOf32, roundOf16, quarterFinals, semiFinals);
  const thirdPlace = getMatchByNum(103, roundOf32, roundOf16, quarterFinals, semiFinals);

  // Winner of the final
  const winner = final.winner || null;

  return {
    roundOf32,
    roundOf16,
    quarterFinals,
    semiFinals,
    final,
    thirdPlace,
    winner
  };
};

export default Matches;
