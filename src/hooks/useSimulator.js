import { useCallback } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { getHistoricalTeamDetails } from '../data/historicalData';

const assignThirdPlaceTeams = (bestThird) => {
  const assignments = {
    E: null, I: null, A: null, L: null, D: null, G: null, B: null, K: null
  };
  const allowed = {
    E: ['A', 'B', 'C', 'D', 'F'],
    I: ['C', 'D', 'F', 'G', 'H'],
    A: ['C', 'E', 'F', 'H', 'I'],
    L: ['E', 'H', 'I', 'J', 'K'],
    D: ['B', 'E', 'F', 'I', 'J'],
    G: ['A', 'E', 'H', 'I', 'J'],
    B: ['E', 'F', 'G', 'I', 'J'],
    K: ['D', 'E', 'I', 'J', 'L']
  };

  const pool = [...bestThird];
  const keys = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K'];

  const match = (index) => {
    if (index === keys.length) return true;
    const key = keys[index];
    const allowedGroups = allowed[key];

    for (let i = 0; i < pool.length; i++) {
      const team = pool[i];
      if (team && allowedGroups.includes(team.group)) {
        assignments[key] = team;
        pool[i] = null;
        if (match(index + 1)) return true;
        pool[i] = team;
        assignments[key] = null;
      }
    }
    return false;
  };

  const success = match(0);

  if (!success) {
    const remainingPool = [...bestThird];
    keys.forEach(key => {
      if (!assignments[key]) {
        const idx = remainingPool.findIndex(t => t !== null);
        if (idx !== -1) {
          assignments[key] = remainingPool[idx];
          remainingPool[idx] = null;
        }
      }
    });
  }

  return assignments;
};

export const useSimulator = () => {
  const {
    teams,
    matches,
    historicalSwaps,
    runSimulation,
    setSimulationResults,
    setIsSimulating
  } = useTournamentStore();

  const simulateMatch = useCallback((teamA, teamB, isKnockout = false) => {
    // Basic probability based on FIFA ranking (lower ranking is better)
    // We normalize ranking to a power score
    const scoreA = Math.max(1, 100 - (teamA.fifaRanking || teamA.ranking || 50));
    const scoreB = Math.max(1, 100 - (teamB.fifaRanking || teamB.ranking || 50));

    const totalScore = scoreA + scoreB;
    const probA = scoreA / totalScore;

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

    const thirdPlaceAllocations = assignThirdPlaceTeams(bestThird);

    const pairings = [
      // Match 73 vs Match 74
      { t1: getTeam(ru('A'), 'A runner-up'), t2: getTeam(ru('B'), 'B runner-up') },
      { t1: getTeam(w('E'), 'Group E winner'), t2: getTeam(thirdPlaceAllocations['E'], 'E/A/B/C/D/F 3rd') },

      // Match 75 vs Match 76
      { t1: getTeam(w('F'), 'Group F winner'), t2: getTeam(ru('C'), 'C runner-up') },
      { t1: getTeam(w('C'), 'Group C winner'), t2: getTeam(ru('F'), 'F runner-up') },

      // Match 77 vs Match 78
      { t1: getTeam(w('I'), 'Group I winner'), t2: getTeam(thirdPlaceAllocations['I'], 'I/C/D/F/G/H 3rd') },
      { t1: getTeam(ru('E'), 'E runner-up'), t2: getTeam(ru('I'), 'I runner-up') },

      // Match 79 vs Match 80
      { t1: getTeam(w('A'), 'Group A winner'), t2: getTeam(thirdPlaceAllocations['A'], 'A/C/E/F/H/I 3rd') },
      { t1: getTeam(w('L'), 'Group L winner'), t2: getTeam(thirdPlaceAllocations['L'], 'L/E/H/I/J/K 3rd') },

      // Match 81 vs Match 82
      { t1: getTeam(w('D'), 'Group D winner'), t2: getTeam(thirdPlaceAllocations['D'], 'D/B/E/F/I/J 3rd') },
      { t1: getTeam(w('G'), 'Group G winner'), t2: getTeam(thirdPlaceAllocations['G'], 'G/A/E/H/I/J 3rd') },

      // Match 83 vs Match 84
      { t1: getTeam(ru('K'), 'K runner-up'), t2: getTeam(ru('L'), 'L runner-up') },
      { t1: getTeam(w('H'), 'Group H winner'), t2: getTeam(ru('J'), 'J runner-up') },

      // Match 85 vs Match 86
      { t1: getTeam(w('B'), 'Group B winner'), t2: getTeam(thirdPlaceAllocations['B'], 'B/E/F/G/I/J 3rd') },
      { t1: getTeam(w('J'), 'Group J winner'), t2: getTeam(ru('H'), 'H runner-up') },

      // Match 87 vs Match 88
      { t1: getTeam(w('K'), 'Group K winner'), t2: getTeam(thirdPlaceAllocations['K'], 'K/D/E/I/J/L 3rd') },
      { t1: getTeam(ru('D'), 'D runner-up'), t2: getTeam(ru('G'), 'G runner-up') }
    ];

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

    setIsSimulating(false);
  }, [teams, matches, historicalSwaps, simulateMatch, setSimulationResults, setIsSimulating]);

  return { simulateTournament };
};
