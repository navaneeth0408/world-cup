import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { usePrediction } from '../hooks/usePrediction';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import ProbabilityBar from '../components/match/ProbabilityBar';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

import { ArrowLeft, MapPin, Calendar, Activity, Sparkles, Clock, BarChart3 } from 'lucide-react';
import { venues } from '../data/worldcup2026';

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teams, matches, loading } = useTournament();
  const match = useMemo(() => matches.find(m => m.id === id), [matches, id]);
  const homeTeam = useMemo(() => teams.find(t => t.id === match?.homeTeam), [teams, match]);
  const awayTeam = useMemo(() => teams.find(t => t.id === match?.awayTeam), [teams, match]);
  const prediction = usePrediction(match, teams);

  const calculateStatWidth = (homeValue, awayValue, better = 'higher') => {
    if (!homeValue && !awayValue) return { home: '50%', away: '50%' };
    const h = Number(homeValue) || 0;
    const a = Number(awayValue) || 0;

    if (better === 'lower') {
      // For things like Ranking, lower is better. 
      // We use inverse values to show a larger bar for better (lower) rank.
      const invH = 1 / (h || 1);
      const invA = 1 / (a || 1);
      const total = invH + invA;
      return {
        home: `${(invH / total) * 100}%`,
        away: `${(invA / total) * 100}%`
      };
    }

    const total = h + a || 1;
    return {
      home: `${(h / total) * 100}%`,
      away: `${(a / total) * 100}%`
    };
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!match || !homeTeam || !awayTeam) return <div className="text-center py-20 text-white bg-gray-950 min-h-screen">Match not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 mt-8 animate-in">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-xs py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Scoreboard / Hero */}
        <section className="mb-12">
          <Card className="p-6 md:p-12 relative overflow-hidden border-blue-500/20 backdrop-blur-xl bg-gray-900/50">
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 md:top-0 md:right-0 md:left-auto md:translate-x-0 md:p-4 z-10">
              <Badge variant={match.status === 'completed' ? 'green' : 'gray'}>
                {match.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-3 items-start gap-2 md:gap-12 w-full pt-4 md:pt-0">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2.5 md:gap-4 min-w-0 text-center">
                <Flag code={homeTeam.countryCode} className="text-4xl sm:text-7xl md:text-[8rem] shadow-xl rounded-xl md:rounded-2xl shrink-0" />
                <span className="text-xs sm:text-2xl font-black text-white uppercase tracking-tight truncate w-full" title={homeTeam.name}>
                  {homeTeam.name}
                </span>
                <Badge variant="blue" className="text-[8px] sm:text-xs">RANK #{homeTeam.fifaRanking}</Badge>
                {match.scorers && match.scorers.some(s => s.teamId === homeTeam.id) && (
                  <div className="mt-2 flex flex-col items-center gap-0.5 w-full">
                    {match.scorers.filter(s => s.teamId === homeTeam.id).map((s, idx) => (
                      <span key={idx} className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase text-center leading-tight break-words max-w-full">
                        {s.name}
                        {s.ownGoal && <span className="text-red-500 font-black lowercase ml-0.5">(og)</span>}
                        {s.penalty && <span className="text-yellow-500 font-black lowercase ml-0.5">(pen)</span>}
                        {s.minute ? ` (${s.minute}')` : ''}
                      </span>
                    ))}
                  </div>
                )}
                {match.cards && match.cards.some(c => c.teamId === homeTeam.id) && (
                  <div className="mt-1 flex flex-col items-center gap-0.5 w-full">
                    {match.cards.filter(c => c.teamId === homeTeam.id).map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1 justify-center max-w-full">
                        <div className={`w-1.5 h-2 rounded-[1px] ${c.type === 'red' ? 'bg-red-600' : 'bg-yellow-400'} shrink-0`} />
                        <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Score / VS display in Center */}
              <div className="flex flex-col items-center justify-center pt-3 sm:pt-6 md:pt-10 shrink-0">
                {match.status === 'completed' ? (
                  <div className="text-2xl sm:text-5xl md:text-7xl font-black text-white flex items-center gap-2 sm:gap-6">
                    <span>{match.homeScore}</span>
                    <span className="text-gray-700">-</span>
                    <span>{match.awayScore}</span>
                  </div>
                ) : (
                  <div className="text-xl sm:text-4xl md:text-5xl font-black text-white/10 italic">VS</div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2.5 md:gap-4 min-w-0 text-center">
                <Flag code={awayTeam.countryCode} className="text-4xl sm:text-7xl md:text-[8rem] shadow-xl rounded-xl md:rounded-2xl shrink-0" />
                <span className="text-xs sm:text-2xl font-black text-white uppercase tracking-tight truncate w-full" title={awayTeam.name}>
                  {awayTeam.name}
                </span>
                <Badge variant="blue" className="text-[8px] sm:text-xs">RANK #{awayTeam.fifaRanking}</Badge>
                {match.scorers && match.scorers.some(s => s.teamId === awayTeam.id) && (
                  <div className="mt-2 flex flex-col items-center gap-0.5 w-full">
                    {match.scorers.filter(s => s.teamId === awayTeam.id).map((s, idx) => (
                      <span key={idx} className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase text-center leading-tight break-words max-w-full">
                        {s.name}
                        {s.ownGoal && <span className="text-red-500 font-black lowercase ml-0.5">(og)</span>}
                        {s.penalty && <span className="text-yellow-500 font-black lowercase ml-0.5">(pen)</span>}
                        {s.minute ? ` (${s.minute}')` : ''}
                      </span>
                    ))}
                  </div>
                )}
                {match.cards && match.cards.some(c => c.teamId === awayTeam.id) && (
                  <div className="mt-1 flex flex-col items-center gap-0.5 w-full">
                    {match.cards.filter(c => c.teamId === awayTeam.id).map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1 justify-center max-w-full">
                        <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase truncate">{c.name}</span>
                        <div className={`w-1.5 h-2 rounded-[1px] ${c.type === 'red' ? 'bg-red-600' : 'bg-yellow-400'} shrink-0`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Info Details Row */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3.5">
              <div className="flex flex-col items-center text-gray-500 font-medium gap-1 text-center">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="leading-tight">
                    {venues.find(v => v.id === match.venue)?.name || match.venue}, {venues.find(v => v.id === match.venue)?.city || ''}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {match.date}
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-gray-800 pl-3">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {match.time}
                  </div>
                </div>
              </div>
              {match.playerOfMatch && (
                <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-amber-500/5">
                  <span>⭐ POTM: {match.playerOfMatch}</span>
                </div>
              )}
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Prediction Stats */}
          {match.status !== 'completed' && (
            <Card className="flex flex-col gap-6 p-8">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-500" />
                Win Probabilities
              </h3>
              <ProbabilityBar
                homeProb={prediction?.homeProbability}
                drawProb={prediction?.drawProbability}
                awayProb={prediction?.awayProbability}
              />
              <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-black">Predicted Score</p>
                  <p className="text-2xl font-black text-green-400">{prediction?.predictedScore}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-black">Confidence</p>
                  <p className={`text-2xl font-black ${prediction?.confidenceLevel === 'High' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {prediction?.confidenceLevel}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Comparison */}
          <Card className="flex flex-col gap-6 p-8">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Team Comparison
            </h3>
            <div className="space-y-6">
              {[
                {
                  label: 'FIFA Ranking',
                  h: homeTeam.fifaRanking,
                  a: awayTeam.fifaRanking,
                  better: 'lower',
                  widths: calculateStatWidth(homeTeam.fifaRanking, awayTeam.fifaRanking, 'lower')
                },
                {
                  label: 'Appearances',
                  h: homeTeam.historicalAppearances,
                  a: awayTeam.historicalAppearances,
                  better: 'higher',
                  widths: calculateStatWidth(homeTeam.historicalAppearances, awayTeam.historicalAppearances, 'higher')
                },
                {
                  label: 'World Titles',
                  h: (homeTeam.bestFinish === 'Winner' ? 1 : 0),
                  a: (awayTeam.bestFinish === 'Winner' ? 1 : 0),
                  better: 'higher',
                  widths: calculateStatWidth((homeTeam.bestFinish === 'Winner' ? 5 : 1), (awayTeam.bestFinish === 'Winner' ? 5 : 1), 'higher') // Simplified
                },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-black text-gray-400">
                    <span className="text-white">{stat.h}</span>
                    <span className="uppercase tracking-widest text-gray-600">{stat.label}</span>
                    <span className="text-white">{stat.a}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800/50 rounded-full flex overflow-hidden p-0.5">
                    <div className="h-full bg-green-500 rounded-l-full transition-all duration-500" style={{ width: stat.widths.home }} />
                    <div className="h-full bg-blue-500 rounded-r-full transition-all duration-500" style={{ width: stat.widths.away }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

            {/* Match Statistics */}
            {match.status === 'completed' && match.stats && (
              <Card className="flex flex-col gap-6 p-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  Match Statistics
                </h3>
                <div className="space-y-6">
                  {[
                    {
                      label: 'Possession',
                      h: `${match.stats.possession[0]}%`,
                      a: `${match.stats.possession[1]}%`,
                      widths: { home: `${match.stats.possession[0]}%`, away: `${match.stats.possession[1]}%` }
                    },
                    {
                      label: 'Expected Goals (xG)',
                      h: match.stats.expectedGoals ? Number(match.stats.expectedGoals[0]).toFixed(2) : '0.00',
                      a: match.stats.expectedGoals ? Number(match.stats.expectedGoals[1]).toFixed(2) : '0.00',
                      widths: calculateStatWidth(match.stats.expectedGoals ? match.stats.expectedGoals[0] : 0, match.stats.expectedGoals ? match.stats.expectedGoals[1] : 0)
                    },
                    {
                      label: 'Shots',
                      h: match.stats.shots[0],
                      a: match.stats.shots[1],
                      widths: calculateStatWidth(match.stats.shots[0], match.stats.shots[1])
                    },
                    {
                      label: 'Shots on Target',
                      h: match.stats.shotsOnTarget[0],
                      a: match.stats.shotsOnTarget[1],
                      widths: calculateStatWidth(match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1])
                    },
                    {
                      label: 'Passes',
                      h: match.stats.passes[0],
                      a: match.stats.passes[1],
                      widths: calculateStatWidth(match.stats.passes[0], match.stats.passes[1])
                    },
                    {
                      label: 'Pass Accuracy',
                      h: `${match.stats.passAccuracy[0]}%`,
                      a: `${match.stats.passAccuracy[1]}%`,
                      widths: { home: `${match.stats.passAccuracy[0]}%`, away: `${match.stats.passAccuracy[1]}%` }
                    },
                    {
                      label: 'Corners',
                      h: match.stats.corners[0],
                      a: match.stats.corners[1],
                      widths: calculateStatWidth(match.stats.corners[0], match.stats.corners[1])
                    },
                    {
                      label: 'Fouls',
                      h: match.stats.fouls[0],
                      a: match.stats.fouls[1],
                      widths: calculateStatWidth(match.stats.fouls[0], match.stats.fouls[1])
                    }
                  ].map(stat => (
                    <div key={stat.label} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[11px] font-black text-gray-400">
                        <span className="text-white">{stat.h}</span>
                        <span className="uppercase tracking-widest text-gray-600">{stat.label}</span>
                        <span className="text-white">{stat.a}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-800/50 rounded-full flex overflow-hidden p-0.5">
                        <div className="h-full bg-green-500 rounded-l-full transition-all duration-500" style={{ width: stat.widths.home }} />
                        <div className="h-full bg-blue-500 rounded-r-full transition-all duration-500" style={{ width: stat.widths.away }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

      </main>
    </div>
  );
};

export default MatchDetail;