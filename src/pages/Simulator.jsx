import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GroupTable from '../components/simulator/GroupTable';
import KnockoutBracket from '../components/simulator/KnockoutBracket';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Landmark, Play, Pause, FastForward, RotateCcw, ArrowRight, ArrowLeft, Save, User, Sparkles, ListFilter } from 'lucide-react';
import { getRoundOf32Pairings } from '../utils/knockoutAllocation';
import { simulateMatchWithEvents, generateScorersForManualScore, getStartingLineupSquad } from '../utils/simulationHelpers';
import { useTournamentStore } from '../store/tournamentStore';
import { getHistoricalTeamDetails } from '../data/historicalData';

const getGoalkeeper = (team) => {
  if (!team) return { name: 'Unknown GK' };
  const squad = getStartingLineupSquad(team);
  return squad.find(p => p.position === 'GK') || { name: `${team.name} GK` };
};

// Confetti Canvas Component for Celebration
const ConfettiCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      
      update();
      animationFrameId = requestAnimationFrame(draw);
    };
    
    const update = () => {
      particles.forEach((p) => {
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;
        
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }
      });
    };
    
    draw();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
};



const Simulator = () => {
  const { teams: originalTeams, matches, loading } = useTournament();
  const { historicalSwaps } = useTournamentStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const teams = useMemo(() => {
    if (!historicalSwaps || Object.keys(historicalSwaps).length === 0) return originalTeams;

    return originalTeams.map(t => {
      const swapId = historicalSwaps[t.id];
      if (!swapId) return t;

      const histTeam = getHistoricalTeamDetails(t.id, swapId, originalTeams);
      if (!histTeam) return t;

      const histSquad = histTeam.players
        ? histTeam.players.map(p => ({
            name: p.name,
            position: p.position,
            number: p.number,
            club: 'Legend'
          }))
        : [
            ...histTeam.notablePlayers.map((name, i) => ({
              name,
              position: i === 0 ? 'FW' : (i === 1 ? 'MF' : 'DF'),
              club: 'Legend'
            })),
            { name: `${histTeam.teamName} GK`, position: 'GK', club: 'Legend' }
          ];

      return {
        ...t,
        name: `${histTeam.teamName} (${histTeam.year})`,
        fifaRanking: 1,
        ranking: 1,
        isHistorical: true,
        squad: histSquad
      };
    });
  }, [originalTeams, historicalSwaps]);


  // local simulation state variables (clean slate, independent of db matches)
  const [simState, setSimState] = useState('idle'); // idle | simulating_groups | groups_completed | simulating_knockouts | completed
  const [simMatches, setSimMatches] = useState([]);
  const [currentGroupMatchIndex, setCurrentGroupMatchIndex] = useState(0);
  
  // Setup configuration states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [resultsModalTab, setResultsModalTab] = useState('groups');
  const [simType, setSimType] = useState('auto'); // auto | manual
  const [realismCategory, setRealismCategory] = useState('realistic'); // favorites | realistic | moderate | unrealistic | underdog
  const [manualScorers, setManualScorers] = useState(false);
  const [scriptedMatchup, setScriptedMatchup] = useState({
    enabled: false,
    team1: '',
    team2: '',
    stage: 'final'
  });

  // Speed and Pause controls (for auto mode)
  const [simSpeed, setSimSpeed] = useState(1); // 1 = 1x (3s), 2 = 2x (1.5s), 5 = 5x (0.6s), 100 = Instant (0.01s)
  const [isPaused, setIsPaused] = useState(false);

  // Live match simulation tick states (for auto mode)
  const [liveMatchClock, setLiveMatchClock] = useState(0);
  const [liveScore, setLiveScore] = useState([0, 0]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [activeSimulationDetails, setActiveSimulationDetails] = useState(null);

  // Manual Match Entry States
  const [manualHomeScore, setManualHomeScore] = useState(0);
  const [manualAwayScore, setManualAwayScore] = useState(0);
  const [manualHomeScorers, setManualHomeScorers] = useState([]); // array of { name, minute }
  const [manualAwayScorers, setManualAwayScorers] = useState([]); // array of { name, minute }
  const [manualKnockoutWinner, setManualKnockoutWinner] = useState('home'); // home | away

  // Knockout brackets simulation state
  const [knockoutRounds, setKnockoutRounds] = useState({
    roundOf32: [],
    roundOf16: [],
    quarterFinals: [],
    semiFinals: [],
    thirdPlace: null,
    final: null,
    winner: null
  });
  const [currentKnockoutRound, setCurrentKnockoutRound] = useState('roundOf32'); // roundOf32 | roundOf16 | quarterFinals | semiFinals | thirdPlace/final
  const [currentKnockoutMatchIndex, setCurrentKnockoutMatchIndex] = useState(0);

  // Player Stats for Awards
  const [playerStats, setPlayerStats] = useState({
    goals: {}, // name -> { count, team }
    assists: {}, // name -> { count, team }
    cleanSheets: {} // name -> { count, team }
  });

  const [detailedStatsModal, setDetailedStatsModal] = useState(null); // null | { type, title, data }
  const [knockoutViewTab, setKnockoutViewTab] = useState('bracket'); // bracket | standings

  const tickerTimerRef = useRef(null);
  const pauseDelayRef = useRef(null);
  const savedSimRef = useRef(false);

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Initialize clean matches on first load
  useEffect(() => {
    if (matches.length > 0) {
      const cleaned = matches.map(m => ({
        ...m,
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
        scorers: [],
        cards: []
      }));
      setSimMatches(cleaned);
    }
  }, [matches]);

  // Adjust manual scorers array when scores change
  useEffect(() => {
    if (activeSimulationDetails && simType === 'manual') {
      const { teamA, teamB } = activeSimulationDetails;
      
      // Home team
      setManualHomeScorers(prev => {
        const next = [...prev];
        if (next.length < manualHomeScore) {
          while (next.length < manualHomeScore) {
            next.push({ name: teamA.squad?.[0]?.name || '', minute: 10 + next.length * 15 });
          }
        } else if (next.length > manualHomeScore) {
          return next.slice(0, manualHomeScore);
        }
        return next;
      });

      // Away team
      setManualAwayScorers(prev => {
        const next = [...prev];
        if (next.length < manualAwayScore) {
          while (next.length < manualAwayScore) {
            next.push({ name: teamB.squad?.[0]?.name || '', minute: 15 + next.length * 15 });
          }
        } else if (next.length > manualAwayScore) {
          return next.slice(0, manualAwayScore);
        }
        return next;
      });
    }
  }, [manualHomeScore, manualAwayScore, activeSimulationDetails, simType]);

  // Compute standings reactively based on local simulation matches + manual live input
  const simGroupStandings = useMemo(() => {
    const standings = {};

    // Initialize
    teams.forEach(team => {
      if (!standings[team.group]) {
        standings[team.group] = [];
      }
      standings[team.group].push({
        ...team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      });
    });

    // Blend completed matches and the CURRENT manual active match
    simMatches.forEach((match, index) => {
      let homeScore = match.homeScore;
      let awayScore = match.awayScore;
      let isCompleted = match.status === 'completed';

      // If we are currently entering the score manually for this match, calculate standings live!
      if (simState === 'simulating_groups' && simType === 'manual' && index === currentGroupMatchIndex && activeSimulationDetails) {
        homeScore = manualHomeScore;
        awayScore = manualAwayScore;
        isCompleted = true;
      }

      if (!isCompleted || homeScore === null || awayScore === null) return;
      if (match.match_id > 72) return; // Only process group stage matches for group standings
      const group = standings[match.group];
      if (!group) return;

      const homeTeam = group.find(t => t.id === match.homeTeam);
      const awayTeam = group.find(t => t.id === match.awayTeam);

      if (!homeTeam || !awayTeam) return;

      homeTeam.played += 1;
      awayTeam.played += 1;
      homeTeam.gf += homeScore;
      homeTeam.ga += awayScore;
      awayTeam.gf += awayScore;
      awayTeam.ga += homeScore;

      if (homeScore > awayScore) {
        homeTeam.won += 1;
        homeTeam.pts += 3;
        awayTeam.lost += 1;
      } else if (homeScore < awayScore) {
        awayTeam.won += 1;
        awayTeam.pts += 3;
        homeTeam.lost += 1;
      } else {
        homeTeam.drawn += 1;
        awayTeam.drawn += 1;
        homeTeam.pts += 1;
        awayTeam.pts += 1;
      }

      homeTeam.gd = homeTeam.gf - homeTeam.ga;
      awayTeam.gd = awayTeam.gf - awayTeam.ga;
    });

    // Sort
    Object.keys(standings).forEach(groupKey => {
      standings[groupKey].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
    });

    return standings;
  }, [teams, simMatches, simState, simType, currentGroupMatchIndex, manualHomeScore, manualAwayScore, activeSimulationDetails]);

  // Compute best third place wildcard rankings
  const bestThirdPlaceTeams = useMemo(() => {
    if (Object.keys(simGroupStandings).length === 0) return [];
    const thirdPlaceList = [];
    groups.forEach(g => {
      const groupTeams = simGroupStandings[g];
      if (groupTeams && groupTeams.length >= 3) {
        thirdPlaceList.push(groupTeams[2]);
      }
    });

    return [...thirdPlaceList]
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }, [simGroupStandings]);

  // Check which best 3rd place teams actually qualify (top 8)
  const bestThirdQualifiers = useMemo(() => {
    return bestThirdPlaceTeams.slice(0, 8);
  }, [bestThirdPlaceTeams]);

  // Launch simulator with setup parameters
  const executeLaunchSimulation = () => {
    if (scriptedMatchup.enabled && (!scriptedMatchup.team1 || !scriptedMatchup.team2)) {
      alert("Please select both teams for the custom scripted matchup, or disable the option.");
      return;
    }
    setShowSetupModal(false);
    
    // Reset state
    const cleaned = matches.map(m => ({
      ...m,
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      scorers: [],
      cards: []
    }));
    setSimMatches(cleaned);
    setCurrentGroupMatchIndex(0);
    setPlayerStats({ goals: {}, assists: {}, cleanSheets: {} });
    setKnockoutRounds({
      roundOf32: [],
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      thirdPlace: null,
      final: null,
      winner: null
    });
    setCurrentKnockoutRound('roundOf32');
    setCurrentKnockoutMatchIndex(0);
    setIsPaused(false);

    // Initial manual match reset
    setManualHomeScore(0);
    setManualAwayScore(0);
    setManualHomeScorers([]);
    setManualAwayScorers([]);

    // Open screen
    setSimState('simulating_groups');
  };

  useEffect(() => {
    const shouldStart = sessionStorage.getItem('startHistoricalSim');
    if (shouldStart === 'true' && simMatches.length > 0) {
      sessionStorage.removeItem('startHistoricalSim');
      setSimType('auto');
      setRealismCategory('realistic');
      executeLaunchSimulation();
    }
  }, [simMatches.length]);

  const getForcedWinnerIdForGroupMatch = (match) => {
    if (!scriptedMatchup.enabled) return null;
    const isTeam1Match = match.homeTeam === scriptedMatchup.team1 || match.awayTeam === scriptedMatchup.team1;
    const isTeam2Match = match.homeTeam === scriptedMatchup.team2 || match.awayTeam === scriptedMatchup.team2;
    const isHeadToHead = (match.homeTeam === scriptedMatchup.team1 && match.awayTeam === scriptedMatchup.team2) ||
                         (match.homeTeam === scriptedMatchup.team2 && match.awayTeam === scriptedMatchup.team1);

    if (isHeadToHead) {
      return null;
    }
    if (isTeam1Match) {
      return scriptedMatchup.team1;
    }
    if (isTeam2Match) {
      return scriptedMatchup.team2;
    }
    return null;
  };

  const roundOrder = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals', 'final'];
  
  const getForcedWinnerIdForKnockoutMatch = (match, currentRound) => {
    if (!scriptedMatchup.enabled) return null;
    
    // We only force wins in rounds before the target stage
    if (roundOrder.indexOf(currentRound) >= roundOrder.indexOf(scriptedMatchup.stage)) {
      return null;
    }

    if (match.t1.id === scriptedMatchup.team1 || match.t1.id === scriptedMatchup.team2) {
      return match.t1.id;
    }
    if (match.t2.id === scriptedMatchup.team1 || match.t2.id === scriptedMatchup.team2) {
      return match.t2.id;
    }
    return null;
  };

  const alignBracketForScriptedMatchup = (pairings, team1Id, team2Id, stage) => {
    const team1Obj = teams.find(t => t.id === team1Id);
    const team2Obj = teams.find(t => t.id === team2Id);
    if (!team1Obj || !team2Obj) return pairings;

    let m1 = 0, m2 = 8;
    if (stage === 'roundOf32') {
      m1 = 0; m2 = 0;
    } else if (stage === 'roundOf16') {
      m1 = 0; m2 = 1;
    } else if (stage === 'quarterFinals') {
      m1 = 0; m2 = 2;
    } else if (stage === 'semiFinals') {
      m1 = 0; m2 = 4;
    } else if (stage === 'final') {
      m1 = 0; m2 = 8;
    }

    let pos1 = null;
    let pos2 = null;

    for (let i = 0; i < pairings.length; i++) {
      if (pairings[i].t1?.id === team1Id) pos1 = { matchIndex: i, side: 't1' };
      if (pairings[i].t2?.id === team1Id) pos1 = { matchIndex: i, side: 't2' };
      if (pairings[i].t1?.id === team2Id) pos2 = { matchIndex: i, side: 't1' };
      if (pairings[i].t2?.id === team2Id) pos2 = { matchIndex: i, side: 't2' };
    }

    const target1 = { matchIndex: m1, side: 't1' };
    const target2 = { matchIndex: m2, side: (m1 === m2 ? 't2' : 't1') };

    const swapPositions = (p1, p2) => {
      const temp = pairings[p1.matchIndex][p1.side];
      pairings[p1.matchIndex][p1.side] = pairings[p2.matchIndex][p2.side];
      pairings[p2.matchIndex][p2.side] = temp;
    };

    if (pos1) {
      if (pos1.matchIndex !== target1.matchIndex || pos1.side !== target1.side) {
        swapPositions(pos1, target1);
        if (pos2 && pos2.matchIndex === target1.matchIndex && pos2.side === target1.side) {
          pos2 = { ...pos1 };
        }
      }
    } else {
      pairings[target1.matchIndex][target1.side] = team1Obj;
    }

    if (pos2) {
      if (pos2.matchIndex !== target2.matchIndex || pos2.side !== target2.side) {
        swapPositions(pos2, target2);
      }
    } else {
      pairings[target2.matchIndex][target2.side] = team2Obj;
    }

    return pairings;
  };

  // Skip group stage simulation instantly (Auto Mode Only)
  const skipGroupStageSimulation = () => {
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    if (pauseDelayRef.current) clearTimeout(pauseDelayRef.current);

    const updatedMatches = [...simMatches];
    const newPlayerStats = { ...playerStats };

    for (let i = currentGroupMatchIndex; i < 72; i++) {
      const match = updatedMatches[i];
      const teamA = teams.find(t => t.id === match.homeTeam);
      const teamB = teams.find(t => t.id === match.awayTeam);
      const forcedWinnerId = getForcedWinnerIdForGroupMatch(match);
      const result = simulateMatchWithEvents(teamA, teamB, false, realismCategory, forcedWinnerId);

      match.status = 'completed';
      match.homeScore = result.homeScore;
      match.awayScore = result.awayScore;
      match.scorers = result.scorers;
      match.cards = result.cards;

      // Update goal scorers
      result.scorers.forEach(s => {
        newPlayerStats.goals[s.name] = {
          count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
          team: s.teamId === teamA.id ? teamA : teamB
        };
        if (s.assist) {
          newPlayerStats.assists[s.assist] = {
            count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
            team: s.teamId === teamA.id ? teamA : teamB
          };
        }
      });

      // Update goalkeeper clean sheets
      if (result.homeScore === 0) {
        const gk = getGoalkeeper(teamB);
        newPlayerStats.cleanSheets[gk.name] = {
          count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
          team: teamB
        };
      }
      if (result.awayScore === 0) {
        const gk = getGoalkeeper(teamA);
        newPlayerStats.cleanSheets[gk.name] = {
          count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
          team: teamA
        };
      }
    }

    setSimMatches(updatedMatches);
    setPlayerStats(newPlayerStats);
    setSimState('groups_completed');
  };

  // Auto Simulation Match-by-Match trigger loop
  useEffect(() => {
    if (simState === 'simulating_groups' && simType === 'auto') {
      if (isPaused) {
        if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
        return;
      }

      const match = simMatches[currentGroupMatchIndex];
      if (!match) return;

      const teamA = teams.find(t => t.id === match.homeTeam);
      const teamB = teams.find(t => t.id === match.awayTeam);

      const forcedWinnerId = getForcedWinnerIdForGroupMatch(match);
      // Simulate upfront using selected realism categories
      const result = simulateMatchWithEvents(teamA, teamB, false, realismCategory, forcedWinnerId);
      setActiveSimulationDetails({
        match,
        teamA,
        teamB,
        result
      });

      setLiveMatchClock(0);
      setLiveScore([0, 0]);
      setLiveEvents([]);

      let gameMin = 0;
      const totalMinutes = 90;
      const intervalMs = simSpeed === 100 ? 1 : Math.max(5, (3000 / simSpeed) / totalMinutes);

      tickerTimerRef.current = setInterval(() => {
        gameMin += 1;
        setLiveMatchClock(gameMin);

        const activeEvents = result.events.filter(e => e.minute <= gameMin);
        setLiveEvents(activeEvents);

        const goalsA = activeEvents.filter(e => e.type === 'goal' && e.teamId === teamA.id).length;
        const goalsB = activeEvents.filter(e => e.type === 'goal' && e.teamId === teamB.id).length;
        setLiveScore([goalsA, goalsB]);

        if (gameMin >= totalMinutes) {
          clearInterval(tickerTimerRef.current);
          
          // Complete the match
          const updatedMatches = [...simMatches];
          updatedMatches[currentGroupMatchIndex] = {
            ...match,
            status: 'completed',
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            scorers: result.scorers,
            cards: result.cards
          };
          setSimMatches(updatedMatches);

          // Update stats
          const newPlayerStats = { ...playerStats };
          result.scorers.forEach(s => {
            newPlayerStats.goals[s.name] = {
              count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
              team: s.teamId === teamA.id ? teamA : teamB
            };
            if (s.assist) {
              newPlayerStats.assists[s.assist] = {
                count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
                team: s.teamId === teamA.id ? teamA : teamB
              };
            }
          });

          if (result.homeScore === 0) {
            const gk = getGoalkeeper(teamB);
            newPlayerStats.cleanSheets[gk.name] = {
              count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
              team: teamB
            };
          }
          if (result.awayScore === 0) {
            const gk = getGoalkeeper(teamA);
            newPlayerStats.cleanSheets[gk.name] = {
              count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
              team: teamA
            };
          }
          setPlayerStats(newPlayerStats);

          const delay = simSpeed === 100 ? 5 : 1500 / simSpeed;
          pauseDelayRef.current = setTimeout(() => {
            if (currentGroupMatchIndex < 71) {
              setCurrentGroupMatchIndex(prev => prev + 1);
            } else {
              setSimState('groups_completed');
            }
          }, delay);
        }
      }, intervalMs);

      return () => {
        clearInterval(tickerTimerRef.current);
        clearTimeout(pauseDelayRef.current);
      };
    }
  }, [simState, currentGroupMatchIndex, isPaused, simSpeed, simType]);

  // Setup active match when currentGroupMatchIndex shifts (For Manual Mode Setup)
  useEffect(() => {
    if (simState === 'simulating_groups' && simType === 'manual') {
      const match = simMatches[currentGroupMatchIndex];
      if (match) {
        const teamA = teams.find(t => t.id === match.homeTeam);
        const teamB = teams.find(t => t.id === match.awayTeam);
        setActiveSimulationDetails({
          match,
          teamA,
          teamB
        });
        setManualHomeScore(0);
        setManualAwayScore(0);
        setManualHomeScorers([]);
        setManualAwayScorers([]);
      }
    }
  }, [currentGroupMatchIndex, simState, simType]);

  // Save manual match scores (Group Stage)
  const saveManualGroupMatch = () => {
    const { match, teamA, teamB } = activeSimulationDetails;
    let finalScorers = [];
    let finalCards = [];
    let finalEvents = [];

    if (manualScorers) {
      // User manual selections
      manualHomeScorers.forEach(s => {
        const startingSquad = getStartingLineupSquad(teamA);
        const scorerName = s.name || startingSquad?.[0]?.name || 'Unknown Scorer';
        const hasAssist = Math.random() < 0.7;
        const outfieldPlayers = startingSquad?.filter(p => p.name !== scorerName && p.position !== 'GK') || [];
        const assister = (hasAssist && outfieldPlayers.length > 0)
          ? outfieldPlayers[Math.floor(Math.random() * outfieldPlayers.length)]
          : null;

        finalScorers.push({
          name: scorerName,
          teamId: teamA.id,
          minute: parseInt(s.minute, 10) || 30,
          assist: assister ? assister.name : null
        });
        finalEvents.push({
          type: 'goal',
          minute: parseInt(s.minute, 10) || 30,
          teamId: teamA.id,
          teamName: teamA.name,
          player: scorerName,
          assist: assister ? assister.name : null,
          detail: `Goal! ${teamA.name} scores.`
        });
      });
      
      manualAwayScorers.forEach(s => {
        const startingSquad = getStartingLineupSquad(teamB);
        const scorerName = s.name || startingSquad?.[0]?.name || 'Unknown Scorer';
        const hasAssist = Math.random() < 0.7;
        const outfieldPlayers = startingSquad?.filter(p => p.name !== scorerName && p.position !== 'GK') || [];
        const assister = (hasAssist && outfieldPlayers.length > 0)
          ? outfieldPlayers[Math.floor(Math.random() * outfieldPlayers.length)]
          : null;

        finalScorers.push({
          name: scorerName,
          teamId: teamB.id,
          minute: parseInt(s.minute, 10) || 35,
          assist: assister ? assister.name : null
        });
        finalEvents.push({
          type: 'goal',
          minute: parseInt(s.minute, 10) || 35,
          teamId: teamB.id,
          teamName: teamB.name,
          player: scorerName,
          assist: assister ? assister.name : null,
          detail: `Goal! ${teamB.name} scores.`
        });
      });
    } else {
      // Auto scorers generator based on scores
      const res = generateScorersForManualScore(teamA, teamB, manualHomeScore, manualAwayScore);
      finalScorers = res.scorers;
      finalCards = res.cards;
      finalEvents = res.events;
    }

    const updatedMatches = [...simMatches];
    updatedMatches[currentGroupMatchIndex] = {
      ...match,
      status: 'completed',
      homeScore: manualHomeScore,
      awayScore: manualAwayScore,
      scorers: finalScorers,
      cards: finalCards
    };
    setSimMatches(updatedMatches);

    // Update Player Stats
    const newPlayerStats = { ...playerStats };
    finalScorers.forEach(s => {
      newPlayerStats.goals[s.name] = {
        count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
        team: s.teamId === teamA.id ? teamA : teamB
      };
      if (s.assist) {
        newPlayerStats.assists[s.assist] = {
          count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
          team: s.teamId === teamA.id ? teamA : teamB
        };
      }
    });

    if (manualHomeScore === 0) {
      const gk = getGoalkeeper(teamB);
      newPlayerStats.cleanSheets[gk.name] = {
        count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
        team: teamB
      };
    }
    if (manualAwayScore === 0) {
      const gk = getGoalkeeper(teamA);
      newPlayerStats.cleanSheets[gk.name] = {
        count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
        team: teamA
      };
    }
    setPlayerStats(newPlayerStats);

    // Proceed
    if (currentGroupMatchIndex < 71) {
      setCurrentGroupMatchIndex(prev => prev + 1);
    } else {
      setSimState('groups_completed');
    }
  };

  // Proceed to Knockout bracket computation
  const proceedToKnockouts = () => {
    const fallbackTeam = (name) => ({ id: 'tbd', name: name || 'TBD', code: 'TBD', countryCode: '' });
    const getTeam = (team, fallbackName) => team || fallbackTeam(fallbackName);

    const w = (group) => simGroupStandings[group]?.[0];
    const ru = (group) => simGroupStandings[group]?.[1];

    const pairings = getRoundOf32Pairings(w, ru, bestThirdQualifiers, getTeam, true);

    let alignedPairings = [...pairings];
    if (scriptedMatchup.enabled) {
      alignedPairings = alignBracketForScriptedMatchup(alignedPairings, scriptedMatchup.team1, scriptedMatchup.team2, scriptedMatchup.stage);
    }

    const r32Matches = alignedPairings.map(p => ({
      t1: p.t1,
      t2: p.t2,
      score: [null, null],
      winner: null,
      status: 'scheduled'
    }));

    setKnockoutRounds({
      roundOf32: r32Matches,
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      thirdPlace: null,
      final: null,
      winner: null
    });
    setCurrentKnockoutRound('roundOf32');
    setCurrentKnockoutMatchIndex(0);
    setIsPaused(true);
    setSimState('simulating_knockouts');
  };

  // Start active round of knockout stages (Auto Mode)
  const simulateActiveKnockoutRound = () => {
    setIsPaused(false);
    setCurrentKnockoutMatchIndex(0);
  };

  // Setup active knockout match for manual entry
  useEffect(() => {
    if (simState === 'simulating_knockouts' && simType === 'manual') {
      const activeRoundKey = currentKnockoutRound;
      const roundMatches = activeRoundKey === 'final' 
        ? [knockoutRounds.thirdPlace, knockoutRounds.final].filter(Boolean)
        : knockoutRounds[activeRoundKey];
      
      const match = roundMatches[currentKnockoutMatchIndex];
      if (match) {
        setActiveSimulationDetails({
          match,
          teamA: match.t1,
          teamB: match.t2
        });
        setManualHomeScore(0);
        setManualAwayScore(0);
        setManualHomeScorers([]);
        setManualAwayScorers([]);
        setManualKnockoutWinner('home');
      }
    }
  }, [currentKnockoutMatchIndex, currentKnockoutRound, simState, simType, knockoutRounds]);

  // Save manual match scores (Knockout Stage)
  const saveManualKnockoutMatch = () => {
    const { match, teamA, teamB } = activeSimulationDetails;
    let finalScorers = [];
    let finalCards = [];
    let finalEvents = [];

    if (manualScorers) {
      manualHomeScorers.forEach(s => {
        const startingSquad = getStartingLineupSquad(teamA);
        const scorerName = s.name || startingSquad?.[0]?.name || 'Unknown Scorer';
        const hasAssist = Math.random() < 0.7;
        const outfieldPlayers = startingSquad?.filter(p => p.name !== scorerName && p.position !== 'GK') || [];
        const assister = (hasAssist && outfieldPlayers.length > 0)
          ? outfieldPlayers[Math.floor(Math.random() * outfieldPlayers.length)]
          : null;

        finalScorers.push({
          name: scorerName,
          teamId: teamA.id,
          minute: parseInt(s.minute, 10) || 30,
          assist: assister ? assister.name : null
        });
      });
      manualAwayScorers.forEach(s => {
        const startingSquad = getStartingLineupSquad(teamB);
        const scorerName = s.name || startingSquad?.[0]?.name || 'Unknown Scorer';
        const hasAssist = Math.random() < 0.7;
        const outfieldPlayers = startingSquad?.filter(p => p.name !== scorerName && p.position !== 'GK') || [];
        const assister = (hasAssist && outfieldPlayers.length > 0)
          ? outfieldPlayers[Math.floor(Math.random() * outfieldPlayers.length)]
          : null;

        finalScorers.push({
          name: scorerName,
          teamId: teamB.id,
          minute: parseInt(s.minute, 10) || 35,
          assist: assister ? assister.name : null
        });
      });
    } else {
      const res = generateScorersForManualScore(teamA, teamB, manualHomeScore, manualAwayScore);
      finalScorers = res.scorers;
      finalCards = res.cards;
      finalEvents = res.events;
    }

    // Determine winner
    let winner = teamA;
    let loser = teamB;

    if (manualHomeScore > manualAwayScore) {
      winner = teamA;
      loser = teamB;
    } else if (manualAwayScore > manualHomeScore) {
      winner = teamB;
      loser = teamA;
    } else {
      // Tied in knockout, use manual toggle
      winner = manualKnockoutWinner === 'home' ? teamA : teamB;
      loser = manualKnockoutWinner === 'home' ? teamB : teamA;
    }

    const completedMatch = {
      ...match,
      status: 'completed',
      score: [manualHomeScore, manualAwayScore],
      winner,
      loser,
      scorers: finalScorers,
      cards: finalCards,
      isPenalties: manualHomeScore === manualAwayScore
    };

    const roundsCopy = { ...knockoutRounds };
    const activeRoundKey = currentKnockoutRound;

    if (activeRoundKey === 'final') {
      if (currentKnockoutMatchIndex === 0) {
        roundsCopy.thirdPlace = completedMatch;
      } else {
        roundsCopy.final = completedMatch;
      }
    } else {
      roundsCopy[activeRoundKey][currentKnockoutMatchIndex] = completedMatch;
    }
    setKnockoutRounds(roundsCopy);

    // Update Player Stats
    const newPlayerStats = { ...playerStats };
    finalScorers.forEach(s => {
      newPlayerStats.goals[s.name] = {
        count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
        team: s.teamId === teamA.id ? teamA : teamB
      };
      if (s.assist) {
        newPlayerStats.assists[s.assist] = {
          count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
          team: s.teamId === teamA.id ? teamA : teamB
        };
      }
    });

    if (manualHomeScore === 0) {
      const gk = getGoalkeeper(teamB);
      newPlayerStats.cleanSheets[gk.name] = {
        count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
        team: teamB
      };
    }
    if (manualAwayScore === 0) {
      const gk = getGoalkeeper(teamA);
      newPlayerStats.cleanSheets[gk.name] = {
        count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
        team: teamA
      };
    }
    setPlayerStats(newPlayerStats);

    // Proceed to next match or next round
    const activeRoundMatches = activeRoundKey === 'final' 
      ? [knockoutRounds.thirdPlace, knockoutRounds.final].filter(Boolean)
      : knockoutRounds[activeRoundKey];

    if (currentKnockoutMatchIndex < activeRoundMatches.length - 1) {
      setCurrentKnockoutMatchIndex(prev => prev + 1);
    } else {
      resolveNextKnockoutRound(roundsCopy);
    }
  };

  // Revert last manual group match score and go back
  const handlePreviousGroupMatch = () => {
    if (currentGroupMatchIndex <= 0) return;
    
    const prevIndex = currentGroupMatchIndex - 1;
    const prevMatch = simMatches[prevIndex];
    if (!prevMatch) return;
    
    if (prevMatch.status === 'completed') {
      const newPlayerStats = { ...playerStats };
      const teamA = teams.find(t => t.name === prevMatch.home);
      const teamB = teams.find(t => t.name === prevMatch.away);
      
      if (prevMatch.scorers) {
        prevMatch.scorers.forEach(s => {
          if (newPlayerStats.goals[s.name]) {
            newPlayerStats.goals[s.name].count = Math.max(0, newPlayerStats.goals[s.name].count - 1);
            if (newPlayerStats.goals[s.name].count === 0) {
              delete newPlayerStats.goals[s.name];
            }
          }
          if (s.assist && newPlayerStats.assists[s.assist]) {
            newPlayerStats.assists[s.assist].count = Math.max(0, newPlayerStats.assists[s.assist].count - 1);
            if (newPlayerStats.assists[s.assist].count === 0) {
              delete newPlayerStats.assists[s.assist];
            }
          }
        });
      }
      
      if (teamA && teamB) {
        if (prevMatch.homeScore === 0) {
          const gk = getGoalkeeper(teamB);
          if (newPlayerStats.cleanSheets[gk.name]) {
            newPlayerStats.cleanSheets[gk.name].count = Math.max(0, newPlayerStats.cleanSheets[gk.name].count - 1);
            if (newPlayerStats.cleanSheets[gk.name].count === 0) {
              delete newPlayerStats.cleanSheets[gk.name];
            }
          }
        }
        if (prevMatch.awayScore === 0) {
          const gk = getGoalkeeper(teamA);
          if (newPlayerStats.cleanSheets[gk.name]) {
            newPlayerStats.cleanSheets[gk.name].count = Math.max(0, newPlayerStats.cleanSheets[gk.name].count - 1);
            if (newPlayerStats.cleanSheets[gk.name].count === 0) {
              delete newPlayerStats.cleanSheets[gk.name];
            }
          }
        }
      }
      
      setPlayerStats(newPlayerStats);
    }
    
    const updatedMatches = [...simMatches];
    updatedMatches[prevIndex] = {
      ...prevMatch,
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      scorers: [],
      cards: []
    };
    setSimMatches(updatedMatches);
    setCurrentGroupMatchIndex(prevIndex);
  };

  // Revert last manual knockout match score and go back
  const handlePreviousKnockoutMatch = () => {
    if (currentKnockoutMatchIndex <= 0) return;
    
    const prevIndex = currentKnockoutMatchIndex - 1;
    const activeRoundKey = currentKnockoutRound;
    
    const roundsCopy = { ...knockoutRounds };
    let prevMatch = null;
    if (activeRoundKey === 'final') {
      if (prevIndex === 0) {
        prevMatch = roundsCopy.thirdPlace;
      } else {
        prevMatch = roundsCopy.final;
      }
    } else {
      prevMatch = roundsCopy[activeRoundKey][prevIndex];
    }
    
    if (!prevMatch) return;
    
    if (prevMatch.status === 'completed') {
      const newPlayerStats = { ...playerStats };
      const teamA = prevMatch.t1;
      const teamB = prevMatch.t2;
      
      if (prevMatch.scorers) {
        prevMatch.scorers.forEach(s => {
          if (newPlayerStats.goals[s.name]) {
            newPlayerStats.goals[s.name].count = Math.max(0, newPlayerStats.goals[s.name].count - 1);
            if (newPlayerStats.goals[s.name].count === 0) {
              delete newPlayerStats.goals[s.name];
            }
          }
          if (s.assist && newPlayerStats.assists[s.assist]) {
            newPlayerStats.assists[s.assist].count = Math.max(0, newPlayerStats.assists[s.assist].count - 1);
            if (newPlayerStats.assists[s.assist].count === 0) {
              delete newPlayerStats.assists[s.assist];
            }
          }
        });
      }
      
      if (teamA && teamB) {
        if (prevMatch.score[0] === 0) {
          const gk = getGoalkeeper(teamB);
          if (newPlayerStats.cleanSheets[gk.name]) {
            newPlayerStats.cleanSheets[gk.name].count = Math.max(0, newPlayerStats.cleanSheets[gk.name].count - 1);
            if (newPlayerStats.cleanSheets[gk.name].count === 0) {
              delete newPlayerStats.cleanSheets[gk.name];
            }
          }
        }
        if (prevMatch.score[1] === 0) {
          const gk = getGoalkeeper(teamA);
          if (newPlayerStats.cleanSheets[gk.name]) {
            newPlayerStats.cleanSheets[gk.name].count = Math.max(0, newPlayerStats.cleanSheets[gk.name].count - 1);
            if (newPlayerStats.cleanSheets[gk.name].count === 0) {
              delete newPlayerStats.cleanSheets[gk.name];
            }
          }
        }
      }
      
      setPlayerStats(newPlayerStats);
    }
    
    const completedMatch = {
      ...prevMatch,
      status: 'scheduled',
      score: [null, null],
      winner: null,
      loser: null,
      scorers: [],
      cards: [],
      isPenalties: false
    };
    
    if (activeRoundKey === 'final') {
      if (prevIndex === 0) {
        roundsCopy.thirdPlace = completedMatch;
      } else {
        roundsCopy.final = completedMatch;
      }
    } else {
      roundsCopy[activeRoundKey][prevIndex] = completedMatch;
    }
    
    setKnockoutRounds(roundsCopy);
    setCurrentKnockoutMatchIndex(prevIndex);
  };

  // Skip active knockout round simulation instantly (Auto Mode Only)
  const skipKnockoutRoundSimulation = () => {
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    if (pauseDelayRef.current) clearTimeout(pauseDelayRef.current);

    const rounds = { ...knockoutRounds };
    const currentRoundKey = currentKnockoutRound;
    const roundMatches = [...rounds[currentRoundKey]];
    const newPlayerStats = { ...playerStats };

    for (let i = currentKnockoutMatchIndex; i < roundMatches.length; i++) {
      const match = roundMatches[i];
      const forcedWinnerId = getForcedWinnerIdForKnockoutMatch(match, currentKnockoutRound);
      const result = simulateMatchWithEvents(match.t1, match.t2, true, realismCategory, forcedWinnerId);

      match.status = 'completed';
      match.score = [result.homeScore, result.awayScore];
      match.winner = result.winner;
      match.loser = result.loser;
      match.scorers = result.scorers;
      match.cards = result.cards;

      result.scorers.forEach(s => {
        newPlayerStats.goals[s.name] = {
          count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
          team: s.teamId === match.t1.id ? match.t1 : match.t2
        };
        if (s.assist) {
          newPlayerStats.assists[s.assist] = {
            count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
            team: s.teamId === match.t1.id ? match.t1 : match.t2
          };
        }
      });

      if (result.homeScore === 0) {
        const gk = getGoalkeeper(match.t2);
        newPlayerStats.cleanSheets[gk.name] = {
          count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
          team: match.t2
        };
      }
      if (result.awayScore === 0) {
        const gk = getGoalkeeper(match.t1);
        newPlayerStats.cleanSheets[gk.name] = {
          count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
          team: match.t1
        };
      }
    }

    setPlayerStats(newPlayerStats);
    setKnockoutRounds(rounds);
    resolveNextKnockoutRound(rounds);
  };

  // Move to next knockout round or finish tournament
  const resolveNextKnockoutRound = (rounds) => {
    if (currentKnockoutRound === 'roundOf32') {
      const nextMatches = [];
      const matches = rounds.roundOf32;
      for (let i = 0; i < matches.length; i += 2) {
        nextMatches.push({
          t1: matches[i].winner,
          t2: matches[i+1].winner,
          score: [null, null],
          winner: null,
          status: 'scheduled'
        });
      }
      setKnockoutRounds(prev => ({ ...prev, roundOf16: nextMatches }));
      setCurrentKnockoutRound('roundOf16');
      setCurrentKnockoutMatchIndex(0);
    } else if (currentKnockoutRound === 'roundOf16') {
      const nextMatches = [];
      const matches = rounds.roundOf16;
      for (let i = 0; i < matches.length; i += 2) {
        nextMatches.push({
          t1: matches[i].winner,
          t2: matches[i+1].winner,
          score: [null, null],
          winner: null,
          status: 'scheduled'
        });
      }
      setKnockoutRounds(prev => ({ ...prev, quarterFinals: nextMatches }));
      setCurrentKnockoutRound('quarterFinals');
      setCurrentKnockoutMatchIndex(0);
    } else if (currentKnockoutRound === 'quarterFinals') {
      const nextMatches = [];
      const matches = rounds.quarterFinals;
      for (let i = 0; i < matches.length; i += 2) {
        nextMatches.push({
          t1: matches[i].winner,
          t2: matches[i+1].winner,
          score: [null, null],
          winner: null,
          status: 'scheduled'
        });
      }
      setKnockoutRounds(prev => ({ ...prev, semiFinals: nextMatches }));
      setCurrentKnockoutRound('semiFinals');
      setCurrentKnockoutMatchIndex(0);
    } else if (currentKnockoutRound === 'semiFinals') {
      const sf = rounds.semiFinals;
      const finalMatch = {
        t1: sf[0].winner,
        t2: sf[1].winner,
        score: [null, null],
        winner: null,
        status: 'scheduled'
      };
      const thirdPlaceMatch = {
        t1: sf[0].loser,
        t2: sf[1].loser,
        score: [null, null],
        winner: null,
        status: 'scheduled'
      };
      setKnockoutRounds(prev => ({
        ...prev,
        final: finalMatch,
        thirdPlace: thirdPlaceMatch
      }));
      setCurrentKnockoutRound('final');
      setCurrentKnockoutMatchIndex(0);
    } else if (currentKnockoutRound === 'final') {
      setKnockoutRounds(prev => ({ ...prev, winner: rounds.final.winner }));
      setSimState('completed');
    }
  };

  // Auto Knockout Stage Match-by-Match trigger loop
  useEffect(() => {
    if (simState === 'simulating_knockouts' && simType === 'auto') {
      const activeRoundKey = currentKnockoutRound;
      const roundMatches = activeRoundKey === 'final' 
        ? [knockoutRounds.thirdPlace, knockoutRounds.final].filter(Boolean)
        : knockoutRounds[activeRoundKey];
      
      if (isPaused || currentKnockoutMatchIndex >= roundMatches.length) {
        if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
        return;
      }

      const match = roundMatches[currentKnockoutMatchIndex];
      if (!match || match.status === 'completed') return;

      const teamA = match.t1;
      const teamB = match.t2;

      const forcedWinnerId = getForcedWinnerIdForKnockoutMatch(match, currentKnockoutRound);
      const result = simulateMatchWithEvents(teamA, teamB, true, realismCategory, forcedWinnerId);
      setActiveSimulationDetails({
        match,
        teamA,
        teamB,
        result
      });

      setLiveMatchClock(0);
      setLiveScore([0, 0]);
      setLiveEvents([]);

      let gameMin = 0;
      let totalMinutes = result.isAET ? 120 : 90;
      if (result.isPenalties && result.events.length > 0) {
        const maxEventMin = result.events.reduce((max, e) => Math.max(max, e.minute), 0);
        if (maxEventMin > totalMinutes) {
          totalMinutes = maxEventMin;
        }
      }
      const intervalMs = simSpeed === 100 ? 1 : Math.max(5, (3000 / simSpeed) / totalMinutes);

      tickerTimerRef.current = setInterval(() => {
        gameMin += 1;
        setLiveMatchClock(gameMin);

        const activeEvents = result.events.filter(e => e.minute <= gameMin);
        setLiveEvents(activeEvents);

        const goalsA = activeEvents.filter(e => e.type === 'goal' && e.teamId === teamA.id).length;
        const goalsB = activeEvents.filter(e => e.type === 'goal' && e.teamId === teamB.id).length;
        setLiveScore([goalsA, goalsB]);

        if (gameMin >= totalMinutes) {
          clearInterval(tickerTimerRef.current);
          
          const roundsCopy = { ...knockoutRounds };
          const completedMatch = {
            ...match,
            status: 'completed',
            score: [result.homeScore, result.awayScore],
            winner: result.winner,
            loser: result.loser,
            scorers: result.scorers,
            cards: result.cards,
            isAET: result.isAET,
            isPenalties: result.isPenalties,
            pensScore: result.pensScore
          };

          if (activeRoundKey === 'final') {
            if (currentKnockoutMatchIndex === 0) {
              roundsCopy.thirdPlace = completedMatch;
            } else {
              roundsCopy.final = completedMatch;
            }
          } else {
            roundsCopy[activeRoundKey][currentKnockoutMatchIndex] = completedMatch;
          }
          setKnockoutRounds(roundsCopy);

          const newPlayerStats = { ...playerStats };
          result.scorers.forEach(s => {
            newPlayerStats.goals[s.name] = {
              count: (newPlayerStats.goals[s.name]?.count || 0) + 1,
              team: s.teamId === teamA.id ? teamA : teamB
            };
            if (s.assist) {
              newPlayerStats.assists[s.assist] = {
                count: (newPlayerStats.assists[s.assist]?.count || 0) + 1,
                team: s.teamId === teamA.id ? teamA : teamB
              };
            }
          });

          if (result.homeScore === 0) {
            const gk = getGoalkeeper(teamB);
            newPlayerStats.cleanSheets[gk.name] = {
              count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
              team: teamB
            };
          }
          if (result.awayScore === 0) {
            const gk = getGoalkeeper(teamA);
            newPlayerStats.cleanSheets[gk.name] = {
              count: (newPlayerStats.cleanSheets[gk.name]?.count || 0) + 1,
              team: teamA
            };
          }
          setPlayerStats(newPlayerStats);

          const delay = simSpeed === 100 ? 5 : 1500 / simSpeed;
          pauseDelayRef.current = setTimeout(() => {
            if (currentKnockoutMatchIndex < roundMatches.length - 1) {
              setCurrentKnockoutMatchIndex(prev => prev + 1);
            } else {
              resolveNextKnockoutRound(roundsCopy);
            }
          }, delay);
        }
      }, intervalMs);

      return () => {
        clearInterval(tickerTimerRef.current);
        clearTimeout(pauseDelayRef.current);
      };
    }
  }, [simState, currentKnockoutRound, currentKnockoutMatchIndex, isPaused, simSpeed, simType]);

  // Reset savedSimRef when simulation is not completed
  useEffect(() => {
    if (simState !== 'completed') {
      savedSimRef.current = false;
    }
  }, [simState]);

  // Save simulation results when complete
  useEffect(() => {
    if (simState === 'completed' && knockoutRounds.winner && !savedSimRef.current) {
      savedSimRef.current = true;
      const formatTeam = (t) => t ? { id: t.id, name: t.name, code: t.code } : null;
      const simData = {
        realismCategory: realismCategory,
        groupMatches: simMatches.map(m => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          group: m.group
        })),
        roundOf32: (knockoutRounds.roundOf32 || []).map(m => ({
          t1: formatTeam(m.t1),
          t2: formatTeam(m.t2),
          score: m.score,
          winner: formatTeam(m.winner),
          loser: formatTeam(m.loser)
        })),
        roundOf16: (knockoutRounds.roundOf16 || []).map(m => ({
          t1: formatTeam(m.t1),
          t2: formatTeam(m.t2),
          score: m.score,
          winner: formatTeam(m.winner),
          loser: formatTeam(m.loser)
        })),
        quarterFinals: (knockoutRounds.quarterFinals || []).map(m => ({
          t1: formatTeam(m.t1),
          t2: formatTeam(m.t2),
          score: m.score,
          winner: formatTeam(m.winner),
          loser: formatTeam(m.loser)
        })),
        semiFinals: (knockoutRounds.semiFinals || []).map(m => ({
          t1: formatTeam(m.t1),
          t2: formatTeam(m.t2),
          score: m.score,
          winner: formatTeam(m.winner),
          loser: formatTeam(m.loser)
        })),
        final: knockoutRounds.final ? {
          t1: formatTeam(knockoutRounds.final.t1),
          t2: formatTeam(knockoutRounds.final.t2),
          score: knockoutRounds.final.score,
          winner: formatTeam(knockoutRounds.final.winner)
        } : null,
        thirdPlace: knockoutRounds.thirdPlace ? {
          t1: formatTeam(knockoutRounds.thirdPlace.t1),
          t2: formatTeam(knockoutRounds.thirdPlace.t2),
          score: knockoutRounds.thirdPlace.score,
          winner: formatTeam(knockoutRounds.thirdPlace.winner)
        } : null,
        winner: formatTeam(knockoutRounds.winner)
      };

      const saveSimulation = async () => {
        try {
          const response = await fetch('/api/save-simulation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(simData),
          });
          if (response.ok) {
            console.log('Simulation results saved successfully');
          } else {
            console.error('Failed to save simulation results');
          }
        } catch (error) {
          console.error('Error saving simulation results:', error);
        }
      };

      saveSimulation();
    }
  }, [simState, knockoutRounds, simMatches]);

  // Compute final awards
  const finalAwards = useMemo(() => {
    if (simState === 'idle') return null;

    const sortedScorers = Object.entries(playerStats.goals)
      .map(([name, obj]) => ({ name, count: obj.count, team: obj.team }))
      .sort((a, b) => b.count - a.count);
    
    const sortedAssisters = Object.entries(playerStats.assists)
      .map(([name, obj]) => ({ name, count: obj.count, team: obj.team }))
      .sort((a, b) => b.count - a.count);

    const sortedGKs = Object.entries(playerStats.cleanSheets)
      .map(([name, obj]) => ({ name, count: obj.count, team: obj.team }))
      .sort((a, b) => b.count - a.count);

    const mvpCandidates = [];
    const finalistTeamIds = [knockoutRounds.final?.t1?.id, knockoutRounds.final?.t2?.id];
    
    const allPlayers = new Set([
      ...Object.keys(playerStats.goals),
      ...Object.keys(playerStats.assists)
    ]);

    allPlayers.forEach(name => {
      const goalsCount = playerStats.goals[name]?.count || 0;
      const assistsCount = playerStats.assists[name]?.count || 0;
      const team = playerStats.goals[name]?.team || playerStats.assists[name]?.team;
      
      let rating = goalsCount * 10 + assistsCount * 6;
      if (team && finalistTeamIds.includes(team.id)) {
        rating += 30;
      }
      mvpCandidates.push({ name, rating, team, goals: goalsCount, assists: assistsCount });
    });

    const mvp = mvpCandidates.sort((a, b) => b.rating - a.rating)[0] || {
      name: 'Lionel Messi',
      team: teams.find(t => t.id === 'argentina'),
      goals: 4,
      assists: 3
    };

    return {
      goldenBoot: sortedScorers.slice(0, 15),
      playmaker: sortedAssisters.slice(0, 15),
      goldenGlove: sortedGKs.slice(0, 15),
      mvp
    };
  }, [simState, playerStats, teams, knockoutRounds]);

  const renderAwardsGrid = (title) => {
    if (!finalAwards) return null;
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-green-500 pl-3">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* MVP */}
          <div className="bg-gray-900 border border-yellow-500/20 p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full blur-2xl" />
            <Trophy className="w-10 h-10 text-yellow-500 mb-4" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tournament MVP</h3>
            <span className="text-md font-bold text-white leading-tight block truncate max-w-full">{finalAwards.mvp.name}</span>
            <div className="flex items-center gap-1 mt-1">
              <Flag code={finalAwards.mvp.team?.countryCode} style={{ fontSize: '0.9rem' }} />
              <span className="text-[10px] text-gray-400 font-bold uppercase">{finalAwards.mvp.team?.name}</span>
            </div>
            <div className="bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 text-[10px] text-yellow-400 font-black mt-3 block uppercase tracking-wider">
              Rating Score: {finalAwards.mvp.rating}
            </div>
          </div>

          {/* Golden Boot */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-2xl">
            <Award className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Golden Boot</h3>
            {finalAwards.goldenBoot[0] ? (
              <>
                <span className="text-md font-bold text-white leading-tight block truncate max-w-full">{finalAwards.goldenBoot[0].name}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Flag code={finalAwards.goldenBoot[0].team?.countryCode} style={{ fontSize: '0.9rem' }} />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{finalAwards.goldenBoot[0].team?.name}</span>
                </div>
                <span className="text-xs text-green-400 font-black mt-3 block uppercase tracking-wider">
                  {finalAwards.goldenBoot[0].count} Goals
                </span>
                <button
                  onClick={() => setDetailedStatsModal({ type: 'goals', title: 'Top Goal Scorers', data: finalAwards.goldenBoot })}
                  className="mt-4 text-[10px] font-black text-green-400 uppercase tracking-widest hover:text-green-300 transition-colors border border-green-500/20 px-3 py-1.5 rounded-lg bg-green-500/5 hover:bg-green-500/10"
                >
                  View Top 10
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-bold">No Goals recorded</span>
            )}
          </div>

          {/* Playmaker */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-2xl">
            <Award className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Playmaker Award</h3>
            {finalAwards.playmaker[0] ? (
              <>
                <span className="text-md font-bold text-white leading-tight block truncate max-w-full">{finalAwards.playmaker[0].name}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Flag code={finalAwards.playmaker[0].team?.countryCode} style={{ fontSize: '0.9rem' }} />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{finalAwards.playmaker[0].team?.name}</span>
                </div>
                <span className="text-xs text-blue-400 font-black mt-3 block uppercase tracking-wider">
                  {finalAwards.playmaker[0].count} Assists
                </span>
                <button
                  onClick={() => setDetailedStatsModal({ type: 'assists', title: 'Top Assists', data: finalAwards.playmaker })}
                  className="mt-4 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors border border-blue-500/20 px-3 py-1.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10"
                >
                  View Top 10
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-bold">No Assists recorded</span>
            )}
          </div>

          {/* Golden Glove */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center shadow-2xl">
            <Landmark className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Golden Glove</h3>
            {finalAwards.goldenGlove[0] ? (
              <>
                <span className="text-md font-bold text-white leading-tight block truncate max-w-full">{finalAwards.goldenGlove[0].name}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Flag code={finalAwards.goldenGlove[0].team?.countryCode} style={{ fontSize: '0.9rem' }} />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{finalAwards.goldenGlove[0].team?.name}</span>
                </div>
                <span className="text-xs text-purple-400 font-black mt-3 block uppercase tracking-wider">
                  {finalAwards.goldenGlove[0].count} Clean Sheets
                </span>
                <button
                  onClick={() => setDetailedStatsModal({ type: 'cleansheets', title: 'Golden Glove (Clean Sheets)', data: finalAwards.goldenGlove })}
                  className="mt-4 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors border border-purple-500/20 px-3 py-1.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10"
                >
                  View Top 10
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-bold">No Clean Sheets</span>
            )}
          </div>

        </div>
      </section>
    );
  };

  const resetSimulatorState = () => {
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    if (pauseDelayRef.current) clearTimeout(pauseDelayRef.current);

    const cleaned = matches.map(m => ({
      ...m,
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      scorers: [],
      cards: []
    }));
    setSimMatches(cleaned);
    setCurrentGroupMatchIndex(0);
    setLiveMatchClock(0);
    setLiveEvents([]);
    setIsPaused(false);
    setSimState('idle');
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const isSimulatingGroupsActive = simState === 'simulating_groups';
  const isSimulatingKnockoutsActive = simState === 'simulating_knockouts';
  const isManualActive = simType === 'manual';

  const activeRoundMatches = currentKnockoutRound === 'final'
    ? [knockoutRounds.thirdPlace, knockoutRounds.final].filter(Boolean)
    : (knockoutRounds[currentKnockoutRound] || []);

  return (
    <div className="min-h-screen bg-gray-950 pb-20 relative overflow-x-hidden">
      <Navbar />

      {/* Confetti Rain on completion */}
      {simState === 'completed' && <ConfettiCanvas />}

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter flex items-center gap-3">
              <Trophy className="w-9 h-9 text-green-500" />
              Tournament Simulator
            </h1>
            <p className="text-gray-500 font-medium">An independent, fully-isolated match-by-match simulation of the 2026 World Cup.</p>
          </div>

          {simState !== 'idle' && (
            <Button
              variant="secondary"
              onClick={resetSimulatorState}
              className="flex items-center gap-2 border border-gray-800 hover:bg-gray-900"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Simulator
            </Button>
          )}
        </div>

        {/* 1. IDLE STATE: Starting Screen */}
        {simState === 'idle' && (
          <div className="space-y-12">
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 p-8 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center">
                <Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Simulate the World Cup</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md mb-6 font-medium">
                  Experience a realistic 48-team simulation. Choose to run automatically with custom realism categories, or manually dictate scorelines and goal scorers!
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowSetupModal(true)}
                  className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider bg-green-500 text-gray-950 hover:bg-green-400 shadow-lg shadow-green-500/25 flex items-center gap-3 transition-transform hover:scale-[1.03]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Run Tournament Simulation
                </Button>
              </div>
            </div>

            {/* Standings clean view */}
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-green-500 pl-3">Initial Group Standings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groups.map(g => (
                  <div key={g} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">Group {g}</h3>
                    <GroupTable teams={simGroupStandings[g] || []} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETUP MODAL: Choose Simulation Mode & realism */}
        {showSetupModal && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
            >
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">Simulation Configuration</h3>
                <p className="text-xs text-gray-400 font-medium">Select your preferred simulation engine and realism parameters.</p>
              </div>

              {/* Selection: Auto vs Manual */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Simulation Type</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSimType('auto')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      simType === 'auto'
                        ? 'bg-green-500/10 border-green-500 text-white shadow-lg'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-green-400 mb-2" />
                    <span className="text-xs font-black uppercase tracking-wider block">Automatic</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">Let the AI simulate matches instantly.</span>
                  </button>
                  <button
                    onClick={() => setSimType('manual')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      simType === 'manual'
                        ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <User className="w-5 h-5 text-blue-400 mb-2" />
                    <span className="text-xs font-black uppercase tracking-wider block">Manual Entry</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">Dictate scorelines and select goalscorers yourself.</span>
                  </button>
                </div>
              </div>

              {/* Conditional Options: Auto Realism Style */}
              {simType === 'auto' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Realism Category</span>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'favorites', label: '👑 Favorites Dominate', desc: 'Predictable wins for major powerhouses.' },
                      { id: 'realistic', label: '📊 Normal', desc: 'Based on team Power Scores.' },
                      { id: 'moderate', label: '⚖️ Moderately Realistic', desc: 'Standard rank-based results with average upsets.' },
                      { id: 'unrealistic', label: '🌀 Wild / Unrealistic', desc: 'Chaos mode. Unpredictable results and scores.' },
                      { id: 'underdog', label: '🐕 Underdog Story', desc: 'Weaker teams receive +30% boost.' }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => setRealismCategory(style.id)}
                        className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                          realismCategory === style.id
                            ? 'bg-green-500/5 border-green-500 text-white'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-800'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">{style.label}</span>
                          <span className="text-[10px] text-gray-500 leading-tight mt-0.5">{style.desc}</span>
                        </div>
                        {realismCategory === style.id && <span className="w-2.5 h-2.5 rounded-full bg-green-500 self-center" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Options: Manual Scorers toggle */}
              {simType === 'manual' && (
                <div className="space-y-3 p-4 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Manually Select Scorers?</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">Choose which players scored from squads.</span>
                  </div>
                  <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setManualScorers(true)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        manualScorers ? 'bg-blue-500 text-white' : 'text-gray-500'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setManualScorers(false)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        !manualScorers ? 'bg-blue-500 text-white' : 'text-gray-500'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Matchup Scripting */}
              <div className="border-t border-gray-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block">Script Custom Matchup</span>
                    <span className="text-[10px] text-gray-405 text-gray-500 block leading-tight mt-0.5">Force two teams to meet at a specific stage.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={scriptedMatchup.enabled}
                    onChange={(e) => setScriptedMatchup(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-800 text-green-500 focus:ring-green-500/20 bg-gray-950 accent-green-500 cursor-pointer"
                  />
                </div>

                {scriptedMatchup.enabled && (
                  <div className="space-y-3 bg-gray-950 border border-gray-850 p-3.5 rounded-2xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Team 1</label>
                        <select
                          value={scriptedMatchup.team1}
                          onChange={(e) => setScriptedMatchup(prev => ({ ...prev, team1: e.target.value }))}
                          className="w-full bg-gray-900 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500"
                        >
                          <option value="">Select Team 1</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id} disabled={t.id === scriptedMatchup.team2}>
                              {t.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Team 2</label>
                        <select
                          value={scriptedMatchup.team2}
                          onChange={(e) => setScriptedMatchup(prev => ({ ...prev, team2: e.target.value }))}
                          className="w-full bg-gray-900 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500"
                        >
                          <option value="">Select Team 2</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id} disabled={t.id === scriptedMatchup.team1}>
                              {t.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target Stage</label>
                      <select
                        value={scriptedMatchup.stage}
                        onChange={(e) => setScriptedMatchup(prev => ({ ...prev, stage: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500"
                      >
                        <option value="roundOf32">Round of 32</option>
                        <option value="roundOf16">Round of 16</option>
                        <option value="quarterFinals">Quarterfinals</option>
                        <option value="semiFinals">Semifinals</option>
                        <option value="final">Final</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
                <Button
                  variant="secondary"
                  onClick={() => setShowSetupModal(false)}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={executeLaunchSimulation}
                  className="px-6 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-green-500 text-gray-950 hover:bg-green-400"
                >
                  Start Simulation
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. AUTO SIMULATION POPUP CONSOLE */}
        {simState === 'simulating_groups' && simType === 'auto' && activeSimulationDetails && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                    Group Stage Simulation ({realismCategory === 'realistic' ? 'Normal' : realismCategory.charAt(0).toUpperCase() + realismCategory.slice(1)} Mode)
                  </span>
                  <h3 className="text-sm font-bold text-gray-300">
                    Match {currentGroupMatchIndex + 1} of 72
                  </h3>
                </div>

                <div className="flex-1 max-w-[200px] h-2 bg-gray-800 rounded-full overflow-hidden mx-4 hidden md:block">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${((currentGroupMatchIndex + 1) / 72) * 100}%` }}
                  />
                </div>

                {/* Controller Panel */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-xl transition-all shrink-0"
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-current text-green-400" /> : <Pause className="w-4 h-4 text-amber-500" />}
                    </button>

                    <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
                      {[1, 2, 5].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setSimSpeed(speed)}
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                            simSpeed === speed ? 'bg-green-500 text-gray-950' : 'text-gray-500'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                      <button
                        onClick={() => setSimSpeed(100)}
                        className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                          simSpeed === 100 ? 'bg-amber-500 text-gray-950' : 'text-gray-500'
                        }`}
                      >
                        Instant
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto">
                    <button
                      onClick={skipGroupStageSimulation}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-950 border border-gray-800 hover:bg-gray-900 rounded-xl text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-wider"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      Skip Stage
                    </button>

                    <button
                      onClick={() => {
                        setIsPaused(true);
                        setSimType('manual');
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-xl text-[10px] font-black text-white uppercase tracking-wider shadow-md shadow-blue-500/25"
                    >
                      <User className="w-3.5 h-3.5" />
                      Enter Manually
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                
                {/* 1. Large Match Card */}
                <div className="bg-gray-950 border border-gray-800 rounded-3xl p-5 md:p-6 relative overflow-hidden flex items-center justify-between shadow-inner gap-1.5 flex-shrink-0">
                  <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 text-center min-w-0">
                    <Flag code={activeSimulationDetails.teamA.countryCode} style={{ fontSize: isMobile ? '3.2rem' : '4.5rem' }} className="shadow-lg flex-shrink-0" />
                    <div className="min-w-0 w-full">
                      <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest block mb-0.5 truncate">Rank #{activeSimulationDetails.teamA.fifaRanking}</span>
                      <h4 className="text-xs md:text-lg font-black text-white tracking-tight leading-tight uppercase italic truncate w-full" title={activeSimulationDetails.teamA.name}>{activeSimulationDetails.teamA.name}</h4>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-2 md:px-4 min-w-[100px] md:min-w-[150px] flex-shrink-0">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[9px] md:text-xs uppercase tracking-widest rounded-full mb-2 md:mb-3 animate-pulse">
                      {liveMatchClock}'
                    </span>
                    <div className="text-3xl md:text-5xl font-black text-white tracking-tighter italic tabular-nums">
                      {liveScore[0]} - {liveScore[1]}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 text-center min-w-0">
                    <Flag code={activeSimulationDetails.teamB.countryCode} style={{ fontSize: isMobile ? '3.2rem' : '4.5rem' }} className="shadow-lg flex-shrink-0" />
                    <div className="min-w-0 w-full">
                      <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest block mb-0.5 truncate">Rank #{activeSimulationDetails.teamB.fifaRanking}</span>
                      <h4 className="text-xs md:text-lg font-black text-white tracking-tight leading-tight uppercase italic truncate w-full" title={activeSimulationDetails.teamB.name}>{activeSimulationDetails.teamB.name}</h4>
                    </div>
                  </div>
                </div>

                {/* 2. Commentary and Standings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-4 flex flex-col h-[180px] md:h-[250px]">
                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2 mb-2 block">Match Commentary</span>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
                      <AnimatePresence>
                        {liveEvents.slice().reverse().map((e, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs leading-relaxed text-gray-400 flex items-start gap-2"
                          >
                            <span className="font-black text-green-400 min-w-[28px] tabular-nums">{e.minute}'</span>
                            <div>
                              {e.type === 'goal' && (
                                <span className="font-bold text-white flex items-center gap-1">
                                  ⚽ Goal! {e.player} ({e.teamName})
                                  {e.assist && <span className="text-[10px] text-gray-400 font-medium"> (Assist: {e.assist})</span>}
                                </span>
                              )}
                              {e.type === 'card' && (
                                <span className={`font-semibold flex items-center gap-1.5 ${e.cardType === 'yellow' ? 'text-yellow-400' : 'text-red-500'}`}>
                                  <span className={`w-2.5 h-3.5 rounded-sm inline-block ${e.cardType === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                                  {e.detail}
                                </span>
                              )}
                              {e.type === 'penalty_kick' && (
                                <span className={`font-semibold ${e.scored ? 'text-green-400' : 'text-red-400'}`}>
                                  {e.detail}
                                </span>
                              )}
                              {e.type !== 'goal' && e.type !== 'card' && e.type !== 'penalty_kick' && (
                                <span className="font-semibold text-gray-300">{e.detail}</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-4 flex flex-col h-[250px] overflow-hidden">
                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2 mb-2 block">
                      Group {activeSimulationDetails.match.group} Standings
                    </span>
                    <div className="flex-1 overflow-y-auto pr-1">
                      <GroupTable 
                        group={activeSimulationDetails.match.group} 
                        teams={simGroupStandings[activeSimulationDetails.match.group] || []} 
                        highlightedTeamIds={[activeSimulationDetails.teamA.id, activeSimulationDetails.teamB.id]}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* 3. MANUAL MATCH SCORE ENTRY MODAL (Group Stage) */}
        {simState === 'simulating_groups' && simType === 'manual' && activeSimulationDetails && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Manual Score Entry</span>
                  <h3 className="text-sm font-bold text-gray-300">Match {currentGroupMatchIndex + 1} of 72 (Group {activeSimulationDetails.match.group})</h3>
                </div>
                
                <div className="flex-1 max-w-[200px] h-2 bg-gray-800 rounded-full overflow-hidden mx-4 hidden sm:block">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${((currentGroupMatchIndex + 1) / 72) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSimType('auto');
                      setRealismCategory('realistic');
                      setIsPaused(false);
                    }}
                    className="px-3 py-1.5 text-[10px] font-black uppercase bg-green-500 hover:bg-green-400 text-gray-950 rounded-xl flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    Auto Simulate Rest
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={resetSimulatorState}
                    className="px-3 py-1.5 text-[10px] font-black uppercase border-gray-850 hover:bg-gray-900 rounded-xl"
                  >
                    Exit
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                
                {/* Score entry spinners */}
                <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <Flag code={activeSimulationDetails.teamA.countryCode} style={{ fontSize: '4.5rem' }} className="shadow-lg" />
                    <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[120px]">{activeSimulationDetails.teamA.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setManualHomeScore(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-3xl font-black text-white">{manualHomeScore}</span>
                      <button
                        onClick={() => setManualHomeScore(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-700 font-black text-xl italic px-4">VS</div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <Flag code={activeSimulationDetails.teamB.countryCode} style={{ fontSize: '4.5rem' }} className="shadow-lg" />
                    <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[120px]">{activeSimulationDetails.teamB.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setManualAwayScore(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-3xl font-black text-white">{manualAwayScore}</span>
                      <button
                        onClick={() => setManualAwayScore(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Scorer Selectors */}
                {manualScorers && (manualHomeScore > 0 || manualAwayScore > 0) && (
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2">Select Goal Scorers</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Home scorers */}
                      <div className="space-y-3">
                        {manualHomeScore > 0 && <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">{activeSimulationDetails.teamA.name} Goals</span>}
                        {manualHomeScorers.map((scorer, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={scorer.name}
                              onChange={(e) => {
                                const next = [...manualHomeScorers];
                                next[idx].name = e.target.value;
                                setManualHomeScorers(next);
                              }}
                              className="flex-1 bg-gray-900 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Choose scorer...</option>
                              {activeSimulationDetails.teamA.squad?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              placeholder="Min"
                              value={scorer.minute}
                              onChange={(e) => {
                                const next = [...manualHomeScorers];
                                next[idx].minute = e.target.value;
                                setManualHomeScorers(next);
                              }}
                              className="w-14 bg-gray-900 border border-gray-800 text-xs text-center text-white rounded-xl px-2 py-2 font-bold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Away scorers */}
                      <div className="space-y-3">
                        {manualAwayScore > 0 && <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">{activeSimulationDetails.teamB.name} Goals</span>}
                        {manualAwayScorers.map((scorer, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={scorer.name}
                              onChange={(e) => {
                                const next = [...manualAwayScorers];
                                next[idx].name = e.target.value;
                                setManualAwayScorers(next);
                              }}
                              className="flex-1 bg-gray-900 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Choose scorer...</option>
                              {activeSimulationDetails.teamB.squad?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              placeholder="Min"
                              value={scorer.minute}
                              onChange={(e) => {
                                const next = [...manualAwayScorers];
                                next[idx].minute = e.target.value;
                                setManualAwayScorers(next);
                              }}
                              className="w-14 bg-gray-900 border border-gray-800 text-xs text-center text-white rounded-xl px-2 py-2 font-bold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Standings Shift Below (Updates reactively on goals change!) */}
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2 mb-2 block">
                    Group {activeSimulationDetails.match.group} Standings Preview
                  </span>
                  <GroupTable
                    group={activeSimulationDetails.match.group}
                    teams={simGroupStandings[activeSimulationDetails.match.group] || []}
                    highlightedTeamIds={[activeSimulationDetails.teamA.id, activeSimulationDetails.teamB.id]}
                  />
                </div>

                {/* Footer Save */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-800 gap-3">
                  <div>
                    {currentGroupMatchIndex > 0 && (
                      <Button
                        variant="secondary"
                        onClick={handlePreviousGroupMatch}
                        className="px-4 py-3 border border-gray-800 text-gray-400 hover:text-white font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous Match
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    onClick={saveManualGroupMatch}
                    className="px-8 py-3 bg-blue-500 text-white hover:bg-blue-400 font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Save className="w-4 h-4" />
                    Save & Next Match
                  </Button>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* 4. MANUAL KNOCKOUT MATCH SCORE ENTRY OVERLAY */}
        {simState === 'simulating_knockouts' && simType === 'manual' && activeSimulationDetails && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Manual Knockout Entry</span>
                  <h3 className="text-sm font-bold text-gray-300">
                    {currentKnockoutRound.replace(/([A-Z])/g, ' $1').toUpperCase()} - Match {currentKnockoutMatchIndex + 1} of {activeRoundMatches?.length}
                  </h3>
                </div>
                
                <div className="flex-1 max-w-[200px] h-2 bg-gray-800 rounded-full overflow-hidden mx-4 hidden sm:block">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${((currentKnockoutMatchIndex + 1) / activeRoundMatches?.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSimType('auto');
                      setRealismCategory('realistic');
                      setIsPaused(false);
                    }}
                    className="px-3 py-1.5 text-[10px] font-black uppercase bg-green-500 hover:bg-green-400 text-gray-950 rounded-xl flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    Auto Simulate Rest
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={resetSimulatorState}
                    className="px-3 py-1.5 text-[10px] font-black uppercase border-gray-850 hover:bg-gray-900 rounded-xl"
                  >
                    Exit
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                
                {/* Score entry spinners */}
                <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <Flag code={activeSimulationDetails.teamA.countryCode} style={{ fontSize: '4.5rem' }} className="shadow-lg" />
                    <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[120px]">{activeSimulationDetails.teamA.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setManualHomeScore(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-3xl font-black text-white">{manualHomeScore}</span>
                      <button
                        onClick={() => setManualHomeScore(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-700 font-black text-xl italic px-4">VS</div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-3 flex-1">
                    <Flag code={activeSimulationDetails.teamB.countryCode} style={{ fontSize: '4.5rem' }} className="shadow-lg" />
                    <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[120px]">{activeSimulationDetails.teamB.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setManualAwayScore(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-3xl font-black text-white">{manualAwayScore}</span>
                      <button
                        onClick={() => setManualAwayScore(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 font-black text-lg text-white hover:bg-gray-850"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Draw resolution options (Knockout Draw requires a winner!) */}
                {manualHomeScore === manualAwayScore && (
                  <div className="bg-gray-950 border border-red-500/20 rounded-2xl p-5 flex flex-col items-center text-center gap-4">
                    <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest">Knockout Tiebreaker Required</span>
                    <p className="text-xs text-gray-400 max-w-md">Knockout matches cannot end in a draw. Select which team advances via Extra Time or Penalties.</p>
                    <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800 gap-2">
                      <button
                        onClick={() => setManualKnockoutWinner('home')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          manualKnockoutWinner === 'home' 
                            ? 'bg-blue-500 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Flag code={activeSimulationDetails.teamA.countryCode} style={{ fontSize: '0.9rem' }} />
                        {activeSimulationDetails.teamA.code} Wins
                      </button>
                      <button
                        onClick={() => setManualKnockoutWinner('away')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          manualKnockoutWinner === 'away' 
                            ? 'bg-blue-500 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Flag code={activeSimulationDetails.teamB.countryCode} style={{ fontSize: '0.9rem' }} />
                        {activeSimulationDetails.teamB.code} Wins
                      </button>
                    </div>
                  </div>
                )}

                {/* Conditional Scorer Selectors */}
                {manualScorers && (manualHomeScore > 0 || manualAwayScore > 0) && (
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2">Select Goal Scorers</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Home scorers */}
                      <div className="space-y-3">
                        {manualHomeScore > 0 && <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">{activeSimulationDetails.teamA.name} Goals</span>}
                        {manualHomeScorers.map((scorer, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={scorer.name}
                              onChange={(e) => {
                                const next = [...manualHomeScorers];
                                next[idx].name = e.target.value;
                                setManualHomeScorers(next);
                              }}
                              className="flex-1 bg-gray-900 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Choose scorer...</option>
                              {activeSimulationDetails.teamA.squad?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Min"
                              value={scorer.minute}
                              onChange={(e) => {
                                const next = [...manualHomeScorers];
                                next[idx].minute = e.target.value;
                                setManualHomeScorers(next);
                              }}
                              className="w-14 bg-gray-900 border border-gray-800 text-xs text-center text-white rounded-xl px-2 py-2 font-bold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Away scorers */}
                      <div className="space-y-3">
                        {manualAwayScore > 0 && <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">{activeSimulationDetails.teamB.name} Goals</span>}
                        {manualAwayScorers.map((scorer, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={scorer.name}
                              onChange={(e) => {
                                const next = [...manualAwayScorers];
                                next[idx].name = e.target.value;
                                setManualAwayScorers(next);
                              }}
                              className="flex-1 bg-gray-900 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Choose scorer...</option>
                              {activeSimulationDetails.teamB.squad?.map(p => (
                                <option key={p.name} value={p.name}>{p.name} ({p.position})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Min"
                              value={scorer.minute}
                              onChange={(e) => {
                                const next = [...manualAwayScorers];
                                next[idx].minute = e.target.value;
                                setManualAwayScorers(next);
                              }}
                              className="w-14 bg-gray-900 border border-gray-800 text-xs text-center text-white rounded-xl px-2 py-2 font-bold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Save */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-800 gap-3">
                  <div>
                    {currentKnockoutMatchIndex > 0 && (
                      <Button
                        variant="secondary"
                        onClick={handlePreviousKnockoutMatch}
                        className="px-4 py-3 border border-gray-800 text-gray-400 hover:text-white font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous Match
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    onClick={saveManualKnockoutMatch}
                    className="px-8 py-3 bg-blue-500 text-white hover:bg-blue-400 font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Save className="w-4 h-4" />
                    Save & Next Match
                  </Button>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* 2.5 AUTO KNOCKOUT POPUP CONSOLE */}
        {simState === 'simulating_knockouts' && simType === 'auto' && activeSimulationDetails && activeSimulationDetails.result && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                    Knockout Stage ({realismCategory === 'realistic' ? 'Normal' : realismCategory.charAt(0).toUpperCase() + realismCategory.slice(1)} Mode)
                  </span>
                  <h3 className="text-sm font-bold text-gray-300">
                    {currentKnockoutRound.replace(/([A-Z])/g, ' $1').toUpperCase()} - Match {currentKnockoutMatchIndex + 1} of {activeRoundMatches?.length}
                  </h3>
                </div>
                       {/* Controller Panel */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-xl transition-all shrink-0"
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-current text-green-400" /> : <Pause className="w-4 h-4 text-amber-500" />}
                    </button>

                    <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
                      {[1, 2, 5].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setSimSpeed(speed)}
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                            simSpeed === speed ? 'bg-green-500 text-gray-950' : 'text-gray-500'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                      <button
                        onClick={() => setSimSpeed(100)}
                        className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                          simSpeed === 100 ? 'bg-amber-500 text-gray-950' : 'text-gray-500'
                        }`}
                      >
                        Instant
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto">
                    <button
                      onClick={skipKnockoutRoundSimulation}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-950 border border-gray-800 hover:bg-gray-900 rounded-xl text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-wider"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      Skip Round
                    </button>

                    <button
                      onClick={() => {
                        setIsPaused(true);
                        setSimType('manual');
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-xl text-[10px] font-black text-white uppercase tracking-wider shadow-md shadow-blue-500/25"
                    >
                      <User className="w-3.5 h-3.5" />
                      Enter Manually
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                
                {/* Match Card */}
                <div className="bg-gray-955 border border-gray-800 rounded-3xl p-5 md:p-6 relative overflow-hidden flex items-center justify-between shadow-inner gap-1.5 flex-shrink-0">
                  <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 text-center min-w-0">
                    <Flag code={activeSimulationDetails.teamA.countryCode} style={{ fontSize: isMobile ? '3.2rem' : '4.5rem' }} className="shadow-lg flex-shrink-0" />
                    <div className="min-w-0 w-full">
                      <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest block mb-0.5 truncate">Rank #{activeSimulationDetails.teamA.fifaRanking}</span>
                      <h4 className="text-xs md:text-lg font-black text-white tracking-tight leading-tight uppercase italic truncate w-full" title={activeSimulationDetails.teamA.name}>{activeSimulationDetails.teamA.name}</h4>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-2 md:px-4 min-w-[100px] md:min-w-[150px] flex-shrink-0">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[9px] md:text-xs uppercase tracking-widest rounded-full mb-2 md:mb-3 animate-pulse">
                      {activeSimulationDetails.result.isPenalties && liveMatchClock >= (activeSimulationDetails.result.isAET ? 120 : 90)
                        ? (activeSimulationDetails.result.isAET ? "120'" : "90'")
                        : `${liveMatchClock}'`}
                    </span>
                    <div className="text-3xl md:text-5xl font-black text-white tracking-tighter italic tabular-nums">
                      {liveScore[0]} - {liveScore[1]}
                    </div>
                    {/* Running penalty shootout score */}
                    {activeSimulationDetails.result.isPenalties && liveMatchClock > (activeSimulationDetails.result.isAET ? 120 : 90) && (
                      <div className="mt-2 text-xs font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                        Pens: {
                          (() => {
                            const latestKick = [...liveEvents].reverse().find(e => e.type === 'penalty_kick');
                            return latestKick ? `${latestKick.pensScore[0]} - ${latestKick.pensScore[1]}` : '0 - 0';
                          })()
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 text-center min-w-0">
                    <Flag code={activeSimulationDetails.teamB.countryCode} style={{ fontSize: isMobile ? '3.2rem' : '4.5rem' }} className="shadow-lg flex-shrink-0" />
                    <div className="min-w-0 w-full">
                      <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest block mb-0.5 truncate">Rank #{activeSimulationDetails.teamB.fifaRanking}</span>
                      <h4 className="text-xs md:text-lg font-black text-white tracking-tight leading-tight uppercase italic truncate w-full" title={activeSimulationDetails.teamB.name}>{activeSimulationDetails.teamB.name}</h4>
                    </div>
                  </div>
                </div>

                {/* Commentary */}
                <div className="bg-gray-955 border border-gray-800 rounded-2xl p-4 flex flex-col h-[180px] md:h-[250px]">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-900 pb-2 mb-2 block">Match Commentary</span>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
                    <AnimatePresence>
                      {liveEvents.slice().reverse().map((e, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs leading-relaxed text-gray-400 flex items-start gap-2"
                        >
                          <span className="font-black text-green-400 min-w-[28px] tabular-nums">
                            {e.type === 'penalty_kick' || e.type === 'penalties' ? 'PEN' : `${e.minute}'`}
                          </span>
                          <div>
                            {e.type === 'goal' && (
                              <span className="font-bold text-white flex items-center gap-1">
                                ⚽ Goal! {e.player} ({e.teamName})
                                {e.assist && <span className="text-[10px] text-gray-400 font-medium"> (Assist: {e.assist})</span>}
                              </span>
                            )}
                            {e.type === 'card' && (
                              <span className={`font-semibold flex items-center gap-1.5 ${e.cardType === 'yellow' ? 'text-yellow-400' : 'text-red-500'}`}>
                                <span className={`w-2.5 h-3.5 rounded-sm inline-block ${e.cardType === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                                {e.detail}
                              </span>
                            )}
                            {e.type === 'penalty_kick' && (
                              <span className={`font-semibold ${e.scored ? 'text-green-400' : 'text-red-400'}`}>
                                {e.detail}
                              </span>
                            )}
                            {e.type !== 'goal' && e.type !== 'card' && e.type !== 'penalty_kick' && (
                              <span className="font-semibold text-gray-300">{e.detail}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* 3. GROUP STAGE COMPLETED SCREEN */}
        {simState === 'groups_completed' && (
          <div className="space-y-12">
            {/* Top summary card */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />
              <div>
                <span className="text-xs font-black text-green-400 uppercase tracking-widest block mb-1">Stage 1 Complete</span>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">Group Stage Concluded!</h2>
                <p className="text-gray-400 text-sm max-w-xl font-medium leading-relaxed">
                  All 72 matches have been simulated. The top 2 teams from each group and the 8 best 3rd-place teams have advanced to the Round of 32!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResultsModalTab('groups');
                    setShowAllResultsModal(true);
                  }}
                  className="px-6 py-4 bg-gray-850 hover:bg-gray-800 text-white font-black uppercase text-sm tracking-wider rounded-2xl flex items-center gap-2 border border-gray-700 transition-transform hover:scale-[1.03]"
                >
                  <ListFilter className="w-5 h-5 text-gray-400" />
                  View Match Results
                </Button>
                <Button
                  variant="primary"
                  onClick={proceedToKnockouts}
                  className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black uppercase text-sm tracking-wider rounded-2xl flex items-center gap-3 transition-transform hover:scale-[1.03] shadow-lg shadow-yellow-500/20"
                >
                  <Trophy className="w-5 h-5 fill-current" />
                  Proceed to Knockout Bracket
                </Button>
              </div>
            </div>

            {/* Dashboards for Qualifiers & Third Place Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Best 3rd place teams */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Best 3rd-Place Leaderboard
                  </h3>
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase bg-gray-950 px-2 py-0.5 rounded">Top 8 Qualify</span>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                      <tr>
                        <th className="px-2 py-3">Pos</th>
                        <th className="px-2 py-3">Team</th>
                        <th className="px-2 py-3 text-center">Group</th>
                        <th className="px-2 py-3 text-center">P</th>
                        <th className="px-2 py-3 text-center">GD</th>
                        <th className="px-2 py-3 text-center">Pts</th>
                        <th className="px-2 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/65">
                      {bestThirdPlaceTeams.map((team, idx) => {
                        const qualifies = idx < 8;
                        return (
                          <tr key={team.id} className={qualifies ? 'bg-green-500/[0.02]' : 'bg-red-500/[0.02]'}>
                            <td className="px-2 py-3 font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-2 py-3">
                              <div className="flex items-center gap-3">
                                <Flag code={team.countryCode} />
                                <span className="font-bold text-white">{team.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center font-bold text-gray-400">{team.group}</td>
                            <td className="px-2 py-3 text-center text-gray-300">{team.played}</td>
                            <td className="px-2 py-3 text-center text-gray-300">{(team.gd > 0 ? '+' : '') + team.gd}</td>
                            <td className="px-2 py-3 text-center font-black text-white">{team.pts}</td>
                            <td className="px-2 py-3 text-right">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                qualifies 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/25' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/25'
                              }`}>
                                {qualifies ? 'Qualified' : 'Eliminated'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automatic Qualifiers Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[500px]">
                <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-gray-800 pb-3 mb-4 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-green-500" />
                  Automatic Qualifiers (Top 2)
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {groups.map(g => {
                    const top2 = simGroupStandings[g]?.slice(0, 2) || [];
                    return (
                      <div key={g} className="bg-gray-950 p-3 rounded-xl border border-gray-900 flex items-center justify-between">
                        <span className="text-xs font-black text-gray-500 uppercase">Group {g}</span>
                        <div className="flex items-center gap-4">
                          {top2.map((team, idx) => (
                            <div key={team.id} className="flex items-center gap-1.5" title={`${idx+1}st Place`}>
                              <Flag code={team.countryCode} style={{ fontSize: '1.2rem' }} />
                              <span className="text-xs font-black text-white">{team.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Midpoint Awards Grid */}
            {renderAwardsGrid("Current Player Statistics")}

            {/* Standings list */}
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-green-500 pl-3">Simulated Standings Table</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groups.map(g => (
                  <div key={g} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">Group {g}</h3>
                    <GroupTable teams={simGroupStandings[g] || []} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SIMULATING KNOCKOUTS & COMPLETED STATES BRACKET DISPLAY */}
        {(simState === 'simulating_knockouts' || simState === 'completed') && (
          <div className="space-y-12">
            
            {/* Simulation trigger console (Auto Mode) */}
            {simState === 'simulating_knockouts' && simType === 'auto' && (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-1">Knockout Stage active</span>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">
                    Simulating: {currentKnockoutRound.replace(/([A-Z])/g, ' $1').trim()}
                  </h2>
                  <p className="text-gray-400 text-xs font-medium">
                    Play match-by-match or skip to resolve this round's qualifiers instantly.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={skipKnockoutRoundSimulation}
                    className="flex items-center gap-2 border border-gray-800"
                  >
                    <FastForward className="w-4 h-4" />
                    Skip Round
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSimType('manual')}
                    className="flex items-center gap-2 border border-blue-500/35 hover:border-blue-400 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
                  >
                    <User className="w-4 h-4" />
                    Manual Entry
                  </Button>
                  <Button
                    variant="primary"
                    onClick={simulateActiveKnockoutRound}
                    className="px-6 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Simulation
                  </Button>
                </div>
              </div>
            )}

            {/* Simulation trigger console (Manual Mode) */}
            {simState === 'simulating_knockouts' && simType === 'manual' && (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-1">Knockout Stage Manual Entry</span>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-1">
                    Entering Round: {currentKnockoutRound.replace(/([A-Z])/g, ' $1').trim()}
                  </h2>
                  <p className="text-gray-400 text-xs font-medium">
                    Enter the match scores sequentially to decide who advances.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSimType('auto');
                      setIsPaused(true);
                    }}
                    className="flex items-center gap-2 border border-green-500/35 hover:border-green-400 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto Simulate
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentKnockoutMatchIndex(0)}
                    className="px-6 py-3 bg-blue-500 text-white hover:bg-blue-400 font-black uppercase text-xs tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Begin Entering Scores
                  </Button>
                </div>
              </div>
            )}

            {/* Winner banner */}
            {simState === 'completed' && knockoutRounds.winner && (
              <section className="bg-gradient-to-r from-yellow-500/10 via-amber-500/20 to-yellow-500/10 border border-yellow-500/20 p-12 rounded-3xl text-center relative overflow-hidden shadow-2xl max-w-4xl mx-auto backdrop-blur-sm">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_60%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                    className="mb-6 flex justify-center drop-shadow-[0_10px_15px_rgba(245,158,11,0.3)]"
                  >
                    <Flag code={knockoutRounds.winner.countryCode} style={{ fontSize: '8rem' }} />
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-6xl font-black text-white uppercase italic tracking-tighter mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent"
                  >
                    {knockoutRounds.winner.name}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-yellow-500 font-black text-2xl uppercase tracking-widest italic flex items-center gap-2"
                  >
                    🏆 WORLD CUP 2026 CHAMPION 🏆
                  </motion.p>
                </div>
              </section>
            )}

            {/* Third Place Card Display (Resolved user feedback) */}
            {simState === 'completed' && knockoutRounds.thirdPlace && (
              <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl max-w-sm mx-auto text-center shadow-xl backdrop-blur-sm">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-3">Third Place Play-off Result</span>
                <div className="flex items-center justify-between gap-4 border-b border-gray-850 pb-3 mb-2">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-bold text-white text-xs">{knockoutRounds.thirdPlace.t1?.code}</span>
                    <Flag code={knockoutRounds.thirdPlace.t1?.countryCode} />
                  </div>
                  <span className="font-black text-white text-md tabular-nums">{knockoutRounds.thirdPlace.score[0]} - {knockoutRounds.thirdPlace.score[1]}</span>
                  <div className="flex items-center gap-2 flex-1 justify-start">
                    <Flag code={knockoutRounds.thirdPlace.t2?.countryCode} />
                    <span className="font-bold text-white text-xs">{knockoutRounds.thirdPlace.t2?.code}</span>
                  </div>
                </div>
                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest block">
                  🥉 Bronze Medal: {knockoutRounds.thirdPlace.winner?.name}
                </span>
              </div>
            )}

            {/* Awards section */}
            {simState === 'completed' && renderAwardsGrid("Tournament Awards")}

            {/* Bracket/Standings/3rd Place view */}
            <section className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800/80 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 border-b border-gray-800/50 pb-4">
                <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-yellow-500 pl-3">
                  {knockoutViewTab === 'bracket' 
                    ? 'Simulation Knockout Bracket' 
                    : knockoutViewTab === 'standings' 
                      ? 'Group Stage Standings' 
                      : 'Best 3rd-Place Leaderboard'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                  <div className="flex flex-wrap bg-gray-955/60 p-1 rounded-xl border border-gray-850 gap-1 sm:gap-0">
                    <button
                      onClick={() => setKnockoutViewTab('bracket')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        knockoutViewTab === 'bracket'
                          ? 'bg-yellow-500 text-gray-950 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Knockout Bracket
                    </button>
                    <button
                      onClick={() => setKnockoutViewTab('standings')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        knockoutViewTab === 'standings'
                          ? 'bg-yellow-500 text-gray-950 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Group Standings
                    </button>
                    <button
                      onClick={() => setKnockoutViewTab('thirdPlace')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        knockoutViewTab === 'thirdPlace'
                          ? 'bg-yellow-500 text-gray-950 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Best 3rd Place
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setResultsModalTab(simState === 'completed' ? 'knockouts' : 'groups');
                      setShowAllResultsModal(true);
                    }}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-gray-800 hover:bg-gray-855 flex items-center gap-1.5"
                  >
                    <ListFilter className="w-3.5 h-3.5 text-gray-400" />
                    All Match Results
                  </Button>
                </div>
              </div>

              {knockoutViewTab === 'bracket' && (
                <div className="overflow-x-auto scrollbar-thin">
                  <KnockoutBracket
                    rounds={{
                      roundOf32: knockoutRounds.roundOf32 || [],
                      roundOf16: knockoutRounds.roundOf16 || [],
                      quarterFinals: knockoutRounds.quarterFinals || [],
                      semiFinals: knockoutRounds.semiFinals || [],
                      final: [knockoutRounds.final].filter(Boolean),
                      thirdPlace: knockoutRounds.thirdPlace
                    }}
                  />
                </div>
              )}

              {knockoutViewTab === 'standings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {groups.map(g => (
                    <div key={g} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 shadow-xl">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">Group {g}</h3>
                      <GroupTable teams={simGroupStandings[g] || []} />
                    </div>
                  ))}
                </div>
              )}

              {knockoutViewTab === 'thirdPlace' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Best 3rd-Place Leaderboard
                    </h3>
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase bg-gray-955 px-2 py-0.5 rounded">Top 8 Qualify</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                        <tr>
                          <th className="px-2 py-3">Pos</th>
                          <th className="px-2 py-3">Team</th>
                          <th className="px-2 py-3 text-center">Group</th>
                          <th className="px-2 py-3 text-center">P</th>
                          <th className="px-2 py-3 text-center">GD</th>
                          <th className="px-2 py-3 text-center">Pts</th>
                          <th className="px-2 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/65">
                        {bestThirdPlaceTeams.map((team, idx) => {
                          const qualifies = idx < 8;
                          return (
                            <tr key={team.id} className={qualifies ? 'bg-green-500/[0.02]' : 'bg-red-500/[0.02]'}>
                              <td className="px-2 py-3 font-bold text-gray-400">{idx + 1}</td>
                              <td className="px-2 py-3">
                                <div className="flex items-center gap-3">
                                  <Flag code={team.countryCode} />
                                  <span className="font-bold text-white">{team.name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-center font-bold text-gray-400">{team.group}</td>
                              <td className="px-2 py-3 text-center text-gray-300">{team.played}</td>
                              <td className="px-2 py-3 text-center text-gray-300">{(team.gd > 0 ? '+' : '') + team.gd}</td>
                              <td className="px-2 py-3 text-center font-black text-white">{team.pts}</td>
                              <td className="px-2 py-3 text-right">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  qualifies 
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/25' 
                                    : 'bg-red-500/10 text-red-400 border border-red-500/25'
                                }`}>
                                  {qualifies ? 'Qualified' : 'Eliminated'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

          </div>
        )}

        {/* Detailed Stats Modal Overlay */}
        {detailedStatsModal && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{detailedStatsModal.title}</h3>
                <button
                  onClick={() => setDetailedStatsModal(null)}
                  className="text-gray-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-850">
                    <tr>
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Player</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3 text-right">
                        {detailedStatsModal.type === 'goals' ? 'Goals' : detailedStatsModal.type === 'assists' ? 'Assists' : 'Clean Sheets'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/60">
                    {detailedStatsModal.data.slice(0, 10).map((player, idx) => (
                      <tr key={idx} className="hover:bg-gray-950/40">
                        <td className="px-3 py-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-3 font-bold text-white">{player.name}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Flag code={player.team?.countryCode} style={{ fontSize: '0.9rem' }} />
                            <span className="text-gray-300 font-semibold">{player.team?.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-black text-green-400">{player.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-800">
                <Button
                  variant="secondary"
                  onClick={() => setDetailedStatsModal(null)}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-800 hover:bg-gray-850"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* VIEW ALL MATCH RESULTS MODAL */}
        {showAllResultsModal && (
          <div className="fixed inset-0 bg-gray-955/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden p-6 flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-yellow-500" />
                    Simulation Match Results
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Browse results for all simulated matches in this run.</p>
                </div>
                <button
                  onClick={() => setShowAllResultsModal(false)}
                  className="text-gray-400 hover:text-white font-bold text-sm bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tab Selector inside modal if tournament is completed */}
              {simState === 'completed' && (
                <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-850 gap-1 self-start">
                  <button
                    onClick={() => setResultsModalTab('groups')}
                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      resultsModalTab === 'groups'
                        ? 'bg-yellow-500 text-gray-950 shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Group Stage
                  </button>
                  <button
                    onClick={() => setResultsModalTab('knockouts')}
                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      resultsModalTab === 'knockouts'
                        ? 'bg-yellow-500 text-gray-950 shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Knockout Stage
                  </button>
                </div>
              )}

              {/* Scrollable Results List */}
              <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin space-y-6 my-2">
                {resultsModalTab === 'groups' ? (
                  // GROUP STAGE MATCHES
                  (() => {
                    const groupedMatches = {};
                    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
                    groupLetters.forEach(letter => {
                      groupedMatches[letter] = [];
                    });

                    simMatches.forEach(m => {
                      if (m.match_id <= 72 && m.group && groupedMatches[m.group]) {
                        groupedMatches[m.group].push(m);
                      }
                    });

                    return groupLetters.map(letter => {
                      const groupM = groupedMatches[letter] || [];
                      if (groupM.length === 0) return null;

                      return (
                        <div key={letter} className="space-y-3">
                          <h4 className="text-xs font-black text-yellow-500 uppercase tracking-widest border-b border-gray-800/80 pb-1.5 pl-1 flex items-center justify-between">
                            <span>Group {letter}</span>
                            <span className="text-[9px] text-gray-500 lowercase font-extrabold bg-gray-950 px-1.5 py-0.5 rounded">6 matches</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groupM.map((match, idx) => {
                              const homeTeam = teams.find(t => t.id === match.homeTeam) || { name: match.homeTeam };
                              const awayTeam = teams.find(t => t.id === match.awayTeam) || { name: match.awayTeam };
                              return (
                                <div key={idx} className="bg-gray-955/30 border border-gray-850/60 p-3 rounded-xl flex items-center justify-between text-xs hover:border-gray-800 transition-colors">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Flag code={homeTeam.countryCode} />
                                    <span className="font-bold text-gray-200 truncate">{homeTeam.name}</span>
                                  </div>
                                  <div className="px-3 py-1 bg-gray-900 border border-gray-800 rounded font-black text-white tabular-nums min-w-[50px] text-center mx-2 shadow-sm">
                                    {match.homeScore} - {match.awayScore}
                                  </div>
                                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                    <span className="font-bold text-gray-200 truncate text-right">{awayTeam.name}</span>
                                    <Flag code={awayTeam.countryCode} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  // KNOCKOUT STAGE MATCHES
                  (() => {
                    const roundsToRender = [
                      { key: 'roundOf32', title: 'Round of 32' },
                      { key: 'roundOf16', title: 'Round of 16' },
                      { key: 'quarterFinals', title: 'Quarter-Finals' },
                      { key: 'semiFinals', title: 'Semi-Finals' },
                      { key: 'thirdPlace', title: 'Third Place Play-off', single: true },
                      { key: 'final', title: 'Grand Final', single: true }
                    ];

                    return roundsToRender.map(round => {
                      let roundMatches = [];
                      if (round.single) {
                        const m = knockoutRounds[round.key];
                        if (m) roundMatches = [m];
                      } else {
                        roundMatches = knockoutRounds[round.key] || [];
                      }

                      if (roundMatches.length === 0) return null;

                      return (
                        <div key={round.key} className="space-y-3">
                          <h4 className="text-xs font-black text-yellow-500 uppercase tracking-widest border-b border-gray-800 pb-1 pl-1">
                            {round.title}
                          </h4>
                          <div className="space-y-2.5">
                            {roundMatches.map((match, idx) => {
                              const t1 = match.t1 || { name: 'TBD', code: 'TBD' };
                              const t2 = match.t2 || { name: 'TBD', code: 'TBD' };
                              const homeScore = match.score ? match.score[0] : null;
                              const awayScore = match.score ? match.score[1] : null;

                              let penaltyText = '';
                              if (match.isPenalties && match.pensScore) {
                                penaltyText = ` (Pens: ${match.pensScore[0]}-${match.pensScore[1]})`;
                              } else if (match.isAET) {
                                penaltyText = ' (AET)';
                              }

                              return (
                                <div key={idx} className="bg-gray-955/50 border border-gray-850 p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-gray-800 transition-all">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <Flag code={t1.countryCode} />
                                    <span className="font-bold text-white truncate">{t1.name}</span>
                                  </div>
                                  <div className="flex flex-col items-center mx-3 min-w-[90px]">
                                    <span className="px-3 py-1 bg-gray-900 border border-gray-800 rounded font-black text-white tabular-nums text-center">
                                      {homeScore !== null ? `${homeScore} - ${awayScore}` : 'vs'}
                                    </span>
                                    {penaltyText && (
                                      <span className="text-[9px] font-black text-yellow-400 mt-1 uppercase tracking-wider">
                                        {penaltyText}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                                    <span className="font-bold text-white truncate text-right">{t2.name}</span>
                                    <Flag code={t2.countryCode} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-800">
                <Button
                  variant="secondary"
                  onClick={() => setShowAllResultsModal(false)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-800 hover:bg-gray-850"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Simulator;