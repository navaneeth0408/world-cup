/**
 * Overhauled match simulation helper.
 * Generates scores, goalscorers, assists, clean sheets, and cards using actual squad data.
 */

import formScoreData from '../data/form_score.json';
import cohesionData from '../data/cohesion.json';
import adaptabilityData from '../data/adaptability_scores_final.json';
import fifaRankingData from '../data/fifa_ranking.json';
import squadStrengthData from '../data/squad_strength.json';
import continentalPerformanceData from '../data/continental_performance.json';
import wcHistoryData from '../data/wc_history.json';
import recentWcPerformanceData from '../data/recent_wc_performance.json';
import lineupsData from '../data/lineups.json';

// Helper to resolve starting lineup from lineups.json or fallback to full squad
export const getStartingLineupSquad = (team) => {
  if (!team) return [];

  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  const normTeamName = normalize(team.name);
  const lineupInfo = lineupsData?.teams?.find(
    t => normalize(t.country_name) === normTeamName
  );

  if (lineupInfo && lineupInfo.starting_lineup) {
    return Object.entries(lineupInfo.starting_lineup).map(([posKey, name]) => {
      let position = 'FWD';
      const pk = posKey.toUpperCase();
      if (pk.includes('GK')) position = 'GK';
      else if (pk.includes('B')) position = 'DEF'; // RB, LB, CB, RWB, LWB, etc.
      else if (pk.includes('M')) position = 'MID'; // DM, CM, AM, RM, LM, etc.
      else if (pk.includes('W') || pk === 'CF' || pk === 'ST' || pk === 'SS' || pk === 'RF' || pk === 'LF') position = 'FWD';

      const squadPlayer = team.squad?.find(p => normalize(p.name) === normalize(name));

      return {
        name,
        position,
        number: squadPlayer ? squadPlayer.number : 99
      };
    });
  }

  return team.squad || [];
};

// Helper to match team IDs and names to keys in JSON datasets
export const getTeamDataKey = (team, data) => {
  if (!team) return null;
  const keys = Object.keys(data);
  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  const normId = normalize(team.id);
  const normName = normalize(team.name);

  const specialMappings = {
    'usa': 'unitedstates',
    'drcongo': 'drcongo',
    'bosniaandherzegovina': 'bosniaandherzegovina',
    'capeverde': 'capeverde',
    'curacao': 'curacao',
    'saudiarabia': 'saudiarabia',
    'southafrica': 'southafrica',
    'southkorea': 'southkorea',
    'turkiye': 'turkiye',
  };

  const match = keys.find(key => {
    const normKey = normalize(key);
    if (normKey === normId || normKey === normName) return true;
    if (specialMappings[normId] && normKey === specialMappings[normId]) return true;
    if (specialMappings[normName] && normKey === specialMappings[normName]) return true;
    return false;
  });

  return match || null;
};

// Helper to choose a random item from array based on weights
const chooseWeighted = (items, weightFn) => {
  if (!items || items.length === 0) return null;
  const weights = items.map(weightFn);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  return items[items.length - 1];
};

// Select scorer from a team's squad based on position weights
const selectScorer = (squad) => {
  if (!squad || squad.length === 0) return { name: 'Unknown Scorer' };
  const outfield = squad.filter(p => p.position !== 'GK');
  const pool = outfield.length > 0 ? outfield : squad;

  return chooseWeighted(pool, player => {
    switch (player.position) {
      case 'FWD': return 6;
      case 'MID': return 3;
      case 'DEF': return 1;
      default: return 1;
    }
  });
};

// Select assister from a team's squad, excluding the scorer
const selectAssister = (squad, scorerName) => {
  if (!squad || squad.length === 0) return null;
  const candidates = squad.filter(p => p.name !== scorerName && p.position !== 'GK');
  if (candidates.length === 0) return null;

  return chooseWeighted(candidates, player => {
    switch (player.position) {
      case 'MID': return 6;
      case 'FWD': return 3;
      case 'DEF': return 1;
      default: return 1;
    }
  });
};

// Select a player for a booking
const selectPlayerForBooking = (squad) => {
  if (!squad || squad.length === 0) return { name: 'Unknown Player' };
  return squad[Math.floor(Math.random() * squad.length)];
};

export const getTeamStrengthDetails = (team) => {
  // 1. FIFA Ranking Score (25%)
  const fifaKey = getTeamDataKey(team, fifaRankingData);
  const fifaScore = team.fifaScore !== undefined ? Number(team.fifaScore) : (fifaKey ? Number((fifaRankingData[fifaKey].fifaScore || 0).toFixed(2)) : 50.00);

  // 2. Squad Quality Score (20%)
  const squadKey = getTeamDataKey(team, squadStrengthData);
  const squadScore = team.squadScore !== undefined ? Number(team.squadScore) : (squadKey ? Number((squadStrengthData[squadKey].squadScore || 0).toFixed(2)) : 50.00);

  // 3. Form Score (15%)
  const formKey = getTeamDataKey(team, formScoreData);
  const formScore = team.formScore !== undefined ? Number(team.formScore) : (formKey ? Number((formScoreData[formKey].formScore || 0).toFixed(2)) : 50.00);

  // 4. Cohesion Score (15%)
  const cohesionKey = getTeamDataKey(team, cohesionData);
  const cohesionScore = team.cohesionScore !== undefined ? Number(team.cohesionScore) : (cohesionKey ? Number((cohesionData[cohesionKey].cohesionScore || 0).toFixed(2)) : 50.00);

  // 5. Continental Tournament Score (7.5%)
  const continentalKey = getTeamDataKey(team, continentalPerformanceData);
  const continentalScore = team.continentalScore !== undefined ? Number(team.continentalScore) : (continentalKey ? Number((continentalPerformanceData[continentalKey].continentalScore || 0).toFixed(2)) : 50.00);

  // 6. Historical World Cup Pedigree Score (7.5%)
  const historyKey = getTeamDataKey(team, wcHistoryData);
  const historyScore = team.historyScore !== undefined ? Number(team.historyScore) : (historyKey ? Number((wcHistoryData[historyKey].historyScore || 0).toFixed(2)) : 50.00);

  // 7. Recent World Cup Performance Score (5%)
  const recentWcKey = getTeamDataKey(team, recentWcPerformanceData);
  const worldCupRecentScore = team.worldCupRecentScore !== undefined ? Number(team.worldCupRecentScore) : (recentWcKey ? Number((recentWcPerformanceData[recentWcKey].wcRecentScore || 0).toFixed(2)) : 50.00);

  // 8. Adaptability Score (5%)
  const adaptabilityKey = getTeamDataKey(team, adaptabilityData);
  const adaptabilityScore = team.adaptabilityScore !== undefined ? Number(team.adaptabilityScore) : (adaptabilityKey ? Number((adaptabilityData[adaptabilityKey].adaptability_score || 0).toFixed(2)) : 50.00);

  // FINAL FORMULA
  const strength = 
    (fifaScore * 0.25) +
    (squadScore * 0.20) +
    (formScore * 0.15) +
    (cohesionScore * 0.15) +
    (continentalScore * 0.075) +
    (historyScore * 0.075) +
    (worldCupRecentScore * 0.05) +
    (adaptabilityScore * 0.05);

  let powerScore = Number(Math.max(0, Math.min(100, strength)).toFixed(2));

  const isHost = team.id === 'usa' || team.id === 'canada' || team.id === 'mexico' || ['usa', 'canada', 'mexico'].includes(team.name?.toLowerCase());
  if (isHost) {
    powerScore = Number(Math.max(0, Math.min(100, powerScore * 1.10)).toFixed(2));
  }

  // Additional metadata details
  const fifaRanking = team.fifaRanking !== undefined ? team.fifaRanking : (fifaKey ? fifaRankingData[fifaKey].rank : team.fifaRanking || 50);
  const marketValue = team.marketValue !== undefined ? team.marketValue : (squadKey ? squadStrengthData[squadKey].marketValue : 0);

  return {
    powerScore,
    fifaRanking,
    fifaScore,
    marketValue,
    worldCupRecentScore,
    continentalScore,
    squadScore,
    historyScore,
    formScore,
    cohesionScore,
    adaptabilityScore,
    isHostBoosted: isHost,
    total: powerScore, // For backward compatibility with existing code
    leagueScore: worldCupRecentScore, // For backward compatibility
    popScore: continentalScore // For backward compatibility
  };
};

export const calculateTeamStrength = (team) => {
  return getTeamStrengthDetails(team).total;
};

// Simulate a realistic penalty shootout with turn-by-turn kicks and running scores
const simulatePenaltyShootout = (teamA, teamB, probA, startMinute) => {
  const kicks = [];
  const score = [0, 0];
  let round = 1;
  let turn = 0; // 0 for A, 1 for B
  
  // Squad lists (excluding GKs first, then GKs) using starting lineups
  const squadAAll = getStartingLineupSquad(teamA);
  const squadBAll = getStartingLineupSquad(teamB);
  const squadA = squadAAll.filter(p => p.position !== 'GK');
  const squadB = squadBAll.filter(p => p.position !== 'GK');
  const gkA = squadAAll.find(p => p.position === 'GK') || { name: `${teamA.name} GK` };
  const gkB = squadBAll.find(p => p.position === 'GK') || { name: `${teamB.name} GK` };
  
  let indexA = 0;
  let indexB = 0;
  
  const getKicker = (team, index, squad) => {
    if (squad.length === 0) return { name: 'Unknown Kicker' };
    return squad[index % squad.length];
  };

  let finished = false;
  let minute = startMinute - 1;
  
  while (!finished) {
    minute += 1;
    let kicker, team, opponentTeam, gk;
    if (turn === 0) {
      team = teamA;
      opponentTeam = teamB;
      kicker = getKicker(teamA, indexA++, squadA);
      gk = gkB;
    } else {
      team = teamB;
      opponentTeam = teamA;
      kicker = getKicker(teamB, indexB++, squadB);
      gk = gkA;
    }

    // Determine probability of scoring (around 75% baseline)
    const baseProb = 0.75;
    const strengthDiff = (turn === 0 ? (calculateTeamStrength(teamA) - calculateTeamStrength(teamB)) : (calculateTeamStrength(teamB) - calculateTeamStrength(teamA)));
    const finalProb = Math.min(0.9, Math.max(0.5, baseProb + (strengthDiff / 200)));

    const scored = Math.random() < finalProb;
    if (scored) {
      score[turn] += 1;
    }

    kicks.push({
      type: 'penalty_kick',
      minute,
      teamId: team.id,
      teamName: team.name,
      player: kicker.name,
      scored,
      pensScore: [...score],
      detail: scored 
        ? `⚽ Penalty Scored! ${kicker.name} converts for ${team.name}. (Pens: ${score[0]}-${score[1]})`
        : `❌ Penalty Missed! ${kicker.name} misses the target or it is saved by ${gk.name}. (Pens: ${score[0]}-${score[1]})`
    });

    // Check if shootout has finished
    const remainingA = 5 - (turn === 0 ? round : round - 1);
    const remainingB = 5 - round;

    if (round >= 5) {
      if (turn === 1) {
        if (score[0] !== score[1]) {
          finished = true;
        }
      }
    } else {
      // Check if team A cannot catch up
      if (score[0] + remainingA < score[1]) {
        finished = true;
      }
      // Check if team B cannot catch up
      else if (score[1] + remainingB < score[0]) {
        finished = true;
      }
    }

    // Switch turn
    if (turn === 0) {
      turn = 1;
    } else {
      turn = 0;
      round += 1;
    }
  }

  return {
    kicks,
    pensScore: score,
    winner: score[0] > score[1] ? teamA : teamB,
    loser: score[0] > score[1] ? teamB : teamA,
    lastMinute: minute
  };
};

// Main match simulation function with realism styles
export const simulateMatchWithEvents = (teamA, teamB, isKnockout = false, realismCategory = 'moderate', forcedWinnerId = null) => {
  // Use starting lineups for selecting scorers, assisters, bookings, etc.
  const teamAWithStartingSquad = { ...teamA, squad: getStartingLineupSquad(teamA) };
  const teamBWithStartingSquad = { ...teamB, squad: getStartingLineupSquad(teamB) };

  // Compute team strengths (higher is better, range 1-100)
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

  let goalsA = 0;
  let goalsB = 0;

  if (realismCategory === 'favorites' || realismCategory === 'realistic') {
    const isFavMode = realismCategory === 'favorites';
    const diff = strengthA - strengthB;

    if (diff >= 0) {
      // Team A is favorite or equal
      const lambdaA = 1.2 + (diff / 20); // France (98) vs Haiti (10) diff=88 => lambdaA = 1.2 + 4.4 = 5.6
      const lambdaB = Math.max(0, 1.2 - (diff / 30)); // Haiti lambdaB = max(0, 1.2 - 2.9) = 0

      // Low random noise in favorites mode to preserve rank advantages, slightly more in realistic
      const noiseLimit = isFavMode ? 0.3 : 0.8;
      const noiseA = (Math.random() - 0.5) * noiseLimit * 2;
      const noiseB = (Math.random() - 0.5) * noiseLimit * 2;

      goalsA = Math.max(0, Math.round(lambdaA + noiseA));
      goalsB = Math.max(0, Math.round(lambdaB + noiseB));

      // Force favorite win if there is a significant rank gap
      if (diff > (isFavMode ? 6 : 12) && goalsA <= goalsB) {
        goalsA = goalsB + (isFavMode ? 2 : 1);
      }
    } else {
      // Team B is favorite
      const absDiff = Math.abs(diff);
      const lambdaB = 1.2 + (absDiff / 20);
      const lambdaA = Math.max(0, 1.2 - (absDiff / 30));

      const noiseLimit = isFavMode ? 0.3 : 0.8;
      const noiseA = (Math.random() - 0.5) * noiseLimit * 2;
      const noiseB = (Math.random() - 0.5) * noiseLimit * 2;

      goalsA = Math.max(0, Math.round(lambdaA + noiseA));
      goalsB = Math.max(0, Math.round(lambdaB + noiseB));

      // Force favorite win if there is a significant rank gap
      if (absDiff > (isFavMode ? 6 : 12) && goalsB <= goalsA) {
        goalsB = goalsA + (isFavMode ? 2 : 1);
      }
    }
  } else if (realismCategory === 'underdog') {
    // Underdogs get a massive strength boost
    const diff = strengthA - strengthB;
    let boostA = 0;
    let boostB = 0;

    if (diff > 12) {
      // Team B is underdog, give them a boost
      boostB = (diff / 15);
    } else if (diff < -12) {
      // Team A is underdog, give them a boost
      boostA = (Math.abs(diff) / 15);
    }

    const lambdaA = 1.3 + (diff > 0 ? diff / 35 : 0) + boostA;
    const lambdaB = 1.3 + (diff < 0 ? Math.abs(diff) / 35 : 0) + boostB;

    const noiseA = (Math.random() - 0.5) * 1.5;
    const noiseB = (Math.random() - 0.5) * 1.5;

    goalsA = Math.max(0, Math.round(lambdaA + noiseA));
    goalsB = Math.max(0, Math.round(lambdaB + noiseB));
  } else if (realismCategory === 'unrealistic') {
    // Chaos Mode: Equalized lambda, high noise
    const lambda = 1.5;
    goalsA = Math.max(0, Math.round(lambda + (Math.random() - 0.5) * 4));
    goalsB = Math.max(0, Math.round(lambda + (Math.random() - 0.5) * 4));
  } else {
    // Moderate / Standard simulation
    const totalScore = strengthA + strengthB;
    const probA = strengthA / totalScore;
    const lambda = 1.3;

    goalsA = Math.floor(Math.random() * (lambda + (probA * 2)));
    goalsB = Math.floor(Math.random() * (lambda + ((1 - probA) * 2)));

    if (Math.random() < probA) goalsA += Math.floor(Math.random() * 2);
    if (Math.random() < (1 - probA)) goalsB += Math.floor(Math.random() * 2);
  }

  // Enforce forced winner score adjustments before resolving knockout draws
  if (forcedWinnerId) {
    if (forcedWinnerId === teamA.id) {
      if (goalsA < goalsB) {
        // Swap scores so forced team wins
        const temp = goalsA;
        goalsA = goalsB;
        goalsB = temp;
      } else if (goalsA === goalsB && !isKnockout) {
        // In group stages, force a win
        goalsA += 1;
      }
    } else if (forcedWinnerId === teamB.id) {
      if (goalsB < goalsA) {
        // Swap scores
        const temp = goalsA;
        goalsA = goalsB;
        goalsB = temp;
      } else if (goalsA === goalsB && !isKnockout) {
        // In group stages, force a win
        goalsB += 1;
      }
    }
  }

  let status = 'completed';
  let isAET = false;
  let isPenalties = false;
  let pensScore = null;
  let winner = null;
  let loser = null;
  let shootoutEvents = null;
  let shootoutLastMinute = 120;

  // Resolve knockout draws
  if (isKnockout && goalsA === goalsB) {
    const diff = strengthA - strengthB;
    const probA = strengthA / (strengthA + strengthB);

    isAET = true;
    const extraA = Math.random() < probA ? 1 : 0;
    const extraB = Math.random() < (1 - probA) && extraA === 0 ? 1 : 0;
    goalsA += extraA;
    goalsB += extraB;

    // Force winner in extra time goals if AET didn't end in a draw
    if (forcedWinnerId && goalsA !== goalsB) {
      if (forcedWinnerId === teamA.id && goalsA < goalsB) {
        const temp = goalsA; goalsA = goalsB; goalsB = temp;
      } else if (forcedWinnerId === teamB.id && goalsB < goalsA) {
        const temp = goalsA; goalsA = goalsB; goalsB = temp;
      }
    }

    if (goalsA === goalsB) {
      isPenalties = true;
      let shootout = simulatePenaltyShootout(teamAWithStartingSquad, teamBWithStartingSquad, probA, 121);
      if (forcedWinnerId) {
        while (shootout.winner.id !== forcedWinnerId) {
          shootout = simulatePenaltyShootout(teamAWithStartingSquad, teamBWithStartingSquad, probA, 121);
        }
      }
      pensScore = shootout.pensScore;
      winner = shootout.winner;
      loser = shootout.loser;
      shootoutEvents = shootout.kicks;
      shootoutLastMinute = shootout.lastMinute;
    } else {
      winner = goalsA > goalsB ? teamA : teamB;
      loser = goalsA > goalsB ? teamB : teamA;
    }
  } else {
    winner = goalsA > goalsB ? teamA : goalsB > goalsA ? teamB : null;
    loser = goalsA > goalsB ? teamB : goalsB > goalsA ? teamA : null;
  }

  // 2. Event generation (Timeline)
  const events = [];
  const scorersList = [];
  const cardsList = [];

  const addGoalsToTimeline = (count, team, opponentTeam, minuteRangeStart, minuteRangeEnd) => {
    for (let i = 0; i < count; i++) {
      const minute = minuteRangeStart + Math.floor(Math.random() * (minuteRangeEnd - minuteRangeStart));
      const scorer = selectScorer(team.squad);
      const hasAssist = Math.random() < 0.7;
      const assister = hasAssist ? selectAssister(team.squad, scorer.name) : null;

      scorersList.push({
        name: scorer.name,
        teamId: team.id,
        minute,
        assist: assister ? assister.name : null
      });

      events.push({
        type: 'goal',
        minute,
        teamId: team.id,
        teamName: team.name,
        player: scorer.name,
        assist: assister ? assister.name : null,
        detail: `Goal! ${team.name} scores.`
      });
    }
  };

  const normalGoalsA = isAET ? goalsA - (goalsA > goalsB ? 1 : 0) : goalsA;
  const normalGoalsB = isAET ? goalsB - (goalsB > goalsA ? 1 : 0) : goalsB;

  addGoalsToTimeline(normalGoalsA, teamAWithStartingSquad, teamBWithStartingSquad, 1, 90);
  addGoalsToTimeline(normalGoalsB, teamBWithStartingSquad, teamAWithStartingSquad, 1, 90);

  if (isAET) {
    const etGoalsA = goalsA - normalGoalsA;
    const etGoalsB = goalsB - normalGoalsB;
    addGoalsToTimeline(etGoalsA, teamAWithStartingSquad, teamBWithStartingSquad, 91, 120);
    addGoalsToTimeline(etGoalsB, teamBWithStartingSquad, teamAWithStartingSquad, 91, 120);
  }

  // Generate cards
  const generateCardsForTeam = (team) => {
    if (Math.random() < 0.5) {
      const yellowCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < yellowCount; i++) {
        const player = selectPlayerForBooking(team.squad);
        const minute = 1 + Math.floor(Math.random() * 89);
        cardsList.push({ name: player.name, teamId: team.id, type: 'yellow', minute });
        events.push({
          type: 'card',
          cardType: 'yellow',
          minute,
          teamId: team.id,
          teamName: team.name,
          player: player.name,
          detail: `Yellow Card: ${player.name} (${team.name})`
        });
      }
    }
    if (Math.random() < 0.05) {
      const player = selectPlayerForBooking(team.squad);
      const minute = 1 + Math.floor(Math.random() * 89);
      cardsList.push({ name: player.name, teamId: team.id, type: 'red', minute });
      events.push({
        type: 'card',
        cardType: 'red',
        minute,
        teamId: team.id,
        teamName: team.name,
        player: player.name,
        detail: `Red Card: ${player.name} (${team.name})`
      });
    }
  };

  generateCardsForTeam(teamAWithStartingSquad);
  generateCardsForTeam(teamBWithStartingSquad);

  events.push({ type: 'kickoff', minute: 0, detail: 'Kickoff!' });
  events.push({ type: 'halftime', minute: 45, detail: 'Half Time' });
  events.push({ type: 'fulltime', minute: 90, detail: isAET ? 'End of Normal Time. Heading to Extra Time.' : 'Full Time' });

  if (isAET) {
    events.push({ type: 'fulltime', minute: 120, detail: isPenalties ? 'End of Extra Time. Heading to Penalties!' : 'End of Extra Time' });
  }

  if (isPenalties && shootoutEvents) {
    events.push(...shootoutEvents);
    events.push({
      type: 'penalties',
      minute: shootoutLastMinute + 1,
      detail: `Penalty Shootout Ends: ${teamA.name} ${pensScore[0]} - ${pensScore[1]} ${teamB.name}`
    });
  }

  events.sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    const typeOrder = { kickoff: 0, card: 1, goal: 2, halftime: 3, fulltime: 4, penalties: 5 };
    return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
  });

  return {
    homeScore: goalsA,
    awayScore: goalsB,
    status,
    scorers: scorersList,
    cards: cardsList,
    events,
    isAET,
    isPenalties,
    pensScore,
    winner,
    loser
  };
};

// Generates random scorers and assists matching user-entered manual scores
export const generateScorersForManualScore = (teamA, teamB, goalsA, goalsB) => {
  const teamAWithStartingSquad = { ...teamA, squad: getStartingLineupSquad(teamA) };
  const teamBWithStartingSquad = { ...teamB, squad: getStartingLineupSquad(teamB) };

  const scorersList = [];
  const events = [];
  const cardsList = [];

  const addGoalsToTimeline = (count, team, opponentTeam) => {
    for (let i = 0; i < count; i++) {
      const minute = 1 + Math.floor(Math.random() * 89);
      const scorer = selectScorer(team.squad);
      const hasAssist = Math.random() < 0.7;
      const assister = hasAssist ? selectAssister(team.squad, scorer.name) : null;

      scorersList.push({
        name: scorer.name,
        teamId: team.id,
        minute,
        assist: assister ? assister.name : null
      });

      events.push({
        type: 'goal',
        minute,
        teamId: team.id,
        teamName: team.name,
        player: scorer.name,
        assist: assister ? assister.name : null,
        detail: `Goal! ${team.name} scores.`
      });
    }
  };

  addGoalsToTimeline(goalsA, teamAWithStartingSquad, teamBWithStartingSquad);
  addGoalsToTimeline(goalsB, teamBWithStartingSquad, teamAWithStartingSquad);

  const generateCardsForTeam = (team) => {
    if (Math.random() < 0.4) {
      const yellowCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < yellowCount; i++) {
        const player = selectPlayerForBooking(team.squad);
        const minute = 1 + Math.floor(Math.random() * 89);
        cardsList.push({ name: player.name, teamId: team.id, type: 'yellow', minute });
        events.push({
          type: 'card',
          cardType: 'yellow',
          minute,
          teamId: team.id,
          teamName: team.name,
          player: player.name,
          detail: `Yellow Card: ${player.name} (${team.name})`
        });
      }
    }
  };

  generateCardsForTeam(teamAWithStartingSquad);
  generateCardsForTeam(teamBWithStartingSquad);

  events.push({ type: 'kickoff', minute: 0, detail: 'Kickoff!' });
  events.push({ type: 'halftime', minute: 45, detail: 'Half Time' });
  events.push({ type: 'fulltime', minute: 90, detail: 'Full Time' });

  events.sort((a, b) => a.minute - b.minute);

  return { scorers: scorersList, cards: cardsList, events };
};
