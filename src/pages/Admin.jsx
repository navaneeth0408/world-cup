import React, { useState, useMemo } from 'react';
import { useTournament } from '../hooks/useTournament';
import { useTournamentStore } from '../store/tournamentStore';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import { Lock, Save, Search, Plus, Trash2, Users, RefreshCw, CheckCircle, AlertCircle, BarChart3, ChevronUp, ChevronDown, Sparkles, Edit2, X, Check } from 'lucide-react';
import { getTeamStrengthDetails } from '../utils/simulationHelpers';
import { historicalSquads } from '../data/historicalData';

const normalizeTeamName = (name) => {
    if (!name) return '';
    const teamNameMap = {
        'czech republic': 'czechia',
        'turkey': 'turkiye',
        'bosnia-herzegovina': 'bosniaandherzegovina',
        'bosnia and herzegovina': 'bosniaandherzegovina',
        'united states': 'usa',
        'curaçao': 'curacao',
        'dr congo': 'drcongo',
        'drc congo': 'drcongo',
        'cape verde': 'capeverde',
        'côte d\'ivoire': 'ivorycoast',
        'ivory coast': 'ivorycoast',
        'south africa': 'southafrica',
        'south korea': 'southkorea',
        'republic of korea': 'southkorea',
        'korea republic': 'southkorea',
        'saudi arabia': 'saudiarabia',
        'new zealand': 'newzealand',
    };
    const lower = name.toLowerCase().trim();
    if (teamNameMap[lower]) return teamNameMap[lower];
    return lower.replace(/[\s\-\_']/g, '');
};

const extractJsonArray = (text) => {
    if (!text) return '[]';
    const jsonStart = text.indexOf('[');
    if (jsonStart === -1) throw new Error('No JSON array found in response');
    let braceCount = 0;
    let inString = false;
    let escape = false;
    for (let i = jsonStart; i < text.length; i++) {
        const char = text[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '[') {
                braceCount++;
            } else if (char === ']') {
                braceCount--;
                if (braceCount === 0) {
                    return text.slice(jsonStart, i + 1);
                }
            }
        }
    }
    throw new Error('Unclosed JSON array in response');
};

const Admin = () => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const { matches, teams, loading } = useTournament();
    const { updateMatchScore, syncWithOnline, updateTeamStrengths } = useTournamentStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [localState, setLocalState] = useState({});
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [aiUpdating, setAiUpdating] = useState({});

    // Strengths editing states
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editingStrengths, setEditingStrengths] = useState({});
    const [isSavingStrengths, setIsSavingStrengths] = useState(false);

    const handleStartEditStrengths = (team) => {
        setEditingTeamId(team.id);
        setEditingStrengths({
            fifaRanking: team.fifaRanking,
            fifaScore: team.fifaScore,
            marketValue: team.marketValue,
            squadScore: team.squadScore,
            continentalScore: team.continentalScore,
            historyScore: team.historyScore,
            worldCupRecentScore: team.worldCupRecentScore
        });
    };

    const handleCancelEditStrengths = () => {
        setEditingTeamId(null);
        setEditingStrengths({});
    };

    const handleSaveStrengths = async (teamId, teamName) => {
        setIsSavingStrengths(true);
        try {
            const payload = {
                teamId,
                teamName,
                ...editingStrengths
            };
            const response = await fetch('/api/save-team-strengths', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                updateTeamStrengths(teamId, editingStrengths);
                setEditingTeamId(null);
                setEditingStrengths({});
                alert('Team strengths updated successfully!');
            } else {
                alert('Failed to update team strengths: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error updating team strengths: ' + err.message);
        } finally {
            setIsSavingStrengths(false);
        }
    };

    const [activeTab, setActiveTab] = useState('results'); // results | strengths
    const [sortField, setSortField] = useState('powerScore');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const teamsWithStrengths = useMemo(() => {
        return teams.map(team => {
            const details = getTeamStrengthDetails(team);
            return {
                ...team,
                ...details
            };
        });
    }, [teams]);

    const classicalTeamsWithStrengths = useMemo(() => {
        return Object.entries(historicalSquads).map(([key, squad]) => {
            const parentId = key.split('-')[0];
            const parentTeam = teams.find(t => t.id === parentId || t.name.toLowerCase() === squad.teamName.toLowerCase());
            
            let powerScore = 50.0;
            let fifaRanking = 50;
            let parentCountryCode = '';
            let details = null;
            
            if (parentTeam) {
                details = getTeamStrengthDetails({ ...parentTeam, id: key, name: `${squad.teamName} (${squad.year})` });
                powerScore = details.total;
                fifaRanking = details.fifaRanking;
                parentCountryCode = parentTeam.countryCode;
            }
            
            return {
                id: key,
                name: `${squad.teamName} (${squad.year})`,
                parentName: squad.teamName,
                year: squad.year,
                formation: squad.formation,
                description: squad.description,
                notablePlayers: squad.players ? squad.players.slice(0, 3).map(p => p.name).join(', ') : '',
                powerScore,
                fifaRanking,
                parentCountryCode,
                details
            };
        });
    }, [teams]);

    const sortedClassicalTeams = useMemo(() => {
        return [...classicalTeamsWithStrengths].sort((a, b) => b.powerScore - a.powerScore);
    }, [classicalTeamsWithStrengths]);

    const filteredAndSortedTeams = useMemo(() => {
        let result = [...teamsWithStrengths];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t => t.name.toLowerCase().includes(term) || t.id.toLowerCase().includes(term));
        }
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (sortField === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });
        return result;
    }, [teamsWithStrengths, searchTerm, sortField, sortDirection]);

    const DEFAULT_FEED_URL = 'https://www.thesportsdb.com/league/4429-fifa-world-cup';
    const [feedUrl, setFeedUrl] = useState(() => {
        try {
            const stored = localStorage.getItem('live_feed_url');
            if (stored === 'https://paste.c-net.org/AdamsMissing') return DEFAULT_FEED_URL;
            return stored || DEFAULT_FEED_URL;
        } catch { return DEFAULT_FEED_URL; }
    });

    const handleFeedUrlChange = (newUrl) => {
        setFeedUrl(newUrl);
        try { localStorage.setItem('live_feed_url', newUrl); } catch {}
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin2026') {
            setIsAuthorized(true);
        } else {
            alert('Incorrect password');
        }
    };

    // ─── Match Sync ───────────────────────────────────────────────────────────────
    const handleSync = async () => {
        setIsSyncing(true);
        setSyncStatus('Fetching Schedule...');
        try {
            let actualUrl = feedUrl;
            if (feedUrl.includes('thesportsdb.com')) {
                const apiKey = import.meta.env.VITE_LIVE_FEED_API_KEY || import.meta.env.LIVE_FEED_API_KEY || '123';
                actualUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsseason.php?id=4429&s=2026`;
            }

            let data;
            try {
                const response = await fetch(actualUrl);
                data = await response.json();
            } catch (directError) {
                const proxyResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(actualUrl)}`);
                if (!proxyResponse.ok) throw new Error('Proxy fetch failed');
                const proxyData = await proxyResponse.json();
                data = JSON.parse(proxyData.contents);
            }

            let finalData = data;
            if (data) {
                let completedMatchesForSearch = [];
                const isSportsDb = !!data.events;

                if (isSportsDb) {
                    completedMatchesForSearch = data.events.filter(e =>
                        (e.intHomeScore !== null && e.intHomeScore !== undefined && e.intHomeScore !== '') ||
                        e.strStatus === 'FT' || e.strStatus === 'AP'
                    ).map(e => ({ home: e.strHomeTeam, away: e.strAwayTeam }));
                } else if (Array.isArray(data)) {
                    completedMatchesForSearch = data.filter(m =>
                        m.status === 'completed' || (m.homeScore !== null && m.homeScore !== undefined && m.homeScore !== '')
                    ).map(m => {
                        const homeTeamObj = teams.find(t => t.id === m.homeTeam);
                        const awayTeamObj = teams.find(t => t.id === m.awayTeam);
                        return {
                            home: homeTeamObj ? homeTeamObj.name : m.homeTeam,
                            away: awayTeamObj ? awayTeamObj.name : m.awayTeam
                        };
                    });
                }

                let aiDetailsMap = {};
                const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
                if (geminiKey && completedMatchesForSearch.length > 0) {
                    setSyncStatus('Searching Web via AI...');
                    try {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const prompt = `Today's date is ${todayStr}. Use Google Search to find the detailed match timeline, including all goals and ALL cards (both yellow and red cards) for all real FIFA World Cup 2026 matches played on or before ${todayStr}.
Return ONLY a valid JSON array of match objects matching this schema (no markdown):
[{"homeTeam":"Mexico","awayTeam":"South Africa","homeScore":2,"awayScore":0,"status":"completed","scorers":[{"name":"Player Name","teamId":"mexico","minute":9,"assist":"Player Name or null"}],"cards":[{"name":"Player Name","teamId":"southafrica","type":"yellow","minute":15}]}]
For teamId use lowercase country name without spaces.`;
                        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                        const geminiRes = await fetch(geminiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                tools: [{ googleSearch: {} }]
                            })
                        });
                        if (geminiRes.ok) {
                            const geminiData = await geminiRes.json();
                            const text = geminiData.candidates[0].content.parts[0].text;
                            const aiMatches = JSON.parse(extractJsonArray(text));
                            aiMatches.forEach(m => {
                                const key = `${normalizeTeamName(m.homeTeam)}-${normalizeTeamName(m.awayTeam)}`;
                                aiDetailsMap[key] = { homeScore: m.homeScore, awayScore: m.awayScore, scorers: m.scorers || [], cards: m.cards || [] };
                            });
                        }
                    } catch (aiErr) { console.error('Gemini AI Search details fetch failed:', aiErr); }
                }

                setSyncStatus('Mapping Events...');
                if (isSportsDb) {
                    finalData = data.events.map(e => {
                        const homeTeamKey = normalizeTeamName(e.strHomeTeam);
                        const awayTeamKey = normalizeTeamName(e.strAwayTeam);
                        const isCompleted = (e.intHomeScore !== null && e.intHomeScore !== undefined && e.intHomeScore !== '') || e.strStatus === 'FT' || e.strStatus === 'AP';
                        const key = `${homeTeamKey}-${awayTeamKey}`;
                        const aiDetails = aiDetailsMap[key];
                        if (aiDetails) {
                            return { homeTeamKey, awayTeamKey, homeScore: aiDetails.homeScore !== undefined ? aiDetails.homeScore : (isCompleted ? parseInt(e.intHomeScore) : null), awayScore: aiDetails.awayScore !== undefined ? aiDetails.awayScore : (isCompleted ? parseInt(e.intAwayScore) : null), status: isCompleted || aiDetails.homeScore !== undefined ? 'completed' : 'upcoming', scorers: aiDetails.scorers, cards: aiDetails.cards };
                        }
                        return { homeTeamKey, awayTeamKey, homeScore: isCompleted ? parseInt(e.intHomeScore) : null, awayScore: isCompleted ? parseInt(e.intAwayScore) : null, status: isCompleted ? 'completed' : 'upcoming', scorers: [], cards: [] };
                    });
                } else if (Array.isArray(data)) {
                    finalData = data.map(m => {
                        const homeTeamObj = teams.find(t => t.id === m.homeTeam);
                        const awayTeamObj = teams.find(t => t.id === m.awayTeam);
                        const homeTeamKey = normalizeTeamName(homeTeamObj ? homeTeamObj.name : m.homeTeam);
                        const awayTeamKey = normalizeTeamName(awayTeamObj ? awayTeamObj.name : m.awayTeam);
                        const key = `${homeTeamKey}-${awayTeamKey}`;
                        const aiDetails = aiDetailsMap[key];
                        if (aiDetails) {
                            return { ...m, homeScore: aiDetails.homeScore !== undefined ? aiDetails.homeScore : m.homeScore, awayScore: aiDetails.awayScore !== undefined ? aiDetails.awayScore : m.awayScore, status: 'completed', scorers: aiDetails.scorers, cards: aiDetails.cards };
                        }
                        return m;
                    });
                }
            }

            syncWithOnline(finalData);
            alert('Synced with online FIFA feed and AI web search details!');
        } catch (error) {
            console.error('Sync failed:', error);
            alert('Sync failed. Please check connection.');
        } finally {
            setIsSyncing(false);
            setSyncStatus('');
        }
    };

    const handleReset = () => {
        if (confirm('This will reset all matches to their original state. Proceed?')) {
            window.location.reload();
        }
    };

    const getMatchState = (match) => {
        if (!localState[match.id]) {
            return {
                homeScore: match.homeScore ?? 0,
                awayScore: match.awayScore ?? 0,
                scorers: match.scorers || [],
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
        }
        return localState[match.id];
    };

    const handleScoreChange = (matchId, side, value) => {
        setLocalState(prev => {
            const match = matches.find(m => m.id === matchId);
            const current = prev[matchId] || {
                homeScore: match.homeScore ?? 0,
                awayScore: match.awayScore ?? 0,
                scorers: match.scorers || [],
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
            return {
                ...prev,
                [matchId]: { ...current, [side]: parseInt(value) || 0 }
            };
        });
    };

    const addScorer = (matchId, teamId) => {
        setLocalState(prev => {
            const match = matches.find(m => m.id === matchId);
            const current = prev[matchId] || {
                homeScore: match.homeScore ?? 0,
                awayScore: match.awayScore ?? 0,
                scorers: match.scorers || [],
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
            return {
                ...prev,
                [matchId]: {
                    ...current,
                    scorers: [...current.scorers, { name: '', teamId, minute: '', assist: '', ownGoal: false, penalty: false }]
                }
            };
        });
    };

    const addCard = (matchId, teamId) => {
        setLocalState(prev => {
            const match = matches.find(m => m.id === matchId);
            const current = prev[matchId] || {
                homeScore: match.homeScore ?? 0,
                awayScore: match.awayScore ?? 0,
                scorers: match.scorers || [],
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
            return {
                ...prev,
                [matchId]: {
                    ...current,
                    cards: [...current.cards, { name: '', teamId, type: 'yellow', minute: '' }]
                }
            };
        });
    };

    const updateItem = (matchId, listType, index, field, value) => {
        setLocalState(prev => {
            const match = matches.find(m => m.id === matchId);
            const current = prev[matchId] || { 
                homeScore: match.homeScore ?? 0, 
                awayScore: match.awayScore ?? 0, 
                scorers: match.scorers || [], 
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
            const newList = [...current[listType]];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [matchId]: { ...current, [listType]: newList } };
        });
    };

    const removeItem = (matchId, listType, index) => {
        setLocalState(prev => {
            const match = matches.find(m => m.id === matchId);
            const current = prev[matchId] || { 
                homeScore: match.homeScore ?? 0, 
                awayScore: match.awayScore ?? 0, 
                scorers: match.scorers || [], 
                cards: match.cards || [],
                playerOfMatch: match.playerOfMatch || ''
            };
            const newList = current[listType].filter((_, i) => i !== index);
            return { ...prev, [matchId]: { ...current, [listType]: newList } };
        });
    };

    const handleUpdate = (matchId) => {
        const state = localState[matchId];
        if (state) {
            updateMatchScore(matchId, state.homeScore, state.awayScore, state.scorers, state.cards, state.playerOfMatch);
            alert('Match data updated successfully!');
        }
    };

    const handleAiUpdate = async (matchId) => {
        setAiUpdating(prev => ({ ...prev, [matchId]: true }));
        try {
            const response = await fetch('/api/request-ai-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                alert('Prompt sent to AI! Check your chat window - the AI has been activated and will search the web to update the match result.');
            } else {
                alert('Failed to request AI update: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error connecting to local server: ' + err.message);
        } finally {
            setAiUpdating(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const home = teams.find(t => t.id === m.homeTeam)?.name.toLowerCase();
            const away = teams.find(t => t.id === m.awayTeam)?.name.toLowerCase();
            const search = searchTerm.toLowerCase();
            return home?.includes(search) || away?.includes(search) || m.id.toLowerCase().includes(search);
        });
    }, [matches, teams, searchTerm]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 border-green-500/20 bg-gray-900/50 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Access</h1>
                            <p className="text-gray-500 text-sm mt-1">Authorized personnel only</p>
                        </div>
                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Admin Password"
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            />
                            <Button type="submit" className="w-full">Unlock Dashboard</Button>
                        </form>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 pb-20">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 mt-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                            {activeTab === 'results' ? 'Result Engine' : 'Team Strengths'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium italic">
                            {activeTab === 'results' ? 'Update live results, sync standings, and manage squads.' : 'Explore and analyze custom-weighted factors of competing nations.'}
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {activeTab === 'results' && (
                            <>
                                <button onClick={handleReset} className="text-[10px] text-gray-500 hover:text-white transition-colors underline decoration-gray-800">
                                    Reset to Source Data
                                </button>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}
                                >
                                    {isSyncing ? (syncStatus || 'Syncing...') : 'Sync with Live Feed'}
                                </button>
                            </>
                        )}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder={activeTab === 'results' ? 'Search teams or match ID...' : 'Search teams...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-8 max-w-sm">
                    <button
                        onClick={() => {
                            setActiveTab('results');
                            setSearchTerm('');
                        }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            activeTab === 'results'
                                ? 'bg-green-500 text-gray-950 shadow-lg shadow-green-500/10'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Result Engine
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('strengths');
                            setSearchTerm('');
                        }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            activeTab === 'strengths'
                                ? 'bg-green-500 text-gray-950 shadow-lg shadow-green-500/10'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Team Strengths
                    </button>
                </div>

                {/* TAB 1: RESULT ENGINE */}
                {activeTab === 'results' && (
                    <>
                        {/* API Settings Section */}
                        <Card className="mb-8 border-gray-800 bg-gray-900/30 p-6">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Live Feed API URL</label>
                                    <input
                                        type="text"
                                        value={feedUrl}
                                        onChange={(e) => handleFeedUrlChange(e.target.value)}
                                        placeholder="Enter Live Feed URL"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-4 md:mt-6 w-full md:w-auto">
                                    <button
                                        onClick={() => handleFeedUrlChange(DEFAULT_FEED_URL)}
                                        className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-800 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-full md:w-auto"
                                    >
                                        Reset URL
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {/* Match List */}
                        <div className="grid gap-8">
                            {filteredMatches.map(match => {
                                const homeTeam = teams.find(t => t.id === match.homeTeam);
                                const awayTeam = teams.find(t => t.id === match.awayTeam);
                                const state = getMatchState(match);

                                return (
                                    <Card key={match.id} className="p-0 overflow-hidden border-gray-800/50 bg-gray-900/30">
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row items-center gap-12 mb-8">
                                                <div className="flex-1 flex items-center justify-between gap-6">
                                                    <div className="flex items-center gap-3">
                                                        <Flag code={homeTeam?.countryCode} style={{ fontSize: '1.8rem' }} />
                                                        <span className="text-sm font-black text-white uppercase tracking-tight">{homeTeam?.name}</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={state.homeScore}
                                                        onChange={(e) => handleScoreChange(match.id, 'homeScore', e.target.value)}
                                                        className="w-16 bg-gray-950 border border-gray-800 rounded-lg text-center font-black text-2xl text-green-500 py-2 focus:border-green-500/50 outline-none"
                                                    />
                                                </div>
                                                <div className="text-gray-800 font-black text-xl italic px-4 border-x border-gray-800/50">VS</div>
                                                <div className="flex-1 flex items-center justify-between gap-6">
                                                    <input
                                                        type="number"
                                                        value={state.awayScore}
                                                        onChange={(e) => handleScoreChange(match.id, 'awayScore', e.target.value)}
                                                        className="w-16 bg-gray-950 border border-gray-800 rounded-lg text-center font-black text-2xl text-green-500 py-2 focus:border-green-500/50 outline-none"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-white uppercase tracking-tight">{awayTeam?.name}</span>
                                                        <Flag code={awayTeam?.countryCode} style={{ fontSize: '1.8rem' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-800">
                                                {[homeTeam, awayTeam].map((team) => {
                                                    const opponent = team?.id === homeTeam?.id ? awayTeam : homeTeam;
                                                    return (
                                                        <div key={team?.id} className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{team?.name} Scorers</h4>
                                                                <button onClick={() => addScorer(match.id, team.id)} className="p-1 hover:bg-gray-800 rounded-md transition-colors">
                                                                    <Plus className="w-4 h-4 text-green-500" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {state.scorers.filter(s => s.teamId === team?.id).map((scorer, sIdx) => {
                                                                    const globalIndex = state.scorers.findIndex(gs => gs === scorer);
                                                                    return (
                                                                        <div key={sIdx} className="p-3 bg-gray-950/40 border border-gray-800/80 rounded-xl space-y-2">
                                                                            <div className="flex gap-2">
                                                                                <select value={scorer.name} onChange={(e) => updateItem(match.id, 'scorers', globalIndex, 'name', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-green-500/50 font-bold">
                                                                                    <option value="">Select Scorer</option>
                                                                                    {(scorer.ownGoal ? opponent : team)?.squad?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                                                </select>
                                                                                {(!scorer.ownGoal && !scorer.penalty) && (
                                                                                    <select value={scorer.assist || ''} onChange={(e) => updateItem(match.id, 'scorers', globalIndex, 'assist', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/50">
                                                                                        <option value="">Select Assist</option>
                                                                                        {team?.squad?.filter(p => p.name !== scorer.name).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                                                    </select>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-3 pt-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Type:</span>
                                                                                    <select 
                                                                                        value={scorer.ownGoal ? 'og' : (scorer.penalty ? 'pen' : 'regular')} 
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            updateItem(match.id, 'scorers', globalIndex, 'ownGoal', val === 'og');
                                                                                            updateItem(match.id, 'scorers', globalIndex, 'penalty', val === 'pen');
                                                                                            if (val === 'og' || val === 'pen') {
                                                                                                updateItem(match.id, 'scorers', globalIndex, 'assist', '');
                                                                                            }
                                                                                        }} 
                                                                                        className={`w-24 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${scorer.ownGoal ? 'text-red-400' : (scorer.penalty ? 'text-yellow-500' : 'text-gray-400')}`}
                                                                                    >
                                                                                        <option value="regular">Regular</option>
                                                                                        <option value="og">OG</option>
                                                                                        <option value="pen">PEN</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Min:</span>
                                                                                    <input type="text" placeholder="Min" value={scorer.minute} onChange={(e) => updateItem(match.id, 'scorers', globalIndex, 'minute', e.target.value)} className="w-14 bg-gray-950 border border-gray-800 rounded-lg py-1 text-center text-xs text-gray-300" />
                                                                                    <button onClick={() => removeItem(match.id, 'scorers', globalIndex)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group ml-1">
                                                                                        <Trash2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-500" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
 
                                                            <div className="flex justify-between items-center pt-4">
                                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{team?.name} Cards</h4>
                                                                <button onClick={() => addCard(match.id, team.id)} className="p-1 hover:bg-gray-800 rounded-md transition-colors">
                                                                    <Plus className="w-4 h-4 text-orange-500" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {state.cards.filter(c => c.teamId === team?.id).map((card, cIdx) => {
                                                                    const globalIndex = state.cards.findIndex(gc => gc === card);
                                                                    return (
                                                                        <div key={cIdx} className="p-3 bg-gray-950/40 border border-gray-800/80 rounded-xl space-y-2">
                                                                            <div className="flex gap-2">
                                                                                <select value={card.name} onChange={(e) => updateItem(match.id, 'cards', globalIndex, 'name', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500/50">
                                                                                    <option value="">Select Player</option>
                                                                                    {team?.squad?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-3 pt-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Card:</span>
                                                                                    <select value={card.type} onChange={(e) => updateItem(match.id, 'cards', globalIndex, 'type', e.target.value)} className={`w-24 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${card.type === 'red' ? 'text-red-500' : 'text-yellow-400'}`}>
                                                                                        <option value="yellow">Yellow</option>
                                                                                        <option value="red">Red</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Min:</span>
                                                                                    <input type="text" placeholder="Min" value={card.minute} onChange={(e) => updateItem(match.id, 'cards', globalIndex, 'minute', e.target.value)} className="w-14 bg-gray-950 border border-gray-800 rounded-lg py-1 text-center text-xs text-gray-300" />
                                                                                    <button onClick={() => removeItem(match.id, 'cards', globalIndex)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group ml-1">
                                                                                        <Trash2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-500" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Player of the Match Selection */}
                                            <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Player of the Match</span>
                                                </div>
                                                <select
                                                    value={state.playerOfMatch || ''}
                                                    onChange={(e) => setLocalState(prev => {
                                                        const current = prev[match.id] || { homeScore: match.homeScore ?? 0, awayScore: match.awayScore ?? 0, scorers: match.scorers || [], cards: match.cards || [], playerOfMatch: match.playerOfMatch || '' };
                                                        return { ...prev, [match.id]: { ...current, playerOfMatch: e.target.value } };
                                                    })}
                                                    className="w-full sm:w-72 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 font-bold uppercase"
                                                >
                                                    <option value="">Select POTM</option>
                                                    {homeTeam && (
                                                        <optgroup label={homeTeam.name}>
                                                            {homeTeam.squad?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                        </optgroup>
                                                    )}
                                                    {awayTeam && (
                                                        <optgroup label={awayTeam.name}>
                                                            {awayTeam.squad?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="mt-8 flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleAiUpdate(match.id)}
                                                    disabled={aiUpdating[match.id]}
                                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
                                                        aiUpdating[match.id]
                                                            ? 'bg-gray-800 text-gray-500 border-gray-800 cursor-not-allowed'
                                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 active:scale-[0.98]'
                                                    }`}
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    {aiUpdating[match.id] ? 'Activating AI...' : 'Update via AI'}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(match.id)}
                                                    className="flex items-center gap-2 px-8 py-2.5 bg-green-500 text-gray-950 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Update Match
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* TAB 2: TEAM STRENGTHS */}
                {activeTab === 'strengths' && (
                    <>
                        <Card className="border-gray-800 bg-gray-900/30 p-6 overflow-hidden shadow-2xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-2">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Team Strengths Dashboard</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">FIFA Rank: 25% | Squad: 20% | Form: 15% | Cohesion: 15% | Continental: 7.5% | History: 7.5% | Recent WC: 5% | Adaptability: 5% (Hosts USA, Canada, Mexico receive +10% overall Power Score boost)</p>
                            </div>
                            <Badge variant="success" className="bg-green-500/10 text-green-400 border border-green-500/20 font-black">
                                48 Teams Configured
                            </Badge>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                        <th className="px-3 py-3">Rank</th>
                                        <th className="px-3 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Team {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('fifaRanking')}>
                                            <div className="flex items-center justify-center gap-1">
                                                FIFA Rank {sortField === 'fifaRanking' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('fifaScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                FIFA (25%) {sortField === 'fifaScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('marketValue')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Squad Value (€M) {sortField === 'marketValue' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('squadScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Squad (20%) {sortField === 'squadScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('formScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Form (15%) {sortField === 'formScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('cohesionScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Cohesion (15%) {sortField === 'cohesionScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('continentalScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Continental (7.5%) {sortField === 'continentalScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('historyScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                History (7.5%) {sortField === 'historyScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('worldCupRecentScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Recent WC (5%) {sortField === 'worldCupRecentScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('adaptabilityScore')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Adaptability (5%) {sortField === 'adaptabilityScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors text-green-400 font-bold" onClick={() => handleSort('powerScore')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Power Score {sortField === 'powerScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />)}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-right text-gray-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-850/60">
                                    {filteredAndSortedTeams.map((team, idx) => {
                                        const isEditing = editingTeamId === team.id;
                                        return (
                                            <tr key={team.id} className={`hover:bg-gray-950/40 transition-colors ${isEditing ? 'bg-green-500/5' : ''}`}>
                                                <td className="px-3 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-3 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <Flag code={team.countryCode} style={{ fontSize: '1.2rem' }} />
                                                        <span className="font-bold text-white uppercase">{team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-400 font-bold">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editingStrengths.fifaRanking || ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, fifaRanking: parseInt(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500 font-bold"
                                                        />
                                                    ) : (
                                                        `#${team.fifaRanking}`
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingStrengths.fifaScore !== undefined ? editingStrengths.fifaScore : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, fifaScore: parseFloat(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        team.fifaScore.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={editingStrengths.marketValue !== undefined ? editingStrengths.marketValue : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, marketValue: parseFloat(e.target.value) || 0 }))}
                                                            className="w-20 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        `€${team.marketValue?.toFixed(1) || '0.0'}M`
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingStrengths.squadScore !== undefined ? editingStrengths.squadScore : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, squadScore: parseFloat(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        team.squadScore.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-500 font-medium">{team.formScore.toFixed(2)}</td>
                                                <td className="px-3 py-3.5 text-center text-gray-500 font-medium">{team.cohesionScore.toFixed(2)}</td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingStrengths.continentalScore !== undefined ? editingStrengths.continentalScore : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, continentalScore: parseFloat(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        team.continentalScore.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingStrengths.historyScore !== undefined ? editingStrengths.historyScore : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, historyScore: parseFloat(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        team.historyScore.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-300 font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingStrengths.worldCupRecentScore !== undefined ? editingStrengths.worldCupRecentScore : ''}
                                                            onChange={(e) => setEditingStrengths(prev => ({ ...prev, worldCupRecentScore: parseFloat(e.target.value) || 0 }))}
                                                            className="w-16 bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500"
                                                        />
                                                    ) : (
                                                        team.worldCupRecentScore.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-gray-500 font-medium">{team.adaptabilityScore.toFixed(2)}</td>
                                                <td className="px-3 py-3.5 text-right">
                                                    <div className="flex flex-col items-end justify-center">
                                                        <span className="font-black text-sm text-green-400">{team.powerScore.toFixed(2)}</span>
                                                        {team.isHostBoosted && (
                                                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mt-0.5" title="10% host nation advantage applied">
                                                                Host Boosted
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-right">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleSaveStrengths(team.id, team.name)}
                                                                disabled={isSavingStrengths}
                                                                className="p-1 hover:bg-green-500/10 rounded transition-colors text-green-400 disabled:opacity-50"
                                                                title="Save"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEditStrengths}
                                                                className="p-1 hover:bg-red-500/10 rounded transition-colors text-red-400"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartEditStrengths(team)}
                                                            className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* CLASSICAL TEAMS POWER SCORES */}
                    <Card className="border-gray-800 bg-gray-900/30 p-6 overflow-hidden shadow-2xl mt-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-2">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Classical Teams Power Scores</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Calculated strength metrics for historical squads injected into the tournament.</p>
                            </div>
                            <Badge variant="info" className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black">
                                {sortedClassicalTeams.length} Classical Teams
                            </Badge>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                        <th className="px-3 py-3 w-16">Rank</th>
                                        <th className="px-3 py-3">Team</th>
                                        <th className="px-3 py-3 text-center">Formation</th>
                                        <th className="px-3 py-3">Notable Players</th>
                                        <th className="px-3 py-3">Base Country</th>
                                        <th className="px-3 py-3 text-right text-green-400 font-bold">Power Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-850/60">
                                    {sortedClassicalTeams.map((cTeam, idx) => (
                                        <tr key={cTeam.id} className="hover:bg-gray-950/40 transition-colors">
                                            <td className="px-3 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                            <td className="px-3 py-3.5">
                                                <span className="font-bold text-white uppercase">{cTeam.name}</span>
                                            </td>
                                            <td className="px-3 py-3.5 text-center text-gray-300 font-medium">{cTeam.formation}</td>
                                            <td className="px-3 py-3.5 text-gray-400 italic max-w-xs truncate" title={cTeam.description}>
                                                {cTeam.notablePlayers || 'Roster configured'}
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {cTeam.parentCountryCode && <Flag code={cTeam.parentCountryCode} style={{ fontSize: '1rem' }} />}
                                                    <span className="text-gray-300">{cTeam.parentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 text-right font-black text-sm text-green-400">
                                                {cTeam.powerScore.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    </>
                )}
            </main>
        </div>
    );
};

export default Admin;
