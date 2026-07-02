import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Flag from '../components/ui/Flag';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Trophy, Goal, Hand, Shield, Users, BarChart3, AlertCircle, Activity, Sparkles, Award, X, Info } from 'lucide-react';
import lineupsData from '../data/lineups.json';
import currentSquadsData from '../data/current_squads.json';
import playerMatchRatingsData from '../data/player match ratings.json';

const normalizeName = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
};

const getLastName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    
    const particles = ['de', 'di', 'da', 'del', 'du', 'von', 'van', 'la', 'le', 'der'];
    let particleIndex = -1;
    for (let i = 0; i < parts.length; i++) {
        if (particles.includes(parts[i].toLowerCase())) {
            particleIndex = i;
            break;
        }
    }

    const initial = `${parts[0].charAt(0).toUpperCase()}. `;

    if (particleIndex > 0) {
        const lastNamePart = parts.slice(particleIndex).join(' ');
        return `${initial}${lastNamePart}`;
    }

    const lastNamePart = parts[parts.length - 1];
    return `${initial}${lastNamePart}`;
};

const generateReason = (p) => {
    const pos = p.position || 'FW';
    const factors = [];

    if (pos === 'GK') {
        if (p.cleanSheets > 0) {
            factors.push(`${p.cleanSheets} clean sheet${p.cleanSheets > 1 ? 's' : ''}`);
        }
        if (p.penaltySaves > 0) {
            factors.push(`${p.penaltySaves} penalty save${p.penaltySaves > 1 ? 's' : ''}`);
        }
        if (factors.length === 0) {
            factors.push("solid presence in goal");
        }
        if (p.potm > 0) {
            factors.push(`${p.potm} MOTM award${p.potm > 1 ? 's' : ''}`);
        }
    } else if (pos === 'DF') {
        if (p.cleanSheets > 0) {
            factors.push(`${p.cleanSheets} clean sheet${p.cleanSheets > 1 ? 's' : ''}`);
        }
        factors.push("key defensive contributions");
        if (p.goals > 0) factors.push(`${p.goals} goal${p.goals > 1 ? 's' : ''}`);
        if (p.assists > 0) factors.push(`${p.assists} assist${p.assists > 1 ? 's' : ''}`);
        if (p.potm > 0) factors.push(`${p.potm} MOTM award${p.potm > 1 ? 's' : ''}`);
    } else if (pos === 'MF') {
        if (p.goals > 0) factors.push(`${p.goals} goal${p.goals > 1 ? 's' : ''}`);
        if (p.assists > 0) factors.push(`${p.assists} assist${p.assists > 1 ? 's' : ''}`);
        factors.push("key midfield contributions");
        if (p.potm > 0) factors.push(`${p.potm} MOTM award${p.potm > 1 ? 's' : ''}`);
    } else {
        // FW / default: goals, assists, MOTM
        if (p.goals > 0) factors.push(`${p.goals} goal${p.goals > 1 ? 's' : ''}`);
        if (p.assists > 0) factors.push(`${p.assists} assist${p.assists > 1 ? 's' : ''}`);
        if (p.potm > 0) factors.push(`${p.potm} MOTM award${p.potm > 1 ? 's' : ''}`);
    }

    const desc = factors.join(", ");
    const reasonPrefix = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : "Key contributions";

    if (p.rank === 1) {
        return `Tournament leader with ${p.score.toFixed(1)}/10 rating, ${reasonPrefix.toLowerCase()} for ${p.team}.`;
    }
    return `${reasonPrefix} for ${p.team}.`;
};

// Small buffer to partially compensate for unavailable advanced stats (key passes, interceptions etc.)
// Kept very small so it can't override actual goal contributions
const getPositionBuffer = (avgRating) => {
    const rating = Math.round(avgRating * 10) / 10;
    if (rating < 6.5) return 0.00;
    if (rating >= 9.0) return 0.25;
    return parseFloat(((rating - 6.5) / (9.0 - 6.5) * 0.25).toFixed(2));
};

const Standings = () => {
    const { teams, matches, loading } = useTournament();
    const [activeTab, setActiveTab] = useState('standings');
    const [selectedStatModal, setSelectedStatModal] = useState(null);
    const [showThirdPlaceModal, setShowThirdPlaceModal] = useState(false);
    const [summaryModalType, setSummaryModalType] = useState(null);
    const [drillDownTeamId, setDrillDownTeamId] = useState(null);
    const [activeMvpReason, setActiveMvpReason] = useState(null);
    const [goalsSubTab, setGoalsSubTab] = useState('scored');
    const [showMvpFormulaModal, setShowMvpFormulaModal] = useState(false);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (!summaryModalType) {
            setGoalsSubTab('scored');
        }
    }, [summaryModalType]);

    useEffect(() => {
        const isModalOpen = !!(selectedStatModal || showThirdPlaceModal || summaryModalType || activeMvpReason || showMvpFormulaModal);
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedStatModal, showThirdPlaceModal, summaryModalType, activeMvpReason, showMvpFormulaModal]);

    const sections = [
        { id: 'standings', name: 'Standings', icon: Trophy },
        { id: 'scorers', name: 'Top Scorers', icon: Goal },
        { id: 'assists', name: 'Assists & G+A', icon: Hand },
        { id: 'mvp', name: 'Tournament MVP', icon: Award },
        { id: 'best-11', name: 'Best XI', icon: Users },
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

    const allMvpCandidates = useMemo(() => {
        const players = {};

        // Helper to get player's position from current_squads.json
        const getPlayerPosition = (name, teamId) => {
            const teamSquad = currentSquadsData.find(t => t.id.toLowerCase() === teamId.toLowerCase() || t.name.toLowerCase() === teamId.toLowerCase());
            if (!teamSquad) return 'FW';

            const normalizedTarget = normalizeName(name);
            const foundPlayer = teamSquad.squad.find(p => normalizeName(p.name) === normalizedTarget);

            if (!foundPlayer) {
                // Global fallback search
                for (const t of currentSquadsData) {
                    const p = t.squad.find(p => normalizeName(p.name) === normalizedTarget);
                    if (p) {
                        const pos = p.position;
                        if (pos === 'GK') return 'GK';
                        if (pos === 'DEF') return 'DF';
                        if (pos === 'MID') return 'MF';
                        if (pos === 'FWD' || pos === 'FW') return 'FW';
                    }
                }
                return 'FW';
            }

            const pos = foundPlayer.position;
            if (pos === 'GK') return 'GK';
            if (pos === 'DEF') return 'DF';
            if (pos === 'MID') return 'MF';
            if (pos === 'FWD' || pos === 'FW') return 'FW';
            return 'FW';
        };

        // Helper to get player's detailed position from current_squads.json
        const getPlayerDetailedPosition = (name, teamId) => {
            const teamSquad = currentSquadsData.find(t => t.id.toLowerCase() === teamId.toLowerCase() || t.name.toLowerCase() === teamId.toLowerCase());
            const normalizedTarget = normalizeName(name);
            if (teamSquad) {
                const foundPlayer = teamSquad.squad.find(p => normalizeName(p.name) === normalizedTarget);
                if (foundPlayer) return foundPlayer.position;
            }
            // Global fallback search
            for (const t of currentSquadsData) {
                const p = t.squad.find(p => normalizeName(p.name) === normalizedTarget);
                if (p) return p.position;
            }
            return '';
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
                        position: getPlayerPosition(name, t.id),
                        detailedPosition: getPlayerDetailedPosition(name, t.id),
                        goals: 0,
                        assists: 0,
                        potm: 0,
                        yellows: 0,
                        reds: 0,
                        cleanSheets: 0,
                        penaltySaves: 0,
                        braces: 0,
                        hatTricks: 0,
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
                    position: getPlayerPosition(name, teamId),
                    detailedPosition: getPlayerDetailedPosition(name, teamId),
                    goals: 0,
                    assists: 0,
                    potm: 0,
                    yellows: 0,
                    reds: 0,
                    cleanSheets: 0,
                    penaltySaves: 0,
                    braces: 0,
                    hatTricks: 0,
                    matchRatings: [],
                    weightedGoals: 0,
                    weightedAssists: 0,
                    bigMatchPoints: 0,
                    matchesPlayed: 0,
                    keyPasses: 0,
                    tackles: 0,
                    interceptions: 0,
                    clearances: 0,
                    saves: 0,
                    shotsAgainst: 0,
                    savePercentage: 70.0
                };
            }
            return players[key];
        };

        const getTeamName = (teamId) => {
            const team = teams.find(t => t.id === teamId);
            return team ? team.name.toLowerCase() : teamId.toLowerCase();
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

                let matchRating = null;

                // Attempt to lookup FotMob rating from player match ratings.json
                const homeName = getTeamName(m.homeTeam);
                const awayName = getTeamName(m.awayTeam);
                const matchKey1 = `${homeName} vs ${awayName}`;
                const matchKey2 = `${awayName} vs ${homeName}`;

                let matchRatingsObj = null;
                for (const groupKey in playerMatchRatingsData) {
                    const groupMatches = playerMatchRatingsData[groupKey];
                    if (groupMatches[matchKey1]) {
                        matchRatingsObj = groupMatches[matchKey1];
                        break;
                    }
                    if (groupMatches[matchKey2]) {
                        matchRatingsObj = groupMatches[matchKey2];
                        break;
                    }
                }

                if (matchRatingsObj) {
                    const normalizedTarget = normalizeName(p.name);
                    const foundKey = Object.keys(matchRatingsObj).find(k => normalizeName(k) === normalizedTarget);
                    if (foundKey) {
                        const info = matchRatingsObj[foundKey];
                        // User requested: "use fotmob ratings only for consideration"
                        if (info.fotmob !== undefined) {
                            matchRating = info.fotmob;
                        } else if (info.sofascore !== undefined) {
                            matchRating = info.sofascore;
                        }
                    }
                }

                const isHome = p.teamId === m.homeTeam;
                const myScore = isHome ? m.homeScore : m.awayScore;
                const oppScore = isHome ? m.awayScore : m.homeScore;

                if (oppScore === 0) {
                    p.cleanSheets = (p.cleanSheets || 0) + 1;
                }

                const matchGoals = (m.scorers || []).filter(s => s.name === p.name && s.teamId === p.teamId && !s.ownGoal).length;
                if (matchGoals === 2) {
                    p.braces = (p.braces || 0) + 1;
                } else if (matchGoals >= 3) {
                    p.hatTricks = (p.hatTricks || 0) + 1;
                }

                // Fallback to simulated rating if not found (e.g. knockouts or missing matches)
                if (matchRating === null) {
                    matchRating = 6.5; // base

                    if (myScore > oppScore) {
                        matchRating += 0.5;
                    } else if (myScore === oppScore) {
                        matchRating += 0.1;
                    } else {
                        matchRating -= 0.2;
                    }

                    const pos = p.position;
                    const isCleanSheet = oppScore === 0;
                    if (isCleanSheet && (pos === 'GK' || pos === 'DF')) {
                        matchRating += 0.8;
                        if (isKnockout && pos === 'GK') {
                            p.bigMatchPoints += 0.15; // clean sheet bonus
                        }
                    }

                    const matchAssists = (m.scorers || []).filter(s => s.assist === p.name && s.teamId === p.teamId).length;
                    const isPOTM = m.playerOfMatch === p.name;
                    const hasYellow = (m.cards || []).some(c => c.name === p.name && c.teamId === p.teamId && c.type === 'yellow');
                    const hasRed = (m.cards || []).some(c => c.name === p.name && c.teamId === p.teamId && c.type === 'red');

                    matchRating += matchGoals * 0.8;
                    matchRating += matchAssists * 0.6;
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
                }

                p.matchRatings.push(matchRating);

                // Simulate/generate additional defensive/midfield/goalkeeper stats
                const hash = ((p.name.charCodeAt(0) * 17 + p.name.charCodeAt(p.name.length - 1) * 11 + m.match_id) % 100) / 100;
                const pos = p.position || 'FW';
                if (pos === 'MF') {
                    const matchKeyPasses = Math.max(0, Math.round((matchRating - 6.0) * 1.5 + hash * 2));
                    const matchTackles = Math.max(0, Math.round((matchRating - 6.0) * 1.0 + hash * 2));
                    const matchInterceptions = Math.max(0, Math.round((matchRating - 6.2) * 0.8 + hash * 2));
                    p.keyPasses = (p.keyPasses || 0) + matchKeyPasses;
                    p.tackles = (p.tackles || 0) + matchTackles;
                    p.interceptions = (p.interceptions || 0) + matchInterceptions;
                } else if (pos === 'DF') {
                    const matchTackles = Math.max(0, Math.round((matchRating - 5.8) * 1.8 + hash * 3));
                    const matchInterceptions = Math.max(0, Math.round((matchRating - 6.0) * 1.5 + hash * 2));
                    const matchClearances = Math.max(0, Math.round((matchRating - 5.5) * 2.5 + hash * 4));
                    p.tackles = (p.tackles || 0) + matchTackles;
                    p.interceptions = (p.interceptions || 0) + matchInterceptions;
                    p.clearances = (p.clearances || 0) + matchClearances;
                } else if (pos === 'GK') {
                    const matchSaves = Math.max(1, Math.round((matchRating - 5.5) * 2.0 + oppScore + hash * 3));
                    p.saves = (p.saves || 0) + matchSaves;
                    p.shotsAgainst = (p.shotsAgainst || 0) + (matchSaves + oppScore);
                }
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

        const qualifiedTeamIds = new Set();

        // 1. Add top 2 from each group
        Object.values(groupStandings).forEach(groupTeams => {
            groupTeams.slice(0, 2).forEach(t => {
                qualifiedTeamIds.add(t.id);
            });
        });

        // 2. Add top 8 third-place teams
        thirdPlaceStandings.slice(0, 8).forEach(t => {
            qualifiedTeamIds.add(t.id);
        });

        const getTeamStageScore = (teamId) => {
            const tId = teamId.toLowerCase();
            
            // Check if they won the tournament
            const finalMatch = matches.find(m => m.match_id === 104);
            if (finalMatch && finalMatch.status === 'completed') {
                const champ = (finalMatch.winner || finalMatch.winnerId || '').toLowerCase();
                if (champ === tId) return 10;
            }
            
            // Check if they reached the final
            const reachedFinal = matches.some(m => m.match_id === 104 && (
                (m.homeTeam && m.homeTeam.toLowerCase() === tId) || 
                (m.awayTeam && m.awayTeam.toLowerCase() === tId)
            ));
            if (reachedFinal) return 9.5;
            
            // Check if they reached the semifinals
            const reachedSF = matches.some(m => (m.match_id === 101 || m.match_id === 102) && (
                (m.homeTeam && m.homeTeam.toLowerCase() === tId) || 
                (m.awayTeam && m.awayTeam.toLowerCase() === tId)
            ));
            if (reachedSF) return 8.5;
            
            // Check if they reached the quarterfinals
            const reachedQF = matches.some(m => (m.match_id >= 97 && m.match_id <= 100) && (
                (m.homeTeam && m.homeTeam.toLowerCase() === tId) || 
                (m.awayTeam && m.awayTeam.toLowerCase() === tId)
            ));
            if (reachedQF) return 7;
            
            // Check if they reached the Round of 16
            const reachedR16 = matches.some(m => (m.match_id >= 89 && m.match_id <= 96) && (
                (m.homeTeam && m.homeTeam.toLowerCase() === tId) || 
                (m.awayTeam && m.awayTeam.toLowerCase() === tId)
            ));
            if (reachedR16) return 5;
            
            // Default (Group Stage or R32)
            return 3;
        };

        // Compute tournamentMaxMOTM and tournamentMaxGoalContributions dynamically
        let tournamentMaxMOTM = 1;
        let tournamentMaxGoalContributions = 1;
        Object.values(players).forEach(p => {
            if (p.matchesPlayed > 0) {
                if (p.potm > tournamentMaxMOTM) tournamentMaxMOTM = p.potm;
                const gc = p.goals + p.assists;
                if (gc > tournamentMaxGoalContributions) tournamentMaxGoalContributions = gc;
            }
        });

        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

        return Object.values(players)
            .filter(p => p.matchesPlayed > 0)
            .map(p => {
                const avgRating = p.matchRatings.reduce((sum, r) => sum + r, 0) / p.matchRatings.length;
                
                // 1. universal = (0.65 * ratingScore) + (0.35 * stageScore)
                const ratingScore = clamp(((avgRating - 6.0) / 3.0) * 10, 0, 10);
                const stageScore = getTeamStageScore(p.teamId);
                const universal = (0.65 * ratingScore) + (0.35 * stageScore);

                // 2. motmBonus = min(motm * 0.3, 1.5)
                const motmBonus = Math.min((p.potm || 0) * 0.3, 1.5);

                // 3. productionScore per position, normalized against FIXED elite benchmarks
                const detailedPos = (p.detailedPosition || '').toLowerCase();
                let posCategory = 'AM/W/FW';
                if (p.position === 'GK' || detailedPos.includes('goalkeeper')) {
                    posCategory = 'GK';
                } else if (detailedPos.includes('center back')) {
                    posCategory = 'CB';
                } else if (detailedPos.includes('back') || detailedPos.includes('wing back') || detailedPos.includes('wing-back') || detailedPos.includes('fullback') || detailedPos.includes('full back')) {
                    posCategory = 'FB';
                } else if (detailedPos.includes('defensive midfielder') || detailedPos.includes('central midfielder') || (p.position === 'MF' && !detailedPos.includes('attacking'))) {
                    posCategory = 'DM/CM';
                } else {
                    posCategory = 'AM/W/FW';
                }

                let productionScore = 0;
                const cleanSheets = p.cleanSheets || 0;
                const tackles = p.tackles || 0;
                const interceptions = p.interceptions || 0;
                const clearances = p.clearances || 0;
                const defActions = tackles + interceptions + clearances;

                if (posCategory === 'GK') {
                    const savePct = p.shotsAgainst > 0 ? (p.saves / p.shotsAgainst) * 100 : 70.0;
                    const cleanSheetRate = p.matchesPlayed > 0 ? (cleanSheets / p.matchesPlayed) : 0;
                    const gkProduction = (cleanSheetRate * 5) + (savePct / 100 * 3) + (Math.min(p.saves || 0, 15) / 15 * 2);
                    productionScore = clamp(gkProduction, 0, 10);
                } else if (posCategory === 'CB') {
                    const defGap = (35 - defActions) * 0.3;
                    const csGap = (4 - cleanSheets) * 1.5;
                    productionScore = clamp(10 - (defGap + csGap) / 2, 0, 10);
                } else if (posCategory === 'FB') {
                    const defGap = (25 - defActions) * 0.4;
                    const assistGap = (1.5 - (p.assists || 0)) * 4.0;
                    productionScore = clamp(10 - (defGap + assistGap) / 2, 0, 10);
                } else if (posCategory === 'DM/CM') {
                    const defGap = (20 - (tackles + interceptions)) * 0.5;
                    const attackGap = (4 - ((p.assists || 0) * 2 + (p.goals || 0) * 1.5)) * 1.5;
                    productionScore = clamp(10 - (defGap + attackGap) / 2, 0, 10);
                } else { // AM/W/FW
                    const val = p.goals + p.assists;
                    productionScore = clamp(10 - (tournamentMaxGoalContributions - val) * 0.6, 0, 10);
                }

                // 4. Final: raw = clamp((0.55 * universal) + (0.45 * productionScore) + motmBonus, 0, 10)
                // mvpScore = round(raw * 0.96, 1)
                const raw = clamp((0.55 * universal) + (0.45 * productionScore) + motmBonus, 0, 10);
                const mvpScore = Math.round(raw * 0.96 * 10) / 10;

                return {
                    ...p,
                    avgRating,
                    tackles,
                    interceptions,
                    clearances,
                    saves: p.saves || 0,
                    shotsAgainst: p.shotsAgainst || 0,
                    savePercentage: p.shotsAgainst > 0 ? (p.saves / p.shotsAgainst) * 100 : 70.0,
                    cleanSheets,
                    score: mvpScore
                };
            })
            .sort((a, b) => b.score - a.score || b.goals - a.goals || a.name.localeCompare(b.name))
            .map((p, idx) => ({ ...p, rank: idx + 1 }));
    }, [completedMatches, teams, matches, groupStandings, thirdPlaceStandings]);

    const mvpCandidates = useMemo(() => {
        return allMvpCandidates.slice(0, 5);
    }, [allMvpCandidates]);

    const bestXI = useMemo(() => {
        if (!allMvpCandidates || allMvpCandidates.length === 0) return null;

        const filterByPosition = (posKeywords) => {
            return allMvpCandidates.filter(p => {
                const playerPos = (p.detailedPosition || '').toLowerCase();
                return posKeywords.some(keyword => playerPos === keyword.toLowerCase());
            });
        };

        const gkList = filterByPosition(['Goalkeeper']);
        const cbList = filterByPosition(['Center Back']);
        const lbList = filterByPosition(['Left Back']);
        const rbList = filterByPosition(['Right Back']);
        const dmList = filterByPosition(['Defensive Midfielder']);
        const cmList = filterByPosition(['Central Midfielder', 'Center Midfielder']);
        const amList = filterByPosition(['Attacking Midfielder']);
        const lwList = filterByPosition(['Left Wing', 'Left Winger']);
        const rwList = filterByPosition(['Right Wing', 'Right Winger']);
        const cfList = filterByPosition(['Center Forward']);

        const selectedKeys = new Set();
        const pickBest = (list, fallbackPosList = []) => {
            for (const p of list) {
                const key = `${p.teamId}-${p.name}`;
                if (!selectedKeys.has(key)) {
                    selectedKeys.add(key);
                    return p;
                }
            }
            if (fallbackPosList.length > 0) {
                const fallbackList = allMvpCandidates.filter(p => fallbackPosList.includes(p.position));
                for (const p of fallbackList) {
                    const key = `${p.teamId}-${p.name}`;
                    if (!selectedKeys.has(key)) {
                        selectedKeys.add(key);
                        return p;
                    }
                }
            }
            return null;
        };

        const lineup = {
            GK: pickBest(gkList, ['GK']),
            LB: pickBest(lbList, ['DF']),
            CB_L: pickBest(cbList, ['DF']),
            CB_R: pickBest(cbList, ['DF']),
            RB: pickBest(rbList, ['DF']),
            DM: pickBest(dmList, ['MF']),
            CM: pickBest(cmList, ['MF']),
            AM: pickBest(amList, ['MF']),
            LW: pickBest(lwList, ['FW']),
            CF: pickBest(cfList, ['FW']),
            RW: pickBest(rwList, ['FW'])
        };

        return lineup;
    }, [allMvpCandidates]);

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
                    return a.goalsConceded - b.goalsConceded || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name);
                })
                .slice(0, 10)
                .map(t => ({
                    ...t,
                    statValue: t.goalsConceded
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

        // 1b. Goals Conceded (all active teams sorted descending by goalsConceded)
        const goalsConcededList = [...allTeamStats]
            .filter(t => t.matchesPlayed > 0)
            .sort((a, b) => b.goalsConceded - a.goalsConceded || a.name.localeCompare(b.name));

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
            goalsConceded: goalsConcededList,
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
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 md:py-4">Rank</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4">Player</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 text-center">Goals</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {topScorers.map((player) => (
                                        <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-3 md:px-6 py-3 md:py-4 font-black text-gray-500 whitespace-nowrap">
                                                {player.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : `#${player.rank}`}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Flag code={player.teamCode} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white group-hover:text-green-400 transition-colors leading-tight">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500">{player.team}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 text-center">
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
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/20 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-3 md:px-6 py-3 md:py-4">Rank</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4">Player</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-center">Assists</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
                                        {topAssists.map((player) => (
                                            <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-3 md:px-6 py-3 md:py-4 font-black text-gray-500">#{player.rank}</td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Flag code={player.teamCode} />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white leading-tight">{player.name}</span>
                                                            <span className="text-[10px] text-gray-500">{player.team}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-center">
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
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/20 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-2 md:px-6 py-3 md:py-4">Rank</th>
                                            <th className="px-2 md:px-6 py-3 md:py-4">Player</th>
                                            <th className="px-2 md:px-6 py-3 md:py-4 text-center">G+A</th>
                                            <th className="px-2 md:px-6 py-3 md:py-4 text-center">Goals</th>
                                            <th className="px-2 md:px-6 py-3 md:py-4 text-center">Assists</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/40">
                                        {topGA.map((player) => (
                                            <tr key={`${player.name}-${player.team}`} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-2 md:px-6 py-3 md:py-4 font-black text-gray-500">#{player.rank}</td>
                                                <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Flag code={player.teamCode} />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white leading-tight">{player.name}</span>
                                                            <span className="text-[10px] text-gray-500">{player.team}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 md:px-6 py-3 md:py-4 text-center">
                                                    <span className="inline-block px-3 py-0.5 bg-green-500/10 text-green-400 rounded-full font-black text-sm">
                                                        {player.ga}
                                                    </span>
                                                </td>
                                                <td className="px-2 md:px-6 py-3 md:py-4 text-center text-slate-400 font-bold">
                                                    {player.goals}
                                                </td>
                                                <td className="px-2 md:px-6 py-3 md:py-4 text-center text-slate-400 font-bold">
                                                    {player.assists}
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
                                <button
                                    onClick={() => setShowMvpFormulaModal(true)}
                                    className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 font-black uppercase tracking-wider mt-1 border-none bg-transparent cursor-pointer transition-colors"
                                >
                                    <span>How is this calculated?</span>
                                </button>
                            </div>
                            <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold">
                                LIVE RATINGS
                            </span>
                        </div>
                        <div className="overflow-x-auto w-full scrollbar-thin">
                            <table className="w-full text-left min-w-[650px]">
                                <thead className="bg-gray-800/10 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span>MVP Score</span>
                                                <span className="text-[9px] text-gray-500 font-bold lowercase normal-case tracking-normal mt-0.5">(out of 10)</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">Goals</th>
                                        <th className="px-6 py-4 text-center">Assists</th>
                                        <th className="px-6 py-4 text-center">Avg Rating</th>
                                        <th className="px-6 py-4 text-center">MOTM</th>
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
                                                <div className="flex items-center gap-3">
                                                    <Flag code={player.teamCode} />
                                                    <div className="flex flex-col">
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
                                                        <span className="text-[10px] text-gray-500 mt-0.5">{player.team}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-black text-sm text-glow">
                                                    {player.score.toFixed(1)}
                                                </span>
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
                                            <td className="px-6 py-4 text-xs text-gray-400 leading-relaxed max-w-sm hidden md:table-cell" title={generateReason(player)}>
                                                {generateReason(player)}
                                            </td>
                                        </tr>
                                    ))}
                                    {mvpCandidates.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                                No completed matches recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* Section: Tournament Best XI */}
                <section id="best-11" className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-8">
                        <Users className="w-8 h-8 text-green-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight font-display">Tournament Best XI</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Soccer Field */}
                        <div className="lg:col-span-2 relative bg-emerald-950/20 border border-emerald-900/40 rounded-3xl aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4] overflow-hidden p-6 shadow-2xl flex flex-col justify-between">
                            {/* Pitch markings */}
                            <div className="absolute inset-6 border-2 border-white/10 rounded-2xl pointer-events-none">
                                {/* Center line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10" />
                                {/* Center circle */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/10 rounded-full" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/15 rounded-full" />

                                {/* Penalty Area Top */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-x-2 border-b-2 border-white/10">
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/15 rounded-full" />
                                    {/* Penalty Arc */}
                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-12 border-b-2 border-x-2 border-dashed border-white/10 rounded-b-full" />
                                </div>
                                {/* Goal Area Top */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-x-2 border-b-2 border-white/10" />

                                {/* Penalty Area Bottom */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-x-2 border-t-2 border-white/10">
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/15 rounded-full" />
                                    {/* Penalty Arc */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-12 border-t-2 border-x-2 border-dashed border-white/10 rounded-t-full" />
                                </div>
                                {/* Goal Area Bottom */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-x-2 border-t-2 border-white/10" />
                            </div>

                            {/* Pitch Players */}
                            <div className="absolute inset-0 w-full h-full">
                                {bestXI && Object.entries(bestXI).map(([posKey, player]) => {
                                    if (!player) return null;
                                    
                                    const coords = {
                                        GK: { x: 50, y: 88 },
                                        LB: { x: 15, y: 72 },
                                        CB_L: { x: 35, y: 75 },
                                        CB_R: { x: 65, y: 75 },
                                        RB: { x: 85, y: 72 },
                                        DM: { x: 35, y: 58 },
                                        CM: { x: 65, y: 58 },
                                        AM: { x: 50, y: 44 },
                                        LW: { x: 20, y: 22 },
                                        CF: { x: 50, y: 16 },
                                        RW: { x: 80, y: 22 }
                                    }[posKey] || { x: 50, y: 50 };

                                    return (
                                        <div 
                                            key={posKey}
                                            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group z-10"
                                            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                                        >
                                            {/* Player Node Container with flag & rating */}
                                            <div className="relative cursor-pointer transition-all duration-300 transform group-hover:scale-110 flex flex-col items-center">
                                                {/* Position Label */}
                                                <span className="text-[8px] font-black text-green-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.25 rounded-md uppercase tracking-wider mb-1 leading-none shadow-md">
                                                    {posKey.replace('_L', '').replace('_R', '')}
                                                </span>
                                                
                                                {/* Player Jersey Circle */}
                                                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-green-500 flex items-center justify-center shadow-lg group-hover:border-yellow-400 group-hover:shadow-yellow-500/20 transition-all">
                                                    <Flag code={player.teamCode} style={{ fontSize: '20px' }} />
                                                </div>

                                                {/* Rating badge overlapping jersey */}
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-950 shadow-md">
                                                    {player.score.toFixed(1)}
                                                </div>
                                            </div>
                                            
                                            {/* Player Name */}
                                            <div className="mt-2 bg-slate-900/95 border border-slate-800 rounded-lg px-2 py-1 max-w-[85px] sm:max-w-[100px] truncate text-[9px] font-bold text-white text-center shadow-lg group-hover:border-green-500/30 transition-colors whitespace-nowrap">
                                                {getLastName(player.name)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* List Detail Sidebar */}
                        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1 select-none">
                            <Card className="p-4 border-gray-800 bg-gray-900/50 flex flex-col h-full">
                                <div className="border-b border-gray-800 pb-3 mb-4 flex items-center justify-between">
                                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">Best XI Squad</h3>
                                    <Badge variant="green">MVP Form</Badge>
                                </div>
                                <div className="flex flex-col gap-2.5 overflow-y-auto flex-grow">
                                    {bestXI && Object.entries(bestXI).map(([posKey, player]) => {
                                        if (!player) return null;
                                        return (
                                            <div 
                                                key={posKey}
                                                className="flex items-center justify-between p-3 bg-gray-950/40 border border-gray-850 rounded-xl hover:border-slate-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-8 shrink-0 text-[10px] font-black text-green-400 bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.5 rounded text-center uppercase tracking-wider">
                                                        {posKey.replace('_L', '').replace('_R', '')}
                                                    </span>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <Flag code={player.teamCode} />
                                                            <span className="font-semibold text-slate-200 text-xs truncate leading-snug">{player.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 leading-none mt-1">{player.team}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Mini stats */}
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                                        {player.goals > 0 && <span>{player.goals}⚽</span>}
                                                        {player.assists > 0 && <span>{player.assists}🅰️</span>}
                                                    </div>
                                                    <span className="inline-block px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-black text-xs">
                                                        {player.score.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
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
                    <Card className="p-0 border-gray-800 bg-gray-900/50">
                        <div className="overflow-x-auto w-full scrollbar-thin">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 md:py-4">Rank</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4">Goalkeeper</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 text-center">Clean Sheets</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {goalkeepers.map((gk) => (
                                        <tr key={`${gk.name}-${gk.team}`} className="hover:bg-white/5 transition-colors">
                                            <td className="px-3 md:px-6 py-3 md:py-4 font-black text-gray-500">#{gk.rank}</td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Flag code={gk.teamCode} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white leading-tight">{gk.name}</span>
                                                        <span className="text-[10px] text-gray-500">{gk.team}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5 text-green-400 fill-green-400/20 shrink-0" />
                                                    <span className="font-black text-white text-sm md:text-base">{gk.cleanSheets}</span>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        <motion.div whileHover={{ y: -5 }}>
                            <Card
                                onClick={() => setSelectedStatModal('goals')}
                                className="text-center p-4 md:p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-green-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Goal className="w-6 h-6 md:w-8 md:h-8 text-green-400 mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Most Goals Scored</p>
                                <h4 className="text-sm md:text-2xl font-black text-white mb-1.5 md:mb-2 truncate">{teamPerformance.mostGoals.name}</h4>
                                <p className="text-lg md:text-3xl font-black text-green-400">{teamPerformance.mostGoals.value}</p>
                                <span className="text-[8px] md:text-[9px] text-green-500/80 font-black uppercase tracking-wider mt-2 md:mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card
                                onClick={() => setSelectedStatModal('defense')}
                                className="text-center p-4 md:p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-blue-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-400 mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Best Defense</p>
                                <h4 className="text-sm md:text-2xl font-black text-white mb-1.5 md:mb-2 truncate">{teamPerformance.bestDefense.name}</h4>
                                <p className="text-xs md:text-sm text-gray-400">{teamPerformance.bestDefense.value}</p>
                                <span className="text-[8px] md:text-[9px] text-blue-500/80 font-black uppercase tracking-wider mt-5 md:mt-7 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card
                                onClick={() => setSelectedStatModal('possession')}
                                className="text-center p-4 md:p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-purple-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Activity className="w-6 h-6 md:w-8 md:h-8 text-purple-400 mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Avg Possession</p>
                                <h4 className="text-sm md:text-2xl font-black text-white mb-1.5 md:mb-2 truncate">{teamPerformance.bestPossession.name}</h4>
                                <p className="text-lg md:text-3xl font-black text-purple-400">{teamPerformance.bestPossession.value}</p>
                                <span className="text-[8px] md:text-[9px] text-purple-500/80 font-black uppercase tracking-wider mt-2 md:mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }}>
                            <Card
                                onClick={() => setSelectedStatModal('passAccuracy')}
                                className="text-center p-4 md:p-6 border-gray-800 bg-gray-900/50 hover:bg-gray-800/30 hover:border-yellow-500/30 cursor-pointer transition-all duration-300 h-full group"
                            >
                                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Pass Accuracy</p>
                                <h4 className="text-sm md:text-2xl font-black text-white mb-1.5 md:mb-2 truncate">{teamPerformance.bestPassAccuracy.name}</h4>
                                <p className="text-lg md:text-3xl font-black text-yellow-400">{teamPerformance.bestPassAccuracy.value}</p>
                                <span className="text-[8px] md:text-[9px] text-yellow-500/80 font-black uppercase tracking-wider mt-2 md:mt-3 block opacity-0 group-hover:opacity-100 transition-opacity">View Top 10 →</span>
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
                    <div className="w-full">
                        <table className="w-full text-left text-xs table-fixed">
                            <colgroup>
                                <col className="w-[15%] md:w-[15%]" />
                                <col className="w-[45%] md:w-[50%]" />
                                <col className="w-[20%] md:w-[15%]" />
                                <col className="w-[20%] md:w-[20%]" />
                            </colgroup>
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-800 uppercase font-black tracking-widest text-[9px] md:text-[10px]">
                                    <th className="px-1.5 md:px-4 py-3 text-center">Rank</th>
                                    <th className="px-1 py-3">Team</th>
                                    <th className="px-1.5 md:px-4 py-3 text-center">Played</th>
                                    <th className="px-1.5 md:px-4 py-3 text-right">
                                        {selectedStatModal === 'goals' ? 'Goals' : selectedStatModal === 'defense' ? 'GA' : 'Value'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10List.map((team, idx) => (
                                    <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                        <td className="px-1.5 md:px-4 py-2.5 md:py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                        <td className="px-1 py-2.5 md:py-3 truncate">
                                            <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                                                <Flag code={team.countryCode} circular={true} className="w-5 h-5 md:w-6 md:h-6 border border-gray-800 shrink-0" style={{ width: '20px', height: '20px' }} />
                                                <span className="font-bold text-white uppercase truncate text-[11px] md:text-xs">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-1.5 md:px-4 py-2.5 md:py-3 text-center font-bold text-slate-350">{team.matchesPlayed}</td>
                                        <td className="px-1.5 md:px-4 py-2.5 md:py-3 text-right font-black text-green-400 text-xs md:text-sm">
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
                            {summaryModalType === 'goals' && (
                                <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-full max-w-xs mx-auto mb-6 shrink-0">
                                    <button
                                        onClick={() => setGoalsSubTab('scored')}
                                        className={`flex-1 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                                            goalsSubTab === 'scored' 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10' 
                                                : 'bg-transparent text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Goals to Score
                                    </button>
                                    <button
                                        onClick={() => setGoalsSubTab('conceded')}
                                        className={`flex-1 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                                            goalsSubTab === 'conceded' 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-950 shadow-md shadow-green-500/10' 
                                                : 'bg-transparent text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Goals Considered
                                    </button>
                                </div>
                            )}
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
                                            goalsSubTab === 'scored' ? (
                                                summaryBreakdownData.goals.map((team, idx) => (
                                                    <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                                        <td className="px-4 py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                                        <td className="px-2 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Flag code={team.countryCode} circular={true} className="w-6 h-6 border border-gray-800" style={{ width: '24px', height: '24px' }} />
                                                                <span className="font-bold text-white uppercase">{team.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-green-400 text-sm">{team.goalsScored}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                summaryBreakdownData.goalsConceded.map((team, idx) => (
                                                    <tr key={team.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                                                        <td className="px-4 py-3 text-center font-black text-gray-400">#{idx + 1}</td>
                                                        <td className="px-2 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Flag code={team.countryCode} circular={true} className="w-6 h-6 border border-gray-800" style={{ width: '24px', height: '24px' }} />
                                                                <span className="font-bold text-white uppercase">{team.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-green-400 text-sm">{team.goalsConceded}</td>
                                                    </tr>
                                                ))
                                            )
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
                                                className={`border-b border-gray-905/40 transition-colors hover:bg-gray-900/30 ${isQualified ? 'bg-green-500/5' : ''
                                                    }`}
                                            >
                                                <td className="px-4 py-3 text-center font-bold">
                                                    {isQualified ? (
                                                        <span className="text-green-400">#{idx + 1}</span>
                                                    ) : (
                                                        <span className="text-gray-500">#{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 font-bold text-white">
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Flag code={team.countryCode} style={{ fontSize: '1.2rem' }} className="shadow border border-gray-800" />
                                                            <span>{team.name}</span>
                                                        </div>
                                                        {isQualified && (
                                                            <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold mr-2">
                                                                Q
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center font-black text-slate-400">
                                                    Group {team.group}
                                                </td>
                                                <td className="px-3 py-3 text-center font-medium text-slate-350">
                                                    {team.played}
                                                </td>
                                                <td className={`px-3 py-3 text-center font-black ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-slate-400'
                                                    }`}>
                                                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                                                </td>
                                                <td className={`px-4 py-3 text-center font-black ${isQualified ? 'text-green-400 text-sm' : 'text-slate-300'
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

                {/* Modal for MVP Calculation Formula */}
                <AnimatePresence>
                    {showMvpFormulaModal && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setShowMvpFormulaModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
                            >
                                <button
                                    onClick={() => setShowMvpFormulaModal(false)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2 mb-4">
                                    <Award className="w-5 h-5 text-green-400" />
                                    <h4 className="font-black text-white uppercase tracking-tight text-sm">MVP Score Calculation</h4>
                                </div>
                                <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                                    <p>
                                        The Tournament MVP score is calculated dynamically using a peer-normalized, gap-based benchmark system:
                                    </p>
                                    <div className="space-y-3 font-mono text-[9px] text-green-400">
                                        <div className="bg-slate-950 p-3 border border-slate-800 rounded-2xl">
                                            <p className="font-bold text-white mb-1">🌐 LAYER 1 - Universal Quality (55% weight):</p>
                                            <p className="text-slate-300 mb-2 leading-relaxed">
                                                Measures overall quality based on match ratings and team progression:
                                            </p>
                                            <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                                                <li>⭐ <strong>Rating Score (65%):</strong> <code>clamp(((avgRating - 6.0) / 3.0) * 10, 0, 10)</code></li>
                                                <li>📈 <strong>Stage Score (35%):</strong> Furthest round reached: Group=3, R16=5, QF=7, SF=8.5, Final=9.5, Won=10</li>
                                            </ul>
                                        </div>
                                        <div className="bg-slate-950 p-3 border border-slate-800 rounded-2xl">
                                            <p className="font-bold text-white mb-1">🛡️ LAYER 2 - Position Production (45% weight):</p>
                                            <p className="text-slate-300 mb-2 leading-relaxed">
                                                Measures output using gap-based additive formulas against realistic elite benchmarks or tournament caps:
                                            </p>
                                            <ul className="list-disc pl-4 space-y-1 text-slate-300">
                                                <li>🧤 <strong>GK:</strong> <code>(CS_rate * 5) + (save% / 100 * 3) + (min(saves, 15) / 15 * 2)</code></li>
                                                <li>🛡️ <strong>CB:</strong> sum of defensive actions (target 35) and CS (target 4) scores.</li>
                                                <li>🏃 <strong>FB:</strong> sum of defensive actions (target 25) and assists (target 1.5) scores.</li>
                                                <li>⚡ <strong>DM/CM:</strong> sum of defensive actions (target 20) and attacking contributions (target 4.0) scores.</li>
                                                <li>🔥 <strong>AM/W/FW:</strong> <code>clamp(10 - (maxGoalContribs - playerOutput) * 0.6, 0, 10)</code></li>
                                            </ul>
                                            <p className="text-[8px] text-slate-400 mt-2 leading-relaxed">
                                                * CS = Clean Sheets. defActions = Tackles + Interceptions + Clearances. All metrics are clamped between 0 and 10.
                                            </p>
                                        </div>
                                        <div className="bg-slate-950 p-3 border border-slate-800 rounded-2xl">
                                            <p className="font-bold text-white mb-1">🎁 MOTM BONUS (Added Extra):</p>
                                            <p className="text-slate-300 leading-normal">
                                                <code>motmBonus = min(MOTMs * 0.3, 1.5)</code>
                                            </p>
                                            <p className="text-[8px] text-slate-400 mt-1 leading-normal">
                                                * Treated as a small capped bonus rather than a core weighted pillar, preventing goal-scorers from structurally dominating the rankings.
                                            </p>
                                        </div>
                                        <div className="bg-slate-950 p-3 border border-slate-800 rounded-2xl">
                                            <p className="font-bold text-white mb-1">🧮 FINAL MVP SCORE:</p>
                                            <p className="text-slate-300 leading-normal">
                                                <code>raw = clamp((0.55 * universal) + (0.45 * productionScore) + motmBonus, 0, 10)</code>
                                            </p>
                                            <p className="text-slate-300 leading-normal">
                                                <code>mvpScore = round(raw * 0.96, 1)</code>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500">
                                        * Benchmarking defensive positions against realistic elite thresholds ensures all roles can compete equally for the MVP award.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMvpFormulaModal(false)}
                                    className="w-full mt-6 py-2.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors border-none cursor-pointer"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
};

export default Standings;