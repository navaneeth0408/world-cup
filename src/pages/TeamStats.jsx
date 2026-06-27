import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import Button from '../components/ui/Button';
import MatchCard from '../components/match/MatchCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ArrowLeft, Trophy, BarChart3, Goal, Heart, Shield, Activity, Calendar, AlertCircle } from 'lucide-react';
import { powerRankingData } from '../data/powerRankingData';

const TeamStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teams, matches, loading } = useTournament();

  const team = useMemo(() => teams.find(t => t.id === id), [teams, id]);

  const stats = useMemo(() => {
    if (!team) return null;

    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    const scorers = {};
    const assists = {};
    let yellowCards = 0;
    let redCards = 0;
    const playerCardDetails = {};

    const teamMatches = matches.filter(
      m => m.status === 'completed' && (m.homeTeam === id || m.awayTeam === id)
    );

    teamMatches.forEach(match => {
      const isHome = match.homeTeam === id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsScored += teamScore || 0;
      goalsConceded += opponentScore || 0;

      if (opponentScore === 0) {
        cleanSheets++;
      }

      if (teamScore > opponentScore) wins++;
      else if (teamScore === opponentScore) draws++;
      else losses++;

      // Process scorers & assists
      (match.scorers || []).forEach(s => {
        if (s.teamId === id) {
          if (!s.ownGoal) {
            scorers[s.name] = (scorers[s.name] || 0) + 1;
          }
          if (s.assist) {
            assists[s.assist] = (assists[s.assist] || 0) + 1;
          }
        } else if (s.ownGoal) {
          scorers[`${s.name} (OG)`] = (scorers[`${s.name} (OG)`] || 0) + 1;
        }
      });

      // Process cards
      (match.cards || []).forEach(c => {
        if (c.teamId === id) {
          if (!playerCardDetails[c.name]) {
            playerCardDetails[c.name] = { yellow: 0, red: 0 };
          }
          if (c.type === 'yellow') {
            yellowCards++;
            playerCardDetails[c.name].yellow++;
          } else if (c.type === 'red') {
            redCards++;
            playerCardDetails[c.name].red++;
          }
        }
      });
    });

    const rank = team.fifaRanking || 50;
    const possessionBase = Math.max(40, Math.min(65, 62 - (rank * 0.3)));
    const passingAccuracyBase = Math.max(70, Math.min(92, 90 - (rank * 0.35)));

    const averagePossession = Math.round(possessionBase);
    const passingAccuracy = Math.round(passingAccuracyBase);

    return {
      gamesPlayed: teamMatches.length,
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      cleanSheets,
      averagePossession,
      passingAccuracy,
      scorers: Object.entries(scorers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      assists: Object.entries(assists).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      yellowCards,
      redCards,
      playerCards: Object.entries(playerCardDetails).map(([name, cards]) => ({ name, ...cards })).sort((a, b) => b.red - a.red || b.yellow - a.yellow),
      teamMatches
    };
  }, [matches, team, id]);

  const powerData = useMemo(() => {
    return powerRankingData[id] || { marketValue: 50 };
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!team || !stats) return <div className="text-center py-20">Team not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Back Button */}
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-xs py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Team Hero Header */}
        <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-8 rounded-3xl mb-10 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <Flag code={team.countryCode} style={{ fontSize: '7rem' }} className="shadow-lg border border-slate-800 rounded-xl" />
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              <Badge variant="blue">{team.confederation}</Badge>
              <Badge variant="green">FIFA RANK #{team.fifaRanking}</Badge>
              <Badge variant="gray">GROUP {team.group}</Badge>
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
              {team.name} Statistics
            </h1>
            <p className="text-sm text-gray-400 font-semibold">
              Tournament Stats • 2026 FIFA World Cup
            </p>
          </div>
        </Card>

        {/* Tournament performance grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Quick Metrics */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Trophy className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Match Record</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-center">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Played</span>
                <span className="text-3xl font-black text-white mt-1 block">{stats.gamesPlayed}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-center">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Record</span>
                <span className="text-sm font-bold text-green-400 mt-2 block leading-none">
                  {stats.wins}W · {stats.draws}D · {stats.losses}L
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-center col-span-2">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Win Rate</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>
          </Card>

          {/* Goal Metrics */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Goal className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Goals & Defense</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Scored</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.goalsScored}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Conceded</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.goalsConceded}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">GD</span>
                <span className={`text-2xl font-black mt-1 block ${stats.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center col-span-3">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Clean Sheets</span>
                <span className="text-xl font-bold text-white mt-1 block">{stats.cleanSheets} / {stats.gamesPlayed} Matches</span>
              </div>
            </div>
          </Card>

          {/* Gameplay Style */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Play Style</h3>
            </div>
            <div className="flex flex-col gap-5 justify-center flex-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>AVERAGE POSSESSION</span>
                  <span className="text-green-400">{stats.averagePossession}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${stats.averagePossession}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>PASS ACCURACY</span>
                  <span className="text-blue-400">{stats.passingAccuracy}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${stats.passingAccuracy}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dynamic Detail Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Scorers List */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Goal className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Goalscorers</h3>
            </div>
            <div className="space-y-3">
              {stats.scorers.length > 0 ? (
                stats.scorers.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-xs font-bold text-white">{s.name}</span>
                    <Badge variant="green" className="text-xs font-black">{s.count} Goal{s.count > 1 ? 's' : ''}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-550 text-xs text-center py-6 italic">No goals scored in completed matches yet.</p>
              )}
            </div>
          </Card>

          {/* Assists List */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Heart className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Assists</h3>
            </div>
            <div className="space-y-3">
              {stats.assists.length > 0 ? (
                stats.assists.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-xs font-bold text-white">{a.name}</span>
                    <Badge variant="blue" className="text-xs font-black">{a.count} Assist{a.count > 1 ? 's' : ''}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-555 text-xs text-center py-6 italic">No assists recorded in completed matches yet.</p>
              )}
            </div>
          </Card>

          {/* Discipline List */}
          <Card className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <AlertCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Player Discipline</h3>
            </div>
            <div className="space-y-3">
              {stats.playerCards.length > 0 ? (
                stats.playerCards.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <div className="flex items-center gap-2">
                      {c.yellow > 0 && (
                        <span className="bg-yellow-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded">
                          {c.yellow} YEL
                        </span>
                      )}
                      {c.red > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded animate-pulse">
                          {c.red} RED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-555 text-xs text-center py-6 italic">No cards received in completed matches yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Matches Breakdown */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
            <Calendar className="w-6 h-6 text-green-500" />
            Completed Matches & Scorelines
          </h2>
          {stats.teamMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.teamMatches.map(m => (
                <MatchCard key={m.id} match={m} teams={teams} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-slate-900/30 border border-slate-800/80">
              <p className="text-gray-400 font-semibold italic">No completed matches found for {team.name} in this tournament.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamStats;
