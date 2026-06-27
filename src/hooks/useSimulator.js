import { useCallback } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { getHistoricalTeamDetails } from '../data/historicalData';
import { calculateTeamStrength } from '../utils/simulationHelpers';
import { getRoundOf32Pairings } from '../utils/knockoutAllocation';



export const useSimulator = () => {
  const {
    teams,
    matches,
    historicalSwaps,
    runSimulation,
    setSimulationResults,
    setIsSimulating
  } = useTournamentStore();

  const simulateMatch = useCallback((teamA, teamB, isKnockout = false, realismCategory = 'realistic') => {
    const baseStrengthA = calculateTeamStrength(teamA);
    const baseStrengthB = calculateTeamStrength(teamB);
    
    // Apply Randomness Adjustment: min((Power Score Difference / 2), 5)
    // Only applied in the 'realistic' (Normal) category for now
    const powerDiff = Math.abs(baseStrengthA - baseStrengthB);
    const adjustment = realismCategory === 'realistic' ? Math.min(powerDiff / 2, 5) : 0;
    
    let adjA = baseStrengthA;
    let adjB = baseStrengthB;
    
    if (baseStrengthA > baseStrengthB) {
      adjA = baseStrengthA - adjustment;
      adjB = baseStrengthB + adjustment;
    } else if (baseStrengthB > baseStrengthA) {
      adjA = baseStrengthA + adjustment;
      adjB = baseStrengthB - adjustment;
    }
    
    // Add random variance (±5%)
    const varianceA = 1 + (Math.random() - 0.5) * 0.1;
    const varianceB = 1 + (Math.random() - 0.5) * 0.1;
    
    const strengthA = Math.min(100, Math.max(0, adjA * varianceA));
    const strengthB = Math.min(100, Math.max(0, adjB * varianceB));

    const totalScore = strengthA + strengthB;
    const probA = strengthA / totalScore;

    // Simulate goals (Poisson-ish distribution simplified)
    const lambda = 1.5; // Average goals per team
    let goalsA = Math.floor(Math.random() * (lambda + (probA * 2)));
    let goalsB = Math.floor(Math.random() * (lambda + ((1 - probA) * 2)));

    // Extra weight for higher ranked teams
    if (Math.random() < probA) goalsA += Math.floor(Math.random() * 2);
    if (Math.random() < (1 - probA)) goalsB += Math.floor(Math.random() * 2);

    // Ensure winner in knockout
    if (isKnockout && goalsA === goalsB) {
      if (Math.random() < probA) goalsA += 1;
      else goalsB += 1;
    }

    return { goalsA, goalsB };
  }, []);

  const simulateTournament = useCallback(() => {
    setIsSimulating(true);

    // Apply historical swaps if exist
    let effectiveTeams = [...teams];
    if (historicalSwaps && Object.keys(historicalSwaps).length > 0) {
      effectiveTeams = effectiveTeams.map(t => {
        const swapId = historicalSwaps[t.id];
        if (swapId) {
          const histTeam = getHistoricalTeamDetails(t.id, swapId, teams);
          return { ...t, name: `${histTeam.teamName} (${histTeam.year})`, ranking: 1, isHistorical: true };
        }
        return t;
      });
    }

    // 1. Group Stage
    const simulatedMatches = matches.map(match => {
      if (match.status === 'completed') {
        return match; // Keep real-world completed match results
      }
      const teamA = effectiveTeams.find(t => t.id === match.homeTeam);
      const teamB = effectiveTeams.find(t => t.id === match.awayTeam);
      const result = simulateMatch(teamA, teamB);
      return {
        ...match,
        status: 'completed',
        homeScore: result.goalsA,
        awayScore: result.goalsB
      };
    });

    // 2. Compute Group Standings to find qualifiers
    const standings = {};
    effectiveTeams.forEach(t => {
      if (!standings[t.group]) standings[t.group] = [];
      standings[t.group].push({ ...t, pts: 0, gd: 0, gf: 0 });
    });

    simulatedMatches.forEach(m => {
      if (m.match_id > 72) return;
      const group = standings[m.group];
      const h = group.find(t => t.id === m.homeTeam);
      const a = group.find(t => t.id === m.awayTeam);
      h.gf += m.homeScore;
      h.ga = (h.ga || 0) + m.awayScore;
      a.gf += m.awayScore;
      a.ga = (a.ga || 0) + m.homeScore;
      if (m.homeScore > m.awayScore) h.pts += 3;
      else if (m.homeScore < m.awayScore) a.pts += 3;
      else { h.pts += 1; a.pts += 1; }
      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
    });

    const sortedGroupKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const qualifiers = [];
    const thirdPlaceTeams = [];

    sortedGroupKeys.forEach(g => {
      const sorted = standings[g].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      qualifiers.push(sorted[0], sorted[1]); // Top 2
      thirdPlaceTeams.push(sorted[2]);
    });

    // Best 8 third-place teams (for 48-team format)
    const bestThird = thirdPlaceTeams
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .slice(0, 8);

    const fallbackTeam = (name) => ({ id: 'tbd', name: name || 'TBD', code: 'TBD', countryCode: '' });
    const getTeam = (team, fallbackName) => team || fallbackTeam(fallbackName);

    const w = (group) => standings[group]?.[0];
    const ru = (group) => standings[group]?.[1];

    const pairings = getRoundOf32Pairings(w, ru, bestThird, getTeam, false);

    // 3. Knockouts (Official 2026 Schedule)
    const runKnockoutRound = (roundMatches) => {
      const nextRound = [];
      const outMatches = [];
      for (let i = 0; i < roundMatches.length; i += 2) {
        const m1 = roundMatches[i];
        const m2 = roundMatches[i + 1];
        
        const t1 = m1.winner || m1.t1;
        const t2 = m2.winner || m2.t2;
        
        const res = simulateMatch(t1, t2, true);
        const winner = res.goalsA > res.goalsB ? t1 : t2;
        const loser = res.goalsA > res.goalsB ? t2 : t1;
        nextRound.push(winner);
        outMatches.push({ t1, t2, score: [res.goalsA, res.goalsB], winner, loser });
      }
      return { nextRound, matches: outMatches };
    };

    const r32Matches = pairings.map(p => {
      const res = simulateMatch(p.t1, p.t2, true);
      const winner = res.goalsA > res.goalsB ? p.t1 : p.t2;
      const loser = res.goalsA > res.goalsB ? p.t2 : p.t1;
      return { t1: p.t1, t2: p.t2, score: [res.goalsA, res.goalsB], winner, loser };
    });

    const r16 = runKnockoutRound(r32Matches);
    const qf = runKnockoutRound(r16.matches);
    const sf = runKnockoutRound(qf.matches);

    // Final and Third Place
    const finalRes = simulateMatch(sf.nextRound[0], sf.nextRound[1], true);
    const winner = finalRes.goalsA > finalRes.goalsB ? sf.nextRound[0] : sf.nextRound[1];
    const runnerUp = finalRes.goalsA > finalRes.goalsB ? sf.nextRound[1] : sf.nextRound[0];

    const thirdPlaceRes = simulateMatch(sf.matches[0].loser, sf.matches[1].loser, true);
    const thirdPlaceWinner = thirdPlaceRes.goalsA > thirdPlaceRes.goalsB ? sf.matches[0].loser : sf.matches[1].loser;

    setSimulationResults({
      groupMatches: simulatedMatches,
      roundOf32: r32Matches,
      roundOf16: r16.matches,
      quarterFinals: qf.matches,
      semiFinals: sf.matches,
      final: { t1: sf.nextRound[0], t2: sf.nextRound[1], score: [finalRes.goalsA, finalRes.goalsB], winner },
      winner: winner,
      thirdPlace: thirdPlaceWinner
    });

    // Save simulation results to server
    const formatTeam = (t) => t ? { id: t.id, name: t.name, code: t.code } : null;
    const simData = {
      realismCategory: 'realistic',
      groupMatches: simulatedMatches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        group: m.group
      })),
      roundOf32: r32Matches.map(m => ({
        t1: formatTeam(m.t1),
        t2: formatTeam(m.t2),
        score: m.score,
        winner: formatTeam(m.winner),
        loser: formatTeam(m.loser)
      })),
      roundOf16: r16.matches.map(m => ({
        t1: formatTeam(m.t1),
        t2: formatTeam(m.t2),
        score: m.score,
        winner: formatTeam(m.winner),
        loser: formatTeam(m.loser)
      })),
      quarterFinals: qf.matches.map(m => ({
        t1: formatTeam(m.t1),
        t2: formatTeam(m.t2),
        score: m.score,
        winner: formatTeam(m.winner),
        loser: formatTeam(m.loser)
      })),
      semiFinals: sf.matches.map(m => ({
        t1: formatTeam(m.t1),
        t2: formatTeam(m.t2),
        score: m.score,
        winner: formatTeam(m.winner),
        loser: formatTeam(m.loser)
      })),
      final: {
        t1: formatTeam(sf.nextRound[0]),
        t2: formatTeam(sf.nextRound[1]),
        score: [finalRes.goalsA, finalRes.goalsB],
        winner: formatTeam(winner)
      },
      thirdPlace: thirdPlaceWinner ? {
        t1: formatTeam(sf.matches[0].loser),
        t2: formatTeam(sf.matches[1].loser),
        score: [thirdPlaceRes.goalsA, thirdPlaceRes.goalsB],
        winner: formatTeam(thirdPlaceWinner)
      } : null,
      winner: formatTeam(winner)
    };

    fetch('/api/save-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simData),
    }).catch(err => console.error('Failed to save simulation from hook:', err));

    setIsSimulating(false);
  }, [teams, matches, historicalSwaps, simulateMatch, setSimulationResults, setIsSimulating]);

  return { simulateTournament };
};
