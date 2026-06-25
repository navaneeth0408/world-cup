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
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { getPrediction } from '../utils/getPrediction';
import { useTournamentStore } from '../store/tournamentStore';

const Predictions = () => {
  const { teams, matches, loading } = useTournament();
  const [activeGroup, setActiveGroup] = useState('A');
  const [showStandings, setShowStandings] = useState(false);
  const [activePredictMatch, setActivePredictMatch] = useState(null);
  const [knockoutViewMode, setKnockoutViewMode] = useState('user');

  const { userPredictions, setUserPrediction } = useTournamentStore();

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groupMatches = matches.filter(m => m.group === activeGroup);

  // Compute live prediction stats comparing AI vs User
  const predictionStats = useMemo(() => {
    // Find all completed matches
    const completedMatches = matches.filter(
      m => m.status === 'completed' && m.homeScore !== null && m.awayScore !== null
    );

    let userCorrectOutcomes = 0;
    let userExactScores = 0;
    let userTotalPredictions = 0;

    let aiCorrectOutcomes = 0;
    let aiExactScores = 0;

    completedMatches.forEach(match => {
      const homeTeam = teams.find(t => t.id === match.homeTeam);
      const awayTeam = teams.find(t => t.id === match.awayTeam);
      if (!homeTeam || !awayTeam) return;

      // Actual outcome
      const actualDiff = match.homeScore - match.awayScore;
      const actualOutcome = actualDiff > 0 ? 'home' : (actualDiff < 0 ? 'away' : 'draw');

      // AI Prediction
      const aiPred = getPrediction(homeTeam, awayTeam);
      if (aiPred && aiPred.predictedScore) {
        const [aiHome, aiAway] = aiPred.predictedScore.split('-').map(x => parseInt(x.trim(), 10));
        const aiDiff = aiHome - aiAway;
        const aiOutcome = aiDiff > 0 ? 'home' : (aiDiff < 0 ? 'away' : 'draw');

        if (aiOutcome === actualOutcome) aiCorrectOutcomes++;
        if (aiHome === match.homeScore && aiAway === match.awayScore) aiExactScores++;
      }

      // User Prediction
      const userPred = userPredictions[match.id];
      if (userPred) {
        userTotalPredictions++;
        const userDiff = userPred.homeScore - userPred.awayScore;
        const userOutcome = userDiff > 0 ? 'home' : (userDiff < 0 ? 'away' : 'draw');

        if (userOutcome === actualOutcome) userCorrectOutcomes++;
        if (userPred.homeScore === match.homeScore && userPred.awayScore === match.awayScore) userExactScores++;
      }
    });

    // Scoring system: 1 point for outcome, 3 points for exact score
    const userPoints = (userCorrectOutcomes - userExactScores) * 1 + userExactScores * 3;
    const aiPoints = (aiCorrectOutcomes - aiExactScores) * 1 + aiExactScores * 3;

    return {
      completedCount: completedMatches.length,
      userTotalPredictions,
      userCorrectOutcomes,
      userExactScores,
      userPoints,
      aiCorrectOutcomes,
      aiExactScores,
      aiPoints
    };
  }, [matches, teams, userPredictions]);

  // Compute predicted group standings (AI)
  const predictedGroupStandings = useMemo(() => {
    return computeStandings(teams, matches, {}, false);
  }, [teams, matches]);

  // Compute predicted group standings (User)
  const userPredictedGroupStandings = useMemo(() => {
    return computeStandings(teams, matches, userPredictions, true);
  }, [teams, matches, userPredictions]);

  // Compute predicted knockout stages (AI)
  const predictedKnockouts = useMemo(() => {
    return computeKnockouts(teams, matches, predictedGroupStandings);
  }, [teams, matches, predictedGroupStandings]);

  // Compute predicted knockout stages (User)
  const userPredictedKnockouts = useMemo(() => {
    return computeKnockouts(teams, matches, userPredictedGroupStandings);
  }, [teams, matches, userPredictedGroupStandings]);

  const activeKnockouts = knockoutViewMode === 'user' ? userPredictedKnockouts : predictedKnockouts;

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

        {/* Prediction Leaderboard / Dashboard */}
        <div className="mb-10 bg-gray-900/40 border border-gray-800 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">AI vs User Prediction Challenge</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* User Stats Card */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-black block">Your Score</span>
                <span className="text-2xl font-black text-white">{predictionStats.userPoints} pts</span>
                <span className="text-[10px] text-gray-400 block mt-0.5 font-bold">
                  {predictionStats.userExactScores} exact · {predictionStats.userCorrectOutcomes} correct ({predictionStats.userTotalPredictions} predicted)
                </span>
              </div>
            </div>

            {/* Verdict Center Card */}
            <div className="flex flex-col items-center justify-center text-center p-4">
              {predictionStats.completedCount === 0 ? (
                <>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Challenge Status</span>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">No completed matches yet. Predictions will update live as soon as matches finish!</p>
                </>
              ) : (
                <>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Current Leader</span>
                  <p className="text-xl font-black uppercase tracking-tight italic text-yellow-500">
                    {predictionStats.userPoints > predictionStats.aiPoints ? 'You are leading!' : 
                     predictionStats.aiPoints > predictionStats.userPoints ? 'AI is in the lead!' : 
                     "It's a dead heat!"}
                  </p>
                  <span className="text-xs text-gray-400 font-bold block mt-1">
                    {predictionStats.completedCount} match{predictionStats.completedCount > 1 ? 'es' : ''} completed
                  </span>
                </>
              )}
            </div>

            {/* AI Stats Card */}
            <div className="bg-green-500/5 border border-green-500/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-black block">AI Score</span>
                <span className="text-2xl font-black text-white">{predictionStats.aiPoints} pts</span>
                <span className="text-[10px] text-gray-400 block mt-0.5 font-bold">
                  {predictionStats.aiExactScores} exact · {predictionStats.aiCorrectOutcomes} correct ({predictionStats.completedCount} predicted)
                </span>
              </div>
            </div>
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
              showStandings 
                ? 'bg-green-500 text-gray-950 border-green-500 hover:bg-green-600' 
                : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800 hover:border-gray-700'
            }`}
          >
            {showStandings ? 'Show Predicted Matches' : 'View Group Standings'}
          </button>
        </div>

        {showStandings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI predicted standings */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-green-400 uppercase tracking-widest px-2 border-l-2 border-green-500">
                AI Predicted Standings
              </h3>
              <GroupTable teams={predictedGroupStandings[activeGroup] || []} />
            </div>
            
            {/* User predicted standings */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest px-2 border-l-2 border-blue-500">
                Your Predicted Standings
              </h3>
              <GroupTable teams={userPredictedGroupStandings[activeGroup] || []} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupMatches.map(match => (
              <PredictionGridItem
                key={match.id}
                match={match}
                teams={teams}
                onPredict={setActivePredictMatch}
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
                    <Trophy className="w-8 h-8 text-green-500" />
                    Knockout Stage Predictions
                  </h2>
                  <p className="text-gray-500 font-medium text-xs md:text-sm">
                    Bracket generated from group stage standings. All knockout matches are resolved deterministically using team strengths and FIFA rankings.
                  </p>
                </div>

                {/* Bracket view toggle */}
                <div className="flex bg-gray-900 border border-gray-800 p-1.5 rounded-xl self-start md:self-auto">
                  <button
                    onClick={() => setKnockoutViewMode('user')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      knockoutViewMode === 'user' 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Your Prediction
                  </button>
                  <button
                    onClick={() => setKnockoutViewMode('ai')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                      knockoutViewMode === 'ai' 
                        ? 'bg-green-500 text-gray-950 shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AI Prediction
                  </button>
                </div>
              </div>

              {/* Winner Banner */}
              {activeKnockouts.winner && (
                <div className={`bg-gradient-to-r ${knockoutViewMode === 'user' ? 'from-blue-500/10 to-indigo-500/10 border-blue-500/20' : 'from-green-500/10 to-blue-500/10 border-green-500/20'} border p-8 rounded-3xl text-center relative overflow-hidden max-w-2xl mx-auto shadow-2xl`}>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                      <Flag code={activeKnockouts.winner.countryCode} style={{ fontSize: '6rem' }} />
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-1">
                      {activeKnockouts.winner.name}
                    </h3>
                    <p className={`${knockoutViewMode === 'user' ? 'text-blue-400' : 'text-green-400'} font-black text-xs uppercase tracking-widest`}>
                      {knockoutViewMode === 'user' ? 'YOUR PREDICTED CHAMPION' : 'AI PREDICTED CHAMPION'}
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

      {/* Predict Score Modal */}
      <Modal
        isOpen={!!activePredictMatch}
        onClose={() => setActivePredictMatch(null)}
        title="Enter Your Prediction"
      >
        {activePredictMatch && (
          <PredictionInputForm
            match={activePredictMatch}
            teams={teams}
            onSave={(homeScore, awayScore) => {
              setUserPrediction(activePredictMatch.id, homeScore, awayScore);
              setActivePredictMatch(null);
            }}
            onCancel={() => setActivePredictMatch(null)}
            initialHome={userPredictions[activePredictMatch.id]?.homeScore}
            initialAway={userPredictions[activePredictMatch.id]?.awayScore}
          />
        )}
      </Modal>
    </div>
  );
};

const PredictionGridItem = ({ match, teams, onPredict }) => {
  const prediction = usePrediction(match, teams);
  return <PredictionCard match={match} teams={teams} prediction={prediction} onPredict={onPredict} />;
};

const PredictionInputForm = ({ match, teams, onSave, onCancel, initialHome, initialAway }) => {
  const homeTeam = teams.find(t => t.id === match.homeTeam);
  const awayTeam = teams.find(t => t.id === match.awayTeam);
  const [homeScore, setHomeScore] = useState(initialHome !== undefined ? initialHome : 0);
  const [awayScore, setAwayScore] = useState(initialAway !== undefined ? initialAway : 0);

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex items-center justify-between w-full max-w-md gap-4 py-4">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Flag code={homeTeam?.countryCode} style={{ fontSize: '3.5rem' }} />
          <span className="font-black text-white text-sm text-center leading-tight">{homeTeam?.name}</span>
          <input
            type="number"
            min="0"
            max="20"
            value={homeScore}
            onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-16 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center font-black text-xl text-white focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* VS Spacer */}
        <div className="text-gray-600 font-black text-2xl italic">VS</div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Flag code={awayTeam?.countryCode} style={{ fontSize: '3.5rem' }} />
          <span className="font-black text-white text-sm text-center leading-tight">{awayTeam?.name}</span>
          <input
            type="number"
            min="0"
            max="20"
            value={awayScore}
            onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-16 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center font-black text-xl text-white focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end w-full max-w-md mt-4 border-t border-gray-800 pt-4">
        <Button variant="secondary" onClick={onCancel} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onSave(homeScore, awayScore)} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
          Save Prediction
        </Button>
      </div>
    </div>
  );
};



const computeStandings = (teams, matches, userPredictions, isUser = false) => {
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
  matches.filter(m => m.group).forEach(match => {
    const group = standings[match.group];
    if (!group) return;

    const homeTeam = group.find(t => t.id === match.homeTeam);
    const awayTeam = group.find(t => t.id === match.awayTeam);

    if (!homeTeam || !awayTeam) return;

    let homeScore = 0;
    let awayScore = 0;

    if (match.status === 'completed' && match.homeScore !== null && match.awayScore !== null) {
      homeScore = match.homeScore;
      awayScore = match.awayScore;
    } else {
      // For upcoming matches
      const userPred = userPredictions[match.id];
      if (isUser && userPred) {
        homeScore = userPred.homeScore;
        awayScore = userPred.awayScore;
      } else {
        // Fallback to AI prediction
        const prediction = getPrediction(homeTeam, awayTeam);
        if (prediction && prediction.predictedScore) {
          const parts = prediction.predictedScore.split('-');
          homeScore = parseInt(parts[0].trim(), 10);
          awayScore = parseInt(parts[1].trim(), 10);
        }
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
    const pred = getPrediction(teamA, teamB);
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

export default Predictions;