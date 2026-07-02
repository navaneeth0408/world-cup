import React, { useState, useMemo } from 'react';
import { useTournament } from '../hooks/useTournament';
import { usePrediction } from '../hooks/usePrediction';
import Navbar from '../components/ui/Navbar';
import PredictionCard from '../components/predictions/PredictionCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getRoundOf32Pairings } from '../utils/knockoutAllocation';
import { LayoutGrid, Filter, Trophy, User, Cpu, Award } from 'lucide-react';
import GroupTable from '../components/simulator/GroupTable';
import KnockoutBracket from '../components/simulator/KnockoutBracket';
import Flag from '../components/ui/Flag';
import { getPrediction } from '../utils/getPrediction';
import predictionPercentagesData from '../data/prediction_percentages.json';
import predictionPercentagesKnockoutData from '../data/prediction_percentages_knockout.json';

const Predictions = () => {
  const { teams, matches, groupStandings, loading } = useTournament();
  const [activeGroup, setActiveGroup] = useState('A');
  const [showStandings, setShowStandings] = useState(false);
  const [knockoutViewMode, setKnockoutViewMode] = useState('actual');

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groupMatches = matches.filter(m => m.group === activeGroup);

  // Compute predicted group standings (AI)
  const predictedGroupStandings = useMemo(() => {
    return computeStandings(teams, matches, {}, false, true);
  }, [teams, matches]);

  // Compute predicted knockout stages (AI)
  const predictedKnockouts = useMemo(() => {
    return computeKnockouts(teams, matches, predictedGroupStandings);
  }, [teams, matches, predictedGroupStandings]);

  // Compute actual knockout stages
  const actualKnockouts = useMemo(() => {
    return computeActualKnockouts(teams, matches);
  }, [teams, matches]);

  const activeKnockouts = knockoutViewMode === 'actual' ? actualKnockouts : predictedKnockouts;

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">AI PREDICTIONS</h1>
            <p className="text-gray-500 font-medium">Advanced match analysis using FIFA rankings and tournament data.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
            <LayoutGrid className="w-4 h-4" />
            Group Stage Coverage
          </div>
        </div>



        {/* Group Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all min-w-[80px] ${activeGroup === group
                ? 'bg-green-500 text-gray-950'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
            >
              GROUP {group}
            </button>
          ))}
        </div>

        {/* Action Header above match list */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wide">
            {showStandings ? `Group ${activeGroup} Predicted Standings` : `Group ${activeGroup} Predicted Matches`}
          </h2>
          <button
            onClick={() => setShowStandings(!showStandings)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${showStandings
              ? 'bg-green-500 text-gray-950 border-green-500 hover:bg-green-600'
              : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800 hover:border-gray-700'
              }`}
          >
            {showStandings ? 'Show Predicted Matches' : 'View Group Standings'}
          </button>
        </div>

        {showStandings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Actual group standings */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest px-2 border-l-2 border-blue-500">
                Actual Group Standings
              </h3>
              <GroupTable teams={groupStandings[activeGroup] || []} />
            </div>

            {/* AI predicted standings */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-green-400 uppercase tracking-widest px-2 border-l-2 border-green-500">
                AI Predicted Standings
              </h3>
              <GroupTable teams={predictedGroupStandings[activeGroup] || []} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupMatches.map(match => (
              <PredictionGridItem
                key={match.id}
                match={match}
                teams={teams}
              />
            ))}
          </div>
        )}

        {/* AI/User Knockout Stage Predictions */}
        {activeKnockouts && (
          <>
            <hr className="border-gray-800 my-16" />

            <section className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 flex items-center gap-3">
                    <Trophy className={`w-8 h-8 ${knockoutViewMode === 'actual' ? 'text-blue-500' : 'text-green-500'}`} />
                    {knockoutViewMode === 'actual' ? 'Actual Knockout Bracket' : 'AI Knockout Predictions'}
                  </h2>
                  <p className="text-gray-500 font-medium text-xs md:text-sm">
                    {knockoutViewMode === 'actual'
                      ? 'Real-world tournament progress. Completed matches show actual results; upcoming matches are TBD.'
                      : 'Bracket generated from group stage standings. All knockout matches are resolved using the 100 simulations.'}
                  </p>
                </div>

                {/* Bracket view toggle */}
                <div className="flex bg-gray-900 border border-gray-800 p-1.5 rounded-xl self-start md:self-auto shrink-0">
                  <button
                    onClick={() => setKnockoutViewMode('actual')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${knockoutViewMode === 'actual'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Actual Bracket
                  </button>
                  <button
                    onClick={() => setKnockoutViewMode('ai')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${knockoutViewMode === 'ai'
                      ? 'bg-green-500 text-gray-950 shadow-lg'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    AI Predictions
                  </button>
                </div>
              </div>

              {/* Winner Banner */}
              {knockoutViewMode === 'ai' && activeKnockouts.winner && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 p-8 rounded-3xl text-center relative overflow-hidden max-w-2xl mx-auto shadow-2xl animate-in">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                      <Flag code={activeKnockouts.winner.countryCode} style={{ fontSize: '6rem' }} />
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-1">
                      {activeKnockouts.winner.name}
                    </h3>
                    <p className="text-green-400 font-black text-xs uppercase tracking-widest">
                      AI PREDICTED CHAMPION
                    </p>
                  </div>
                </div>
              )}
              {knockoutViewMode === 'actual' && activeKnockouts.winner && (
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-8 rounded-3xl text-center relative overflow-hidden max-w-2xl mx-auto shadow-2xl animate-in">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                      <Flag code={activeKnockouts.winner.countryCode} style={{ fontSize: '6rem' }} />
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-1">
                      {activeKnockouts.winner.name}
                    </h3>
                    <p className="text-blue-400 font-black text-xs uppercase tracking-widest">
                      ACTUAL CHAMPION
                    </p>
                  </div>
                </div>
              )}

              {/* Bracket Display */}
              <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800/80 shadow-inner overflow-hidden">
                <KnockoutBracket
                  rounds={{
                    roundOf32: activeKnockouts.roundOf32,
                    roundOf16: activeKnockouts.roundOf16,
                    quarterFinals: activeKnockouts.quarterFinals,
                    semiFinals: activeKnockouts.semiFinals,
                    final: [activeKnockouts.final],
                    thirdPlace: activeKnockouts.thirdPlace
                  }}
                />
              </div>
            </section>
          </>
        )}
      </main>

    </div>
  );
};

const PredictionGridItem = ({ match, teams }) => {
  const prediction = usePrediction(match, teams);
  return <PredictionCard match={match} teams={teams} prediction={prediction} />;
};



const computeStandings = (teams, matches, userPredictions, isUser = false, forceAIPrediction = false) => {
  if (!teams.length || !matches.length) return {};

  const standings = {};

  // Initialize standings for each team
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

  // Update standings from all group stage matches (real and predicted)
  matches.filter(m => m.match_id <= 72).forEach(match => {
    const group = standings[match.group];
    if (!group) return;

    const homeTeam = group.find(t => t.id === match.homeTeam);
    const awayTeam = group.find(t => t.id === match.awayTeam);

    if (!homeTeam || !awayTeam) return;

    let homeScore = 0;
    let awayScore = 0;

    if (!forceAIPrediction && match.status === 'completed' && match.homeScore !== null && match.awayScore !== null) {
      homeScore = match.homeScore;
      awayScore = match.awayScore;
    } else {
      // Fallback to AI prediction
      const prediction = getPrediction(homeTeam, awayTeam);
      if (prediction && prediction.predictedScore) {
        const parts = prediction.predictedScore.split('-');
        homeScore = parseInt(parts[0].trim(), 10);
        awayScore = parseInt(parts[1].trim(), 10);
      }
    }

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

  // Sort standings: Pts > GD > GF
  Object.keys(standings).forEach(groupKey => {
    standings[groupKey].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  });

  return standings;
};

const computeKnockouts = (teams, matches, groupStandings) => {
  if (!teams.length || !matches.length || Object.keys(groupStandings).length === 0) return null;

  const qualifiers = [];
  const thirdPlaceTeams = [];
  const sortedGroupKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  sortedGroupKeys.forEach(g => {
    const standings = groupStandings[g];
    if (standings && standings.length >= 3) {
      qualifiers.push(standings[0], standings[1]); // Top 2
      thirdPlaceTeams.push(standings[2]);
    }
  });

  // Best 8 third-place teams (for 48-team format)
  const bestThird = [...thirdPlaceTeams]
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8);

  const fallbackTeam = (name) => ({ id: 'tbd', name: name || 'TBD', code: 'TBD', countryCode: '' });
  const getTeam = (team, fallbackName) => team || fallbackTeam(fallbackName);

  const w = (group) => groupStandings[group]?.[0];
  const ru = (group) => groupStandings[group]?.[1];

  const pairings = getRoundOf32Pairings(w, ru, bestThird, getTeam, false);

  const predictKnockoutMatch = (teamA, teamB) => {
    if (!teamA || !teamB || teamA.id === 'tbd' || teamB.id === 'tbd') {
      return { t1: teamA, t2: teamB, score: [0, 0], winner: teamA || teamB, loser: null };
    }
    const pred = getPrediction(teamA, teamB, true);
    let goalsA = 0;
    let goalsB = 0;

    if (pred && pred.predictedScore) {
      const parts = pred.predictedScore.split('-');
      goalsA = parseInt(parts[0].trim(), 10);
      goalsB = parseInt(parts[1].trim(), 10);
    }

    let finalGoalsA = goalsA;
    let finalGoalsB = goalsB;
    let winner;

    // Check if we have simulation data in prediction_percentages_knockout.json
    const name1 = teamA.name;
    const name2 = teamB.name;
    const sorted = [name1, name2].sort();
    const team1 = sorted[0];
    const team2 = sorted[1];
    const key = `${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}`;
    const simPred = predictionPercentagesKnockoutData.predictions?.[key];

    if (simPred) {
      let winsA = 0;
      let winsB = 0;
      if (simPred.homeTeam === name1) {
        winsA = simPred.homeWins;
        winsB = simPred.awayWins;
      } else {
        winsA = simPred.awayWins;
        winsB = simPred.homeWins;
      }

      // If one team has a clear majority in head-to-head, they win.
      // But if it's close (e.g. difference is <= 3 wins) or never played,
      // we use the team's overall champion rate from the simulation to resolve.
      const totalWins = winsA + winsB;
      const winDiff = Math.abs(winsA - winsB);

      const championRateA = predictionPercentagesKnockoutData.progression?.[name1]?.champion || 0;
      const championRateB = predictionPercentagesKnockoutData.progression?.[name2]?.champion || 0;

      let chooseA = false;
      if (totalWins > 0 && winDiff > 3) {
        chooseA = winsA > winsB;
      } else {
        if (championRateA !== championRateB) {
          chooseA = championRateA > championRateB;
        } else {
          // Fall back to next round progression
          const nextRoundA = predictionPercentagesKnockoutData.progression?.[name1]?.roundOf16 || 0;
          const nextRoundB = predictionPercentagesKnockoutData.progression?.[name2]?.roundOf16 || 0;
          if (nextRoundA !== nextRoundB) {
            chooseA = nextRoundA > nextRoundB;
          } else {
            chooseA = winsA >= winsB;
          }
        }
      }

      if (chooseA) {
        winner = teamA;
        if (finalGoalsA <= finalGoalsB) {
          finalGoalsA = finalGoalsB + 1;
        }
      } else {
        winner = teamB;
        if (finalGoalsB <= finalGoalsA) {
          finalGoalsB = finalGoalsA + 1;
        }
      }
    } else {
      if (goalsA > goalsB) {
        winner = teamA;
      } else if (goalsB > goalsA) {
        winner = teamB;
      } else {
        // Tie-breaker: compare probabilities
        if (pred.homeProbability > pred.awayProbability) {
          winner = teamA;
          finalGoalsA += 1;
        } else if (pred.awayProbability > pred.homeProbability) {
          winner = teamB;
          finalGoalsB += 1;
        } else {
          // FIFA ranking fallback (lower number is better rank)
          if ((teamA.fifaRanking || 50) < (teamB.fifaRanking || 50)) {
            winner = teamA;
            finalGoalsA += 1;
          } else {
            winner = teamB;
            finalGoalsB += 1;
          }
        }
      }
    }

    const loser = (winner && teamA && winner.id === teamA.id) ? teamB : teamA;
    return { t1: teamA, t2: teamB, score: [finalGoalsA, finalGoalsB], winner, loser };
  };

  const runPredictiveKnockoutRound = (roundMatches) => {
    const nextRound = [];
    const outMatches = [];
    for (let i = 0; i < roundMatches.length; i += 2) {
      const m1 = roundMatches[i];
      const m2 = roundMatches[i + 1];

      const t1 = m1.winner || m1.t1;
      const t2 = m2.winner || m2.t2;

      const res = predictKnockoutMatch(t1, t2);
      nextRound.push(res.winner);
      outMatches.push(res);
    }
    return { nextRound, matches: outMatches };
  };

  const r32Matches = pairings.map(p => predictKnockoutMatch(p.t1, p.t2));
  const r16 = runPredictiveKnockoutRound(r32Matches);
  const qf = runPredictiveKnockoutRound(r16.matches);
  const sf = runPredictiveKnockoutRound(qf.matches);
  const finalMatch = predictKnockoutMatch(sf.nextRound[0], sf.nextRound[1]);
  const thirdPlaceMatch = predictKnockoutMatch(sf.matches[0].loser, sf.matches[1].loser);

  return {
    roundOf32: r32Matches,
    roundOf16: r16.matches,
    quarterFinals: qf.matches,
    semiFinals: sf.matches,
    final: finalMatch,
    thirdPlace: thirdPlaceMatch,
    winner: finalMatch.winner
  };
};

const computeActualKnockouts = (teams, matches) => {
  const resolveTeam = (teamId, r32, r16, qf, sf) => {
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

  const getTeam = (teamId) => teams.find(t => t.id === teamId) || null;

  const mapMatch = (m, r32 = [], r16 = [], qf = [], sf = []) => {
    if (!m) return { t1: null, t2: null, score: [null, null], winner: null, loser: null };
    const t1 = resolveTeam(m.homeTeam, r32, r16, qf, sf);
    const t2 = resolveTeam(m.awayTeam, r32, r16, qf, sf);
    const isCompleted = m.status === 'completed' && m.homeScore !== null && m.awayScore !== null;
    const score = isCompleted ? [m.homeScore, m.awayScore] : [null, null];
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

  const getMatchByNum = (num, r32 = [], r16 = [], qf = [], sf = []) => {
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

export default Predictions;