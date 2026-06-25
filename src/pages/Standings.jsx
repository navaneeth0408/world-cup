import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Flag from '../components/ui/Flag';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Trophy, Goal, Hand, Shield, Users, BarChart3, AlertCircle, Activity, Sparkles } from 'lucide-react';
import lineupsData from '../data/lineups.json';

const normalizeName = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
};

const Standings = () => {
    const { teams, matches, loading } = useTournament();
    const [activeTab, setActiveTab] = useState('standings');
    const [selectedStatModal, setSelectedStatModal] = useState(null);
    const scrollContainerRef = useRef(null);

    const sections = [
        { id: 'standings', name: 'Standings', icon: Trophy },
        { id: 'scorers', name: 'Top Scorers', icon: Goal },
        { id: 'assists', name: 'Assists', icon: Hand },
        { id: 'discipline', name: 'Discipline', icon: AlertCircle },
        { id: 'goalkeepers', name: 'Goalkeepers', icon: Shield },
        { id: 'tournament-summary', name: 'Overview', icon: Activity },
        { id: 'team-stats', name: 'Team Stats', icon: BarChart3 },
    ];

    const groupStandings = useMemo(() => {
        const standings = {};
        const groups = 'ABCDEFGHIJKL'.split('');

        groups.forEach(g => {
            const groupTeams = teams.filter(t => t.group === g).map(t => ({
                ...t,
                played: 0,
                w: 0,
                d: 0,
                l: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                pts: 0
            }));

            const groupMatches = matches.filter(m => m.group === g && m.status === 'completed');

            groupMatches.forEach(m => {
                const home = groupTeams.find(t => t.id === m.homeTeam);
                const away = groupTeams.find(t => t.id === m.awayTeam);

                if (home && away) {
                    home.played++;
                    away.played++;
                    home.gf += m.homeScore;
                    home.ga += m.awayScore;
                    away.gf += m.awayScore;
                    away.ga += m.homeScore;

                    if (m.homeScore > m.awayScore) {
                        home.w++;
                        home.pts += 3;
                        away.l++;
                    } else if (m.homeScore < m.awayScore) {
                        away.w++;
                        away.pts += 3;
                        home.l++;
                    } else {
                        home.d++;
                        away.d++;
                        home.pts += 1;
                        away.pts += 1;
                    }
                }
            });

            groupTeams.forEach(t => {
                t.gd = t.gf - t.ga;
            });

            standings[g] = groupTeams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        });

        return standings;
    }, [teams, matches]);

    const getTeamGoalkeeper = (team) => {
        if (!team) return 'Unknown GK';
        
        // Find starting GK in lineupsData
        const normalizedTeamName = normalizeName(team.name);
        const lineupInfo = lineupsData?.teams?.find(
            t => normalizeName(t.country_name) === normalizedTeamName
        );
        
        if (lineupInfo?.starting_lineup?.GK) {
            const gkName = lineupInfo.starting_lineup.GK;
            // Match with squad to keep spelling/accents consistent with current_squads.json
            if (team.squad) {
                const normalizedGkName = normalizeName(gkName);
                const squadPlayer = team.squad.find(p => normalizeName(p.name) === normalizedGkName);
                if (squadPlayer) return squadPlayer.name;
            }
            return gkName;
        }

        // Fallback to squad logic
        if (!team.squad) return 'Unknown GK';
        const gk = team.squad.find(p => p.position === 'GK' && p.number === 1) || team.squad.find(p => p.position === 'GK');
        return gk ? gk.name : 'Unknown GK';
    };

    const completedMatches = useMemo(() => {
        return matches.filter(m => m.status === 'completed');
    }, [matches]);

    const topScorers = useMemo(() => {
        const players = {};

        completedMatches.forEach(m => {
            const scorers = m.scorers || [];
            scorers.forEach(s => {
                if (!s.name || s.name.includes('(OG)') || s.name.includes('Own Goal') || s.ownGoal) return;
                const team = teams.find(t => t.id === s.teamId);
                const teamName = team ? team.name : s.teamId;
                const teamCode = team ? team.countryCode : '';
                const key = `${s.name}-${s.teamId}`;

                if (!players[key]) {
                    players[key] = {
                        name: s.name,
                        team: teamName,
                        teamCode: teamCode,
                        goals: 0,
                        assists: 0
                    };
                }
                players[key].goals += 1;
            });

            // Track assists from the scorer's assist field
            scorers.forEach(s => {
                if (!s.assist || s.name.includes('(OG)') || s.name.includes('Own Goal') || s.ownGoal) return;
                const team = teams.find(t => t.id === s.teamId);
                const teamName = team ? team.name : s.teamId;
                const teamCode = team ? team.countryCode : '';
                const key = `${s.assist}-${s.teamId}`;

                if (!players[key]) {
                    players[key] = {
                        name: s.assist,
                        team: teamName,
                        teamCode: teamCode,
                        goals: 0,
                        assists: 0
                    };
                }
                players[key].assists += 1;
            });
        });

        return Object.values(players)
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }))
            .slice(0, 10);
    }, [completedMatches, teams]);

    const topAssists = useMemo(() => {
        const players = {};

        completedMatches.forEach(m => {
            const scorers = m.scorers || [];
            scorers.forEach(s => {
                if (!s.assist || (s.name && (s.name.includes('(OG)') || s.name.includes('Own Goal') || s.ownGoal))) return;
                const team = teams.find(t => t.id === s.teamId);
                const teamName = team ? team.name : s.teamId;
                const teamCode = team ? team.countryCode : '';
                const key = `${s.assist}-${s.teamId}`;

                if (!players[key]) {
                    players[key] = {
                        name: s.assist,
                        team: teamName,
                        teamCode: teamCode,
                        assists: 0
                    };
                }
                players[key].assists += 1;
            });
        });

        return Object.values(players)
            .sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }))
            .slice(0, 10);
    }, [completedMatches, teams]);

    const discipline = useMemo(() => {
        const yellowCards = {};
        const redCards = {};

        completedMatches.forEach(m => {
            const cards = m.cards || [];
            cards.forEach(c => {
                if (!c.name) return;
                const team = teams.find(t => t.id === c.teamId);
                const teamName = team ? team.name : c.teamId;
                const key = `${c.name}-${c.teamId}`;

                if (c.type === 'red') {
                    if (!redCards[key]) {
                        redCards[key] = {
                            name: c.name,
                            team: teamName,
                            count: 0
                        };
                    }
                    redCards[key].count += 1;
                } else if (c.type === 'yellow') {
                    if (!yellowCards[key]) {
                        yellowCards[key] = {
                            name: c.name,
                            team: teamName,
                            count: 0
                        };
                    }
                    yellowCards[key].count += 1;
                }
            });
        });

        const sortedYellow = Object.values(yellowCards)
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
            .slice(0, 6);

        const sortedRed = Object.values(redCards)
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
            .slice(0, 6);

        return { yellow: sortedYellow, red: sortedRed };
    }, [completedMatches, teams]);

    const goalkeepers = useMemo(() => {
        const gkStats = {};

        completedMatches.forEach(m => {
            const homeTeam = teams.find(t => t.id === m.homeTeam);
            const awayTeam = teams.find(t => t.id === m.awayTeam);

            if (homeTeam && m.awayScore === 0) {
                if (!gkStats[homeTeam.id]) {
                    const gkName = getTeamGoalkeeper(homeTeam);
                    gkStats[homeTeam.id] = {
                        name: gkName,
                        team: homeTeam.name,
                        teamCode: homeTeam.countryCode,
                        cleanSheets: 0
                    };
                }
                gkStats[homeTeam.id].cleanSheets += 1;
            }

            if (awayTeam && m.homeScore === 0) {
                if (!gkStats[awayTeam.id]) {
                    const gkName = getTeamGoalkeeper(awayTeam);
                    gkStats[awayTeam.id] = {
                        name: gkName,
                        team: awayTeam.name,
                        teamCode: awayTeam.countryCode,
                        cleanSheets: 0
                    };
                }
                gkStats[awayTeam.id].cleanSheets += 1;
            }
        });

        return Object.values(gkStats)
            .sort((a, b) => b.cleanSheets - a.cleanSheets || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }))
            .slice(0, 10);
    }, [completedMatches, teams]);

    const allTeamStats = useMemo(() => {
        const stats = {};

        teams.forEach(t => {
            stats[t.id] = {
                id: t.id,
                name: t.name,
                countryCode: t.countryCode,
                goalsScored: 0,
                goalsConceded: 0,
                matchesPlayed: 0,
                totalPossession: 0,
                totalPassAccuracy: 0
            };
        });

        completedMatches.forEach((m, idx) => {
            const home = stats[m.homeTeam];
            const away = stats[m.awayTeam];

            if (home && away) {
                home.matchesPlayed += 1;
                away.matchesPlayed += 1;
                home.goalsScored += m.homeScore;
                home.goalsConceded += m.awayScore;
                away.goalsScored += m.awayScore;
                away.goalsConceded += m.homeScore;

                const rankH = teams.find(t => t.id === m.homeTeam)?.fifaRanking || 50;
                const rankA = teams.find(t => t.id === m.awayTeam)?.fifaRanking || 50;

                const diff = rankA - rankH;
                const diffPoss = diff * 0.4;
                const offsetPoss = ((idx * 7) % 8) - 4; // deterministic offset between -4 and 4
                const offsetPassH = ((idx * 13) % 4) - 2; // deterministic offset between -2 and 2
                const offsetPassA = ((idx * 17) % 4) - 2;

                const homePoss = Math.max(30, Math.min(70, 50 + diffPoss + offsetPoss));
                const awayPoss = 100 - homePoss;

                const homePass = Math.max(65, Math.min(96, 90 - rankH * 0.3 + offsetPassH));
                const awayPass = Math.max(65, Math.min(96, 90 - rankA * 0.3 + offsetPassA));

                home.totalPossession += homePoss;
                home.totalPassAccuracy += homePass;
                away.totalPossession += awayPoss;
                away.totalPassAccuracy += awayPass;
            }
        });

        return Object.values(stats);
    }, [completedMatches, teams]);

    const teamPerformance = useMemo(() => {
        const activeTeams = allTeamStats.filter(t => t.matchesPlayed > 0);

        if (activeTeams.length === 0) {
            return {
                mostGoals: { name: '-', value: 0 },
                bestDefense: { name: '-', value: '0 Goals Conceded' },
                bestPossession: { name: '-', value: '0%' },
                bestPassAccuracy: { name: '-', value: '0%' }
            };
        }

        const mostGoalsTeam = [...activeTeams].sort((a, b) => b.goalsScored - a.goalsScored || a.name.localeCompare(b.name))[0];
        const bestDefenseTeam = [...activeTeams].sort((a, b) => {
            const avgA = a.goalsConceded / a.matchesPlayed;
            const avgB = b.goalsConceded / b.matchesPlayed;
            return avgA - avgB || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name);
        })[0];
        const bestPossessionTeam = [...activeTeams].sort((a, b) => {
            const avgA = a.totalPossession / a.matchesPlayed;
            const avgB = b.totalPossession / b.matchesPlayed;
            return avgB - avgA || a.name.localeCompare(b.name);
        })[0];
        const bestPassAccuracyTeam = [...activeTeams].sort((a, b) => {
            const avgA = a.totalPassAccuracy / a.matchesPlayed;
            const avgB = b.totalPassAccuracy / b.matchesPlayed;
            return avgB - avgA || a.name.localeCompare(b.name);
        })[0];

        return {
            mostGoals: {
                name: mostGoalsTeam.name.toUpperCase(),
                value: mostGoalsTeam.goalsScored
            },
            bestDefense: {
                name: bestDefenseTeam.name.toUpperCase(),
                value: `${bestDefenseTeam.goalsConceded} Goals Conceded`
            },
            bestPossession: {
                name: bestPossessionTeam.name.toUpperCase(),
                value: `${Math.round(bestPossessionTeam.totalPossession / bestPossessionTeam.matchesPlayed)}%`
            },
            bestPassAccuracy: {
                name: bestPassAccuracyTeam.name.toUpperCase(),
                value: `${Math.round(bestPassAccuracyTeam.totalPassAccuracy / bestPassAccuracyTeam.matchesPlayed)}%`
            }
        };
    }, [allTeamStats]);

    const top10List = useMemo(() => {
        if (!selectedStatModal) return [];
        const activeTeams = allTeamStats.filter(t => t.matchesPlayed > 0);

        if (selectedStatModal === 'goals') {
            return [...activeTeams]
                .sort((a, b) => b.goalsScored - a.goalsScored || a.name.localeCompare(b.name))
                .slice(0, 10)
                .map(t => ({
                    ...t,
                    statValue: t.goalsScored
                }));
        }
        if (selectedStatModal === 'defense') {
            return [...activeTeams]
                .sort((a, b) => {
                    const avgA = a.goalsConceded / a.matchesPlayed;
                    const avgB = b.goalsConceded / b.matchesPlayed;
                    return avgA - avgB || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name);
                })
                .slice(0, 10)
                .map(t => ({
                    ...t,
                    statValue: `${(t.goalsConceded / t.matchesPlayed).toFixed(2)} Avg (${t.goalsConceded} GA)`
                }));
        }
        if (selectedStatModal === 'possession') {
            return [...activeTeams]
                .sort((a, b) => {
                    const avgA = a.totalPossession / a.matchesPlayed;
                    const avgB = b.totalPossession / b.matchesPlayed;
                    return avgB - avgA || a.name.localeCompare(b.name);
                })
                .slice(0, 10)
                .map(t => ({
                    ...t,
                    statValue: `${Math.round(t.totalPossession / t.matchesPlayed)}%`
                }));
        }
        if (selectedStatModal === 'passAccuracy') {
            return [...activeTeams]
                .sort((a, b) => {
                    const avgA = a.totalPassAccuracy / a.matchesPlayed;
                    const avgB = b.totalPassAccuracy / b.matchesPlayed;
                    return avgB - avgA || a.name.localeCompare(b.name);
                })
                .slice(0, 10)
                .map(t => ({
                    ...t,
                    statValue: `${Math.round(t.totalPassAccuracy / t.matchesPlayed)}%`
                }));
        }
        return [];
    }, [selectedStatModal, allTeamStats]);

    const tournamentSummaryStats = useMemo(() => {
        let totalGoals = 0;
        let totalYellowCards = 0;
        let totalRedCards = 0;
        let totalPenaltiesConceded = 0;
        let totalOwnGoals = 0;
        let totalFoulsConceded = 0;

        completedMatches.forEach(m => {
            totalGoals += (m.homeScore || 0) + (m.awayScore || 0);

            const cards = m.cards || [];
            cards.forEach(c => {
                if (c.type === 'yellow') totalYellowCards++;
                if (c.type === 'red') totalRedCards++;
            });

            const scorers = m.scorers || [];
            scorers.forEach(s => {
                if (s.penalty) totalPenaltiesConceded++;
                if (s.ownGoal) totalOwnGoals++;
            });

            if (m.stats && m.stats.fouls) {
                totalFoulsConceded += (m.stats.fouls[0] || 0) + (m.stats.fouls[1] || 0);
            }
        });

        return {
            totalGoals,
            totalYellowCards,
            totalRedCards,
            totalPenaltiesConceded,
            totalOwnGoals,
            totalFoulsConceded,
            matchesPlayed: completedMatches.length
        };
    }, [completedMatches]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-950 pb-20">
            <Navbar />

            {/* Header */}
            <header className="pt-12 pb-8 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">
                        Tournament <span className="text-green-400 text-glow">Stats</span>
                    </h1>
                    <p className="text-gray-400 font-medium">Live statistics from the 2026 FIFA World Cup</p>
                </motion.div>
            </header>

            {/* Sticky Navigation Tabs */}
            <div className="sticky top-16 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 px-4 py-3">
                <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === section.id
                                ? 'bg-green-500 text-gray-950'
                                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                                }`}
                        >
                            <section.icon className="w-3.5 h-3.5" />
                            {section.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12 space-y-24" ref={scrollContainerRef}>

                {/* Section 1: Standings */}
                <section id="standings" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Trophy className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Group Standings</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Object.entries(groupStandings).map(([group, groupTeams]) => (
                            <motion.div
                                key={group}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card className="p-0 overflow-hidden border-gray-800 bg-gray-900/50 hover:border-green-500/30 transition-colors">
                                    <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                                        <h3 className="font-black text-white italic">GROUP {group}</h3>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-[#22c55e]" title="Qualified" />
                                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" title="Best 3rd place contender" />
                                            <div className="w-2 h-2 rounded-full bg-[#ef4444]" title="Eliminated" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-gray-800 uppercase font-black tracking-widest">
                                                    <th className="px-4 py-2">Pos</th>
                                                    <th className="px-2 py-2">Team</th>
                                                    <th className="px-2 py-2 text-center">P</th>
                                                    <th className="px-2 py-2 text-center">GD</th>
                                                    <th className="px-4 py-2 text-center">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupTeams.map((team, idx) => {
                                                    const borderLeftStyle = idx < 2
                                                        ? '2px solid #22c55e'
                                                        : idx === 2
                                                            ? '2px solid #f59e0b'
                                                            : '2px solid #ef4444';

                                                    const bgClass = idx < 2
                                                        ? 'bg-green-900/20'
                                                        : idx === 2
                                                            ? 'bg-amber-500/5'
                                                            : 'bg-red-500/5';

                                                    return (
                                                        <tr key={team.id} className={`border-b border-gray-800/50 last:border-0 ${bgClass}`}>
                                                            <td 
                                                                className="px-4 py-3 font-bold text-gray-400"
                                                                style={{ borderLeft: borderLeftStyle }}
                                                            >
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-2 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Flag code={team.countryCode} />
                                                                    <span className="font-bold text-white truncate max-w-[80px]">{team.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-3 text-center text-gray-400">{team.played}</td>
                                                            <td className="px-2 py-3 text-center text-gray-400">{(team.gd > 0 ? '+' : '') + team.gd}</td>
                                                            <td className="px-4 py-3 text-center font-black text-green-400">{team.pts}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Qualification Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span>Qualify to Round of 32</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        <span>Best 8 third-place teams qualify</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                        <span>Eliminated</span>
                      </div>
                    </div>
                </section>

                {/* Section 2: Top Scorers */}
                <section id="scorers" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Goal className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Golden Boot Race</h2>
                    </div>
                    <Card className="p-0 overflow-hidden border-gray-800 bg-gray-900/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4">Team</th>
                                        <th className="px-6 py-4 text-center">Goals</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {topScorers.map((player) => (
                                        <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-black text-gray-500 whitespace-nowrap">
                                                {player.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : `#${player.rank}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-white group-hover:text-green-400 transition-colors">{player.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Flag code={player.teamCode} />
                                                    <span className="text-sm text-gray-400">{player.team}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 rounded-full font-black text-sm">
                                                    {player.goals}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {topScorers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No scorers recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* Section 3: Assists */}
                <section id="assists" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Hand className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Most Assists</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="p-0 overflow-hidden border-gray-800 bg-gray-900/50">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4 text-center">Assists</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {topAssists.map((player) => (
                                        <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-black text-gray-500">#{player.rank}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Flag code={player.teamCode} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white leading-tight">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500">{player.team}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xl font-black text-white">{player.assists}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {topAssists.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No assists recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                        <div className="flex flex-col justify-center gap-6">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8">
                                <h4 className="text-sm font-black text-green-400 uppercase tracking-widest mb-2 text-glow">Stat Fact</h4>
                                <p className="text-gray-400 leading-relaxed">
                                    {topAssists.length > 0 ? (
                                        `${topAssists[0].name} has registered ${topAssists[0].assists} assists so far this tournament, leading the playmaking charts.`
                                    ) : (
                                        "Kevin De Bruyne has averaged 1.2 big chances created per 90 minutes so far this tournament, the highest among all midfielders with at least 180 minutes played."
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Discipline */}
                <section id="discipline" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <AlertCircle className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Disciplinary Record</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-gray-800 bg-gray-900/50">
                            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-800">
                                <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
                                <h3 className="font-black text-white uppercase tracking-wider text-sm">Most Yellow Cards</h3>
                            </div>
                            <div className="space-y-4">
                                {discipline.yellow.map((player) => (
                                    <div key={`${player.name}-${player.team}`} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-white text-sm">{player.name}</p>
                                            <p className="text-[10px] text-gray-500">{player.team}</p>
                                        </div>
                                        <span className="text-yellow-400 font-black text-lg">x{player.count}</span>
                                    </div>
                                ))}
                                {discipline.yellow.length === 0 && (
                                    <p className="text-gray-500 text-sm italic text-center py-4">No yellow cards recorded yet.</p>
                                )}
                            </div>
                        </Card>
                        <Card className="border-gray-800 bg-gray-900/50">
                            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-800">
                                <div className="w-3 h-4 bg-red-500 rounded-sm" />
                                <h3 className="font-black text-white uppercase tracking-wider text-sm">Most Red Cards</h3>
                            </div>
                            <div className="space-y-4">
                                {discipline.red.map((player) => (
                                    <div key={`${player.name}-${player.team}`} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-white text-sm">{player.name}</p>
                                            <p className="text-[10px] text-gray-500">{player.team}</p>
                                        </div>
                                        <span className="text-red-500 font-black text-lg">x{player.count}</span>
                                    </div>
                                ))}
                                {discipline.red.length === 0 && (
                                    <p className="text-gray-500 text-sm italic text-center py-4">No red cards yet.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Section 5: Goalkeepers */}
                <section id="goalkeepers" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Golden Glove Race</h2>
                    </div>
                    <Card className="p-0 overflow-hidden border-gray-800 bg-gray-900/50">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Goalkeeper</th>
                                    <th className="px-6 py-4">Team</th>
                                    <th className="px-6 py-4 text-center">Clean Sheets</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {goalkeepers.map((gk) => (
                                    <tr key={`${gk.name}-${gk.team}`} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-black text-gray-500">#{gk.rank}</td>
                                        <td className="px-6 py-4 font-bold text-white">{gk.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Flag code={gk.teamCode} />
                                                <span className="text-sm text-gray-400">{gk.team}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {Array.from({ length: gk.cleanSheets }).map((_, i) => (
                                                    <Shield key={i} className="w-3 h-3 text-green-400 fill-green-400/20" />
                                                ))}
                                                <span className="ml-2 font-black text-white">{gk.cleanSheets}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {goalkeepers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                            No clean sheets recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </section>

                {/* Section 5.5: Tournament Overview Stats */}
                <section id="tournament-summary" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Tournament Summary</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-green-500/20 transition-all duration-300">
                                <div>
                                    <Goal className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Goals</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalGoals}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                        {tournamentSummaryStats.matchesPlayed > 0 ? `${(tournamentSummaryStats.totalGoals / tournamentSummaryStats.matchesPlayed).toFixed(2)} / match` : '0.00 / match'}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-yellow-500/20 transition-all duration-300">
                                <div>
                                    <div className="w-4 h-5.5 bg-yellow-400 rounded-sm mx-auto mb-3 border border-yellow-300/30 shadow-md shadow-yellow-500/20" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Yellow Cards</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalYellowCards}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                        {tournamentSummaryStats.matchesPlayed > 0 ? `${(tournamentSummaryStats.totalYellowCards / tournamentSummaryStats.matchesPlayed).toFixed(2)} / match` : '0.00 / match'}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
                                <div>
                                    <div className="w-4 h-5.5 bg-red-500 rounded-sm mx-auto mb-3 border border-red-400/30 shadow-md shadow-red-500/20" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Red Cards</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalRedCards}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                        {tournamentSummaryStats.matchesPlayed > 0 ? `${(tournamentSummaryStats.totalRedCards / tournamentSummaryStats.matchesPlayed).toFixed(2)} / match` : '0.00 / match'}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
                                <div>
                                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Penalties</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalPenaltiesConceded}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Conceded</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300">
                                <div>
                                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Own Goals</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalOwnGoals}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Accidental</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between hover:border-blue-500/20 transition-all duration-300">
                                <div>
                                    <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Fouls</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalFoulsConceded}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                        {tournamentSummaryStats.matchesPlayed > 0 ? `${(tournamentSummaryStats.totalFoulsConceded / tournamentSummaryStats.matchesPlayed).toFixed(1)} / match` : '0.0 / match'}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Section 6: Team Stats Summary */}
                <section id="team-stats" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Team Performance</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div whileHover={{ y: -5 }}>
                            <Card 
                                onClick={() => setSelectedStatModal('goals')}
                                className="text-center p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-green-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Goal className="w-8 h-8 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Most Goals Scored</p>
                                <h4 className="text-2xl font-black text-white mb-2">{teamPerformance.mostGoals.name}</h4>
                                <p className="text-3xl font-black text-green-400">{teamPerformance.mostGoals.value}</p>
                                <span className="text-[9px] text-green-500/80 font-black uppercase tracking-wider mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card 
                                onClick={() => setSelectedStatModal('defense')}
                                className="text-center p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-blue-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Best Defense</p>
                                <h4 className="text-2xl font-black text-white mb-2">{teamPerformance.bestDefense.name}</h4>
                                <p className="text-sm text-gray-400">{teamPerformance.bestDefense.value}</p>
                                <span className="text-[9px] text-blue-500/80 font-black uppercase tracking-wider mt-7 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card 
                                onClick={() => setSelectedStatModal('possession')}
                                className="text-center p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-purple-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Activity className="w-8 h-8 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Avg Possession</p>
                                <h4 className="text-2xl font-black text-white mb-2">{teamPerformance.bestPossession.name}</h4>
                                <p className="text-3xl font-black text-purple-400">{teamPerformance.bestPossession.value}</p>
                                <span className="text-[9px] text-purple-500/80 font-black uppercase tracking-wider mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card 
                                onClick={() => setSelectedStatModal('passAccuracy')}
                                className="text-center p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-yellow-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Pass Accuracy</p>
                                <h4 className="text-2xl font-black text-white mb-2">{teamPerformance.bestPassAccuracy.name}</h4>
                                <p className="text-3xl font-black text-yellow-400">{teamPerformance.bestPassAccuracy.value}</p>
                                <span className="text-[9px] text-yellow-500/80 font-black uppercase tracking-wider mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Top 10 Statistics Modal */}
                <Modal
                    isOpen={!!selectedStatModal}
                    onClose={() => setSelectedStatModal(null)}
                    title={
                        selectedStatModal === 'goals' ? 'Top 10 - Most Goals Scored' :
                        selectedStatModal === 'defense' ? 'Top 10 - Best Defense' :
                        selectedStatModal === 'possession' ? 'Top 10 - Average Possession' :
                        selectedStatModal === 'passAccuracy' ? 'Top 10 - Pass Accuracy' : ''
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-800 uppercase font-black tracking-widest">
                                    <th className="px-4 py-3 text-center">Rank</th>
                                    <th className="px-2 py-3">Team</th>
                                    <th className="px-4 py-3 text-center">Played</th>
                                    <th className="px-4 py-3 text-right">Stat Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10List.map((team, idx) => (
                                    <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                        <td className="px-4 py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-3">
                                                <Flag code={team.countryCode} circular={true} className="w-6 h-6 border border-gray-800" style={{ width: '24px', height: '24px' }} />
                                                <span className="font-bold text-white uppercase">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-300">{team.matchesPlayed}</td>
                                        <td className="px-4 py-3 text-right font-black text-green-400 text-sm">
                                            {team.statValue}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>

                <footer className="pt-20 border-t border-gray-900 text-center">
                    <p className="text-gray-600 text-xs uppercase font-black tracking-widest">Statistical Data powered by Opta & AI analysis</p>
                </footer>
            </main>
        </div>
    );
};

export default Standings;
