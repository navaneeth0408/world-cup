import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Flag from '../components/ui/Flag';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Trophy, Goal, Hand, Shield, Users, BarChart3, AlertCircle, Activity, Sparkles, Award, X, Info } from 'lucide-react';
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

const generateReason = (p) => {
    if (p.rank === 1) {
        return `Tournament leader with ${p.score.toFixed(1)}/10 rating, driving ${p.team}'s campaign with ${p.goals} goals and ${p.potm} MOTM awards.`;
    }
    const factors = [];
    if (p.goals > 0) factors.push(`${p.goals} goal${p.goals > 1 ? 's' : ''}`);
    if (p.assists > 0) factors.push(`${p.assists} assist${p.assists > 1 ? 's' : ''}`);
    if (p.potm > 0) factors.push(`${p.potm} MOTM award${p.potm > 1 ? 's' : ''}`);

    const desc = factors.join(", ");
    return `${desc.charAt(0).toUpperCase() + desc.slice(1)} for ${p.team}.`;
};

const Standings = () => {
    const { teams, matches, loading } = useTournament();
    const [activeTab, setActiveTab] = useState('standings');
    const [selectedStatModal, setSelectedStatModal] = useState(null);
    const [showThirdPlaceModal, setShowThirdPlaceModal] = useState(false);
    const [summaryModalType, setSummaryModalType] = useState(null);
    const [drillDownTeamId, setDrillDownTeamId] = useState(null);
    const [activeMvpReason, setActiveMvpReason] = useState(null);
    const scrollContainerRef = useRef(null);

    const sections = [
        { id: 'standings', name: 'Standings', icon: Trophy },
        { id: 'scorers', name: 'Top Scorers', icon: Goal },
        { id: 'assists', name: 'Assists & G+A', icon: Hand },
        { id: 'mvp', name: 'Tournament MVP', icon: Award },
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

            const groupMatches = matches.filter(m => m.match_id <= 72 && m.group === g && m.status === 'completed');

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

    const thirdPlaceStandings = useMemo(() => {
        const thirdTeams = [];
        Object.entries(groupStandings).forEach(([group, groupTeams]) => {
            if (groupTeams.length >= 3) {
                thirdTeams.push({
                    ...groupTeams[2],
                    group
                });
            }
        });
        
        return thirdTeams.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            return b.gf - a.gf;
        });
    }, [groupStandings]);

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

    const topGA = useMemo(() => {
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
                        assists: 0,
                        ga: 0
                    };
                }
                players[key].goals += 1;
                players[key].ga += 1;
            });

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
                        assists: 0,
                        ga: 0
                    };
                }
                players[key].assists += 1;
                players[key].ga += 1;
            });
        });

        return Object.values(players)
            .filter(p => p.ga > 0)
            .sort((a, b) => b.ga - a.ga || b.goals - a.goals || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }))
            .slice(0, 10);
    }, [completedMatches, teams]);

    const mvpCandidates = useMemo(() => {
        const players = {};
        
        // Helper to get player's position
        const getPlayerPosition = (name, teamId) => {
            const teamLineup = lineupsData.teams.find(t => t.country_name.toLowerCase() === teamId.toLowerCase());
            if (!teamLineup) return 'MF';
            const entry = Object.entries(teamLineup.starting_lineup).find(([pos, pName]) => pName.toLowerCase() === name.toLowerCase());
            if (!entry) return 'MF';
            const posCode = entry[0];
            if (posCode === 'GK') return 'GK';
            if (posCode.includes('B') || posCode.includes('LWB') || posCode.includes('RWB')) return 'DF';
            if (posCode.includes('M') || posCode.includes('DM') || posCode.includes('CM') || posCode.includes('AM')) return 'MF';
            if (posCode.includes('W') || posCode.includes('CF') || posCode.includes('ST') || posCode.includes('F')) return 'FW';
            return 'MF';
        };

        // Gather all players who have participated (starts/scorers/assists/cards/POTM)
        teams.forEach(t => {
            const teamLineup = lineupsData.teams.find(l => l.country_name.toLowerCase() === t.name.toLowerCase() || l.country_name.toLowerCase() === t.id.toLowerCase());
            if (teamLineup) {
                Object.values(teamLineup.starting_lineup).forEach(name => {
                    const key = `${name}-${t.id}`;
                    players[key] = {
                        name,
                        team: t.name,
                        teamId: t.id,
                        teamCode: t.countryCode,
                        goals: 0,
                        assists: 0,
                        potm: 0,
                        yellows: 0,
                        reds: 0,
                        matchRatings: [],
                        weightedGoals: 0,
                        weightedAssists: 0,
                        bigMatchPoints: 0,
                        matchesPlayed: 0
                    };
                });
            }
        });

        const getOrCreatePlayer = (name, teamId) => {
            const key = `${name}-${teamId}`;
            if (!players[key]) {
                const team = teams.find(t => t.id === teamId);
                players[key] = {
                    name,
                    team: team ? team.name : teamId,
                    teamId,
                    teamCode: team ? team.countryCode : '',
                    goals: 0,
                    assists: 0,
                    potm: 0,
                    yellows: 0,
                    reds: 0,
                    matchRatings: [],
                    weightedGoals: 0,
                    weightedAssists: 0,
                    bigMatchPoints: 0,
                    matchesPlayed: 0
                };
            }
            return players[key];
        };

        const STAGE_MULTIPLIERS = {
            'Group Stage': 1.0,
            'Round of 32': 1.2,
            'Round of 16': 1.4,
            'Quarter-finals': 1.6,
            'Semi-finals': 1.8,
            'Final': 2.0,
            'Third Place': 1.0
        };

        completedMatches.forEach(m => {
            const stage = m.stage || 'Group Stage';
            const mult = STAGE_MULTIPLIERS[stage] || 1.0;
            const isKnockout = m.match_id > 72;

            const matchPlayers = new Set();
            
            // Home starters
            const homeLineup = lineupsData.teams.find(t => t.country_name.toLowerCase() === m.homeTeam.toLowerCase());
            if (homeLineup) {
                Object.values(homeLineup.starting_lineup).forEach(name => {
                    const key = `${name}-${m.homeTeam}`;
                    matchPlayers.add(key);
                });
            }

            // Away starters
            const awayLineup = lineupsData.teams.find(t => t.country_name.toLowerCase() === m.awayTeam.toLowerCase());
            if (awayLineup) {
                Object.values(awayLineup.starting_lineup).forEach(name => {
                    const key = `${name}-${m.awayTeam}`;
                    matchPlayers.add(key);
                });
            }

            // Scorers & Assists
            const scorers = m.scorers || [];
            scorers.forEach(s => {
                if (!s.name || s.name.includes('(OG)') || s.name.includes('Own Goal') || s.ownGoal) return;
                const p = getOrCreatePlayer(s.name, s.teamId);
                matchPlayers.add(`${s.name}-${s.teamId}`);
                p.goals += 1;
                p.weightedGoals += 1 * mult;

                if (isKnockout) {
                    p.bigMatchPoints += 0.20; // Goal in knockout
                    const isWinner = (s.teamId === m.homeTeam && m.homeScore >= m.awayScore) || (s.teamId === m.awayTeam && m.awayScore >= m.homeScore);
                    if (isWinner) {
                        p.bigMatchPoints += 0.20; // Winning goal
                    }
                    if (m.homeScore === m.awayScore) {
                        p.bigMatchPoints += 0.15; // Equalizer
                    }
                }
            });

            scorers.forEach(s => {
                if (!s.assist) return;
                const p = getOrCreatePlayer(s.assist, s.teamId);
                matchPlayers.add(`${s.assist}-${s.teamId}`);
                p.assists += 1;
                p.weightedAssists += 1 * mult;

                if (isKnockout) {
                    p.bigMatchPoints += 0.15; // Assist in knockout
                }
            });

            // POTM
            if (m.playerOfMatch) {
                let potmTeamId = m.homeTeam;
                const normalizedPotm = m.playerOfMatch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                teams.forEach(t => {
                    if (t.squad && t.squad.some(p => p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === normalizedPotm)) {
                        potmTeamId = t.id;
                    }
                });

                const p = getOrCreatePlayer(m.playerOfMatch, potmTeamId);
                matchPlayers.add(`${m.playerOfMatch}-${potmTeamId}`);
                p.potm += 1;

                if (isKnockout) {
                    p.bigMatchPoints += 0.30; // POTM in knockout
                }
            }

            // Cards
            const cards = m.cards || [];
            cards.forEach(c => {
                if (!c.name) return;
                const p = getOrCreatePlayer(c.name, c.teamId);
                matchPlayers.add(`${c.name}-${c.teamId}`);
                if (c.type === 'yellow') p.yellows += 1;
                if (c.type === 'red') p.reds += 1;
            });

            // Calculate match rating for each participant
            matchPlayers.forEach(key => {
                const p = players[key];
                if (!p) return;

                p.matchesPlayed += 1;

                let matchRating = 6.5; // base

                const isHome = p.teamId === m.homeTeam;
                const myScore = isHome ? m.homeScore : m.awayScore;
                const oppScore = isHome ? m.awayScore : m.homeScore;

                if (myScore > oppScore) {
                    matchRating += 0.5;
                } else if (myScore === oppScore) {
                    matchRating += 0.1;
                } else {
                    matchRating -= 0.2;
                }

                const pos = getPlayerPosition(p.name, p.teamId);
                const isCleanSheet = oppScore === 0;
                if (isCleanSheet && (pos === 'GK' || pos === 'DF')) {
                    matchRating += 0.8;
                    if (isKnockout && pos === 'GK') {
                        p.bigMatchPoints += 0.15; // clean sheet bonus
                    }
                }

                const matchGoals = (m.scorers || []).filter(s => s.name === p.name && s.teamId === p.teamId && !s.ownGoal).length;
                const matchAssists = (m.scorers || []).filter(s => s.assist === p.name && s.teamId === p.teamId).length;
                const isPOTM = m.playerOfMatch === p.name;
                const hasYellow = (m.cards || []).some(c => c.name === p.name && c.teamId === p.teamId && c.type === 'yellow');
                const hasRed = (m.cards || []).some(c => c.name === p.name && c.teamId === p.teamId && c.type === 'red');

                matchRating += matchGoals * 0.8;
                matchRating += matchAssists * 0.6;
                if (isPOTM) matchRating += 1.0;
                if (hasYellow) matchRating -= 0.2;
                if (hasRed) matchRating -= 1.0;

                if (isKnockout) {
                    matchRating += 0.3;
                    // Penalty Shootout Hero bonus (assume win on penalties)
                    const isDraw = m.homeScore === m.awayScore;
                    if (isDraw && m.status === 'completed') {
                        // Check if team advanced
                        const winner = (m.winner || m.winnerId || '').toLowerCase();
                        const wonShootout = winner === p.teamId.toLowerCase() || winner === p.team.toLowerCase();
                        if (wonShootout) {
                            if (pos === 'GK') p.bigMatchPoints += 0.40; // Penalty shootout GK hero
                            else if (isPOTM) p.bigMatchPoints += 0.40; // Penalty shootout outfield hero
                        }
                    }
                }

                const hashValue = ((p.name.charCodeAt(0) * 7 + p.name.charCodeAt(p.name.length - 1) * 3 + m.match_id) % 11) - 5;
                matchRating += hashValue * 0.05;

                matchRating = Math.max(3.0, Math.min(10.0, matchRating));
                p.matchRatings.push(matchRating);
            });
        });

        // Find leaders
        let maxWeightedGoals = 0.1;
        let maxWeightedAssists = 0.1;
        let maxMOTM = 0.1;
        let maxBigMatchPoints = 0.1;

        Object.values(players).forEach(p => {
            if (p.weightedGoals > maxWeightedGoals) maxWeightedGoals = p.weightedGoals;
            if (p.weightedAssists > maxWeightedAssists) maxWeightedAssists = p.weightedAssists;
            if (p.potm > maxMOTM) maxMOTM = p.potm;
            if (p.bigMatchPoints > maxBigMatchPoints) maxBigMatchPoints = p.bigMatchPoints;
        });

        const getTeamProgressScore = (tId) => {
            const teamMatches = matches.filter(m => m.homeTeam === tId || m.awayTeam === tId);
            let maxStage = 'Group Stage';

            teamMatches.forEach(m => {
                const stage = m.stage || 'Group Stage';
                const stageOrder = {
                    'Group Stage': 1,
                    'Round of 32': 2,
                    'Round of 16': 3,
                    'Quarter-finals': 4,
                    'Semi-finals': 5,
                    'Final': 6
                };
                if ((stageOrder[stage] || 0) > (stageOrder[maxStage] || 0)) {
                    maxStage = stage;
                }
            });

            if (maxStage === 'Final') {
                const finalMatch = teamMatches.find(m => m.stage === 'Final');
                if (finalMatch && finalMatch.status === 'completed') {
                    const winner = finalMatch.winner || finalMatch.winnerId || (finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeam : finalMatch.awayTeam);
                    if (winner === tId) return 10;
                }
                return 9;
            }
            if (maxStage === 'Semi-finals') return 8;
            if (maxStage === 'Quarter-finals') return 7;
            if (maxStage === 'Round of 16') return 6;
            if (maxStage === 'Round of 32') return 5;
            return 3;
        };

        return Object.values(players)
            .filter(p => p.matchesPlayed > 0)
            .map(p => {
                const goalScore = Math.max(0, Math.min(10, (p.weightedGoals / maxWeightedGoals) * 10));
                const assistScore = Math.max(0, Math.min(10, (p.weightedAssists / maxWeightedAssists) * 10));
                
                const avgRating = p.matchRatings.reduce((sum, r) => sum + r, 0) / p.matchRatings.length;
                const ratingScore = avgRating;

                const motmScore = Math.max(0, Math.min(10, (p.potm / maxMOTM) * 10));
                const teamProgressScore = getTeamProgressScore(p.teamId);
                const bigMatchScore = Math.max(0, Math.min(10, (p.bigMatchPoints / maxBigMatchPoints) * 10));

                const finalMvpScore = (0.25 * goalScore) + (0.15 * assistScore) + (0.35 * ratingScore) + (0.10 * motmScore) + (0.10 * teamProgressScore) + (0.05 * bigMatchScore);
                const clampedMvpScore = Math.max(0.0, Math.min(10.0, finalMvpScore));

                return {
                    ...p,
                    avgRating,
                    score: clampedMvpScore
                };
            })
            .sort((a, b) => b.score - a.score || b.goals - a.goals || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }))
            .slice(0, 20);
    }, [completedMatches, teams, matches]);

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

    const summaryBreakdownData = useMemo(() => {
        const data = {
            goals: [],
            yellowCards: {},
            redCards: {},
            penalties: {},
            ownGoals: {}
        };

        // 1. Goals (all active teams sorted by goalsScored)
        data.goals = [...allTeamStats]
            .filter(t => t.matchesPlayed > 0)
            .sort((a, b) => b.goalsScored - a.goalsScored || a.name.localeCompare(b.name));

        const addEvent = (category, teamId, playerName) => {
            const team = teams.find(t => t.id === teamId);
            if (!team) return;

            if (!data[category][teamId]) {
                data[category][teamId] = {
                    id: teamId,
                    name: team.name,
                    countryCode: team.countryCode,
                    count: 0,
                    players: {}
                };
            }
            data[category][teamId].count += 1;
            data[category][teamId].players[playerName] = (data[category][teamId].players[playerName] || 0) + 1;
        };

        completedMatches.forEach(m => {
            // Cards
            const cards = m.cards || [];
            cards.forEach(c => {
                if (!c.name || !c.teamId) return;
                if (c.type === 'yellow') {
                    addEvent('yellowCards', c.teamId, c.name);
                } else if (c.type === 'red') {
                    addEvent('redCards', c.teamId, c.name);
                }
            });

            // Scorers (penalties & own goals)
            const scorers = m.scorers || [];
            scorers.forEach(s => {
                if (!s.name || !s.teamId) return;
                if (s.penalty) {
                    addEvent('penalties', s.teamId, s.name);
                }
                if (s.ownGoal) {
                    addEvent('ownGoals', s.teamId, s.name);
                }
            });
        });

        const sortCategory = (cat) => {
            return Object.values(data[cat])
                .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        };

        return {
            goals: data.goals,
            yellowCards: sortCategory('yellowCards'),
            redCards: sortCategory('redCards'),
            penalties: sortCategory('penalties'),
            ownGoals: sortCategory('ownGoals')
        };
    }, [completedMatches, teams, allTeamStats]);

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-green-500" />
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Group Standings</h2>
                        </div>
                        <Button 
                            variant="secondary" 
                            className="text-xs font-black uppercase tracking-wider py-2 flex items-center gap-1.5 border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-green-500/25 transition-all text-white self-start sm:self-center"
                            onClick={() => setShowThirdPlaceModal(true)}
                        >
                            <Sparkles className="w-4 h-4 text-green-400" />
                            3rd Place Standings
                        </Button>
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
                    <Card className="p-0 border-gray-800 bg-gray-900/50">
                        <div className="overflow-x-auto w-full scrollbar-thin">
                            <table className="w-full text-left min-w-[380px]">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4 text-center">Goals</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {topScorers.map((player) => (
                                        <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-black text-gray-500 whitespace-nowrap">
                                                {player.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : `#${player.rank}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Flag code={player.teamCode} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white group-hover:text-green-400 transition-colors leading-tight">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500">{player.team}</span>
                                                    </div>
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
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No scorers recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Section: Most Assists */}
                    <section id="assists" className="scroll-mt-36">
                        <div className="flex items-center gap-3 mb-8">
                            <Hand className="w-8 h-8 text-green-500" />
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Most Assists</h2>
                        </div>
                        <Card className="p-0 border-gray-800 bg-gray-900/50 flex flex-col">
                            <div className="overflow-x-auto w-full scrollbar-thin">
                                <table className="w-full text-left min-w-[380px]">
                                    <thead className="bg-gray-800/20 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-6 py-4">Rank</th>
                                            <th className="px-6 py-4">Player</th>
                                            <th className="px-6 py-4 text-center">Assists</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
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
                            </div>
                        </Card>
                    </section>

                    {/* Section: Most G+A */}
                    <section id="ga" className="scroll-mt-36">
                        <div className="flex items-center gap-3 mb-8">
                            <Sparkles className="w-8 h-8 text-green-500" />
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Most Goal Involvements (G+A)</h2>
                        </div>
                        <Card className="p-0 border-gray-800 bg-gray-900/50 flex flex-col">
                            <div className="overflow-x-auto w-full scrollbar-thin">
                                <table className="w-full text-left min-w-[480px]">
                                    <thead className="bg-gray-800/20 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-6 py-4">Rank</th>
                                            <th className="px-6 py-4">Player</th>
                                            <th className="px-6 py-4 text-center">Goals</th>
                                            <th className="px-6 py-4 text-center">Assists</th>
                                            <th className="px-6 py-4 text-center">G+A</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
                                        {topGA.map((player) => (
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
                                                <td className="px-6 py-4 text-center text-slate-400 font-bold">
                                                    {player.goals}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-400 font-bold">
                                                    {player.assists}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-block px-3 py-0.5 bg-green-500/10 text-green-400 rounded-full font-black text-sm">
                                                        {player.ga}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {topGA.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                    No goal involvements recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Section: Tournament MVP */}
                <section id="mvp" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Award className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Tournament MVP Race</h2>
                    </div>
                    <Card className="p-0 overflow-hidden border-gray-800 bg-gray-900/50">
                        <div className="bg-gray-800/20 px-6 py-5 border-b border-gray-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider">MVP Score Leaderboard</h3>
                                <p className="text-[10px] text-gray-400 font-semibold leading-tight mt-1">Weighted Formula: 25% Goals (stage-weighted) + 15% Assists (stage-weighted) + 35% Avg Match Rating + 10% MOTM + 10% Team Progress + 5% Big Match Impact</p>
                            </div>
                            <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold">
                                LIVE RATINGS
                            </span>
                        </div>
                        <div className="overflow-x-auto w-full scrollbar-thin">
                            <table className="w-full text-left min-w-[850px]">
                                <thead className="bg-gray-800/10 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4">Country</th>
                                        <th className="px-6 py-4 text-center">Goals</th>
                                        <th className="px-6 py-4 text-center">Assists</th>
                                        <th className="px-6 py-4 text-center">Avg Rating</th>
                                        <th className="px-6 py-4 text-center">MOTM</th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span>MVP Score</span>
                                                <span className="text-[9px] text-gray-500 font-bold lowercase normal-case tracking-normal mt-0.5">(out of 10)</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 hidden md:table-cell">Reason for Ranking</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/40">
                                    {mvpCandidates.map((player) => (
                                        <tr key={`${player.name}-${player.teamId}`} className="hover:bg-white/5 transition-colors group text-sm">
                                            <td className="px-6 py-4 font-black text-gray-500 whitespace-nowrap">
                                                {player.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : `#${player.rank}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white group-hover:text-green-400 transition-colors leading-tight">{player.name}</span>
                                                    <button 
                                                        onClick={() => setActiveMvpReason({ name: player.name, reason: generateReason(player) })}
                                                        className="inline-flex md:hidden items-center justify-center p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                        title="View ranking reasoning"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Flag code={player.teamCode} />
                                                    <span className="text-gray-400">{player.team}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                                {player.goals}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                                {player.assists}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                                {player.avgRating.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                                {player.potm}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-black text-sm text-glow">
                                                    {player.score.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-400 leading-relaxed max-w-sm hidden md:table-cell" title={generateReason(player)}>
                                                {generateReason(player)}
                                            </td>
                                        </tr>
                                    ))}
                                    {mvpCandidates.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No completed matches recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
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
                    <Card className="p-0 border-gray-800 bg-gray-900/50">
                        <div className="overflow-x-auto w-full scrollbar-thin">
                            <table className="w-full text-left min-w-[420px]">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Goalkeeper</th>
                                        <th className="px-6 py-4 text-center">Clean Sheets</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {goalkeepers.map((gk) => (
                                        <tr key={`${gk.name}-${gk.team}`} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-black text-gray-500">#{gk.rank}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Flag code={gk.teamCode} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white leading-tight">{gk.name}</span>
                                                        <span className="text-[10px] text-gray-500">{gk.team}</span>
                                                    </div>
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
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No clean sheets recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                            <Card 
                                onClick={() => { setSummaryModalType('goals'); setDrillDownTeamId(null); }}
                                className="text-center p-4 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-green-500/30 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 group"
                            >
                                <div>
                                    <Goal className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-505 font-black uppercase tracking-widest mb-1 group-hover:text-green-400 transition-colors">Total Goals</p>
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
                            <Card 
                                onClick={() => { setSummaryModalType('yellowCards'); setDrillDownTeamId(null); }}
                                className="text-center p-4 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-yellow-500/30 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 group"
                            >
                                <div>
                                    <div className="w-4 h-5.5 bg-yellow-400 rounded-sm mx-auto mb-3 border border-yellow-300/30 shadow-md shadow-yellow-500/20" />
                                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest mb-1 group-hover:text-yellow-400 transition-colors">Yellow Cards</p>
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
                            <Card 
                                onClick={() => { setSummaryModalType('redCards'); setDrillDownTeamId(null); }}
                                className="text-center p-4 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-red-500/30 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 group"
                            >
                                <div>
                                    <div className="w-4 h-5.5 bg-red-500 rounded-sm mx-auto mb-3 border border-red-400/30 shadow-md shadow-red-500/20" />
                                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">Red Cards</p>
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
                            <Card 
                                onClick={() => { setSummaryModalType('penalties'); setDrillDownTeamId(null); }}
                                className="text-center p-4 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-purple-500/30 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 group"
                            >
                                <div>
                                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest mb-1 group-hover:text-purple-400 transition-colors">Penalties</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalPenaltiesConceded}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Conceded</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card 
                                onClick={() => { setSummaryModalType('ownGoals'); setDrillDownTeamId(null); }}
                                className="text-center p-4 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-amber-500/30 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 group"
                            >
                                <div>
                                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest mb-1 group-hover:text-amber-400 transition-colors">Own Goals</p>
                                </div>
                                <div className="mt-3">
                                    <h4 className="text-2xl font-black text-white mb-1">{tournamentSummaryStats.totalOwnGoals}</h4>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Accidental</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card className="text-center p-4 border-gray-800 bg-gray-900/50 h-full flex flex-col justify-between transition-all duration-300">
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

                {/* Summary Stats Detail Modal */}
                <Modal
                    isOpen={!!summaryModalType}
                    onClose={() => {
                        setSummaryModalType(null);
                        setDrillDownTeamId(null);
                    }}
                    title={
                        summaryModalType === 'goals' ? 'Tournament Goals - All Teams' :
                        summaryModalType === 'yellowCards' ? (drillDownTeamId ? `${teams.find(t => t.id === drillDownTeamId)?.name} - Yellow Cards Breakdown` : 'Yellow Cards by Team') :
                        summaryModalType === 'redCards' ? (drillDownTeamId ? `${teams.find(t => t.id === drillDownTeamId)?.name} - Red Cards Breakdown` : 'Red Cards by Team') :
                        summaryModalType === 'penalties' ? (drillDownTeamId ? `${teams.find(t => t.id === drillDownTeamId)?.name} - Penalties Breakdown` : 'Penalties Scored by Team') :
                        summaryModalType === 'ownGoals' ? (drillDownTeamId ? `${teams.find(t => t.id === drillDownTeamId)?.name} - Own Goals Breakdown` : 'Own Goals Conceded by Team') : ''
                    }
                >
                    {drillDownTeamId ? (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => setDrillDownTeamId(null)}
                                className="text-left text-xs font-black text-green-400 hover:text-green-300 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                            >
                                ← Back to Team List
                            </button>
                            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-slate-950/40">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-800 uppercase font-black tracking-widest">
                                            <th className="px-6 py-3">Player</th>
                                            <th className="px-6 py-3 text-right">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
                                        {Object.entries(
                                            summaryBreakdownData[summaryModalType]?.find(t => t.id === drillDownTeamId)?.players || {}
                                        )
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([playerName, count]) => (
                                                <tr key={playerName} className="hover:bg-gray-800/10 transition-colors">
                                                    <td className="px-6 py-3 font-bold text-white uppercase">{playerName}</td>
                                                    <td className="px-6 py-3 text-right font-black text-green-400 text-sm">x{count}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {summaryModalType !== 'goals' && (
                                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
                                    Click on a team name to view the player-wise breakdown.
                                </p>
                            )}
                            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-slate-950/40 max-h-[60vh]">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-800 uppercase font-black tracking-widest">
                                            <th className="px-4 py-3 text-center">Rank</th>
                                            <th className="px-2 py-3">Team</th>
                                            <th className="px-4 py-3 text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
                                        {summaryModalType === 'goals' ? (
                                            summaryBreakdownData.goals.map((team, idx) => (
                                                <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                                    <td className="px-4 py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Flag code={team.countryCode} circular={true} className="w-6 h-6 border border-gray-800" style={{ width: '24px', height: '24px' }} />
                                                            <span className="font-bold text-white uppercase">{team.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-green-400 text-sm">{team.goalsScored} Goals</td>
                                                </tr>
                                            ))
                                        ) : (
                                            (summaryBreakdownData[summaryModalType] || []).map((team, idx) => (
                                                <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                                    <td className="px-4 py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                                    <td className="px-2 py-3">
                                                        <button
                                                            onClick={() => setDrillDownTeamId(team.id)}
                                                            className="flex items-center gap-3 border-none bg-transparent cursor-pointer text-left group"
                                                        >
                                                            <Flag code={team.countryCode} circular={true} className="w-6 h-6 border border-gray-800" style={{ width: '24px', height: '24px' }} />
                                                            <span className="font-bold text-white uppercase group-hover:text-green-400 transition-colors underline decoration-dotted decoration-gray-500 group-hover:decoration-green-400">
                                                                {team.name}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-green-400 text-sm">x{team.count}</td>
                                                </tr>
                                            ))
                                        )}
                                        {summaryModalType && summaryBreakdownData[summaryModalType]?.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                    No statistics recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Best 3rd Place Teams Modal */}
                <Modal
                    isOpen={showThirdPlaceModal}
                    onClose={() => setShowThirdPlaceModal(false)}
                    title="🏆 Best 3rd Place Teams Standings"
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                            The top 8 third-place teams out of all 12 groups advance to the Round of 32. 
                            Green highlighted rows are currently in qualifying positions.
                        </p>
                        
                        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-slate-950/40">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-850 uppercase font-black tracking-widest text-[9px]">
                                        <th className="px-4 py-3 text-center">Rank</th>
                                        <th className="px-2 py-3">Team</th>
                                        <th className="px-3 py-3 text-center">Group</th>
                                        <th className="px-3 py-3 text-center">P</th>
                                        <th className="px-3 py-3 text-center">GD</th>
                                        <th className="px-4 py-3 text-center">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {thirdPlaceStandings.map((team, idx) => {
                                        const isQualified = idx < 8;
                                        return (
                                            <tr 
                                                key={team.id}
                                                className={`border-b border-gray-905/40 transition-colors hover:bg-gray-900/30 ${
                                                    isQualified ? 'bg-green-500/5' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3 text-center font-bold">
                                                    {isQualified ? (
                                                        <span className="text-green-400">#{idx + 1}</span>
                                                    ) : (
                                                        <span className="text-gray-500">#{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 font-bold text-white flex items-center gap-2">
                                                    <Flag code={team.countryCode} style={{ fontSize: '1.2rem' }} className="shadow border border-gray-800" />
                                                    <span>{team.name}</span>
                                                    {isQualified && (
                                                        <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold scale-90">
                                                            Q
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center font-black text-slate-400">
                                                    Group {team.group}
                                                </td>
                                                <td className="px-3 py-3 text-center font-medium text-slate-350">
                                                    {team.played}
                                                </td>
                                                <td className={`px-3 py-3 text-center font-black ${
                                                    team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-slate-400'
                                                }`}>
                                                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                                                </td>
                                                <td className={`px-4 py-3 text-center font-black ${
                                                    isQualified ? 'text-green-400 text-sm' : 'text-slate-300'
                                                }`}>
                                                    {team.pts}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
                {/* Modal for MVP Reason */}
                <AnimatePresence>
                    {activeMvpReason && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setActiveMvpReason(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
                            >
                                <button 
                                    onClick={() => setActiveMvpReason(null)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2 mb-3">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <h4 className="font-black text-white uppercase tracking-tight text-sm">MVP Ranking Reason</h4>
                                </div>
                                <h5 className="font-bold text-white text-xs mb-1.5">{activeMvpReason.name}</h5>
                                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                                    {activeMvpReason.reason}
                                </p>
                                <button 
                                    onClick={() => setActiveMvpReason(null)}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <footer className="pt-20 border-t border-gray-900 text-center">
                    <p className="text-gray-600 text-xs uppercase font-black tracking-widest">Statistical Data powered by Opta & AI analysis</p>
                </footer>
            </main>
        </div>
    );
};

export default Standings;
