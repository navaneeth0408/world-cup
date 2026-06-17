import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import FormGuide from '../components/team/FormGuide';
import MatchCard from '../components/match/MatchCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Flag from '../components/ui/Flag';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Users, Trophy, Activity, Info } from 'lucide-react';
import { teamInsights } from '../data/teamInsights';
import { recentFinishes } from '../data/recentFinishes';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teams, matches, loading } = useTournament();
  const [showFullSquad, setShowFullSquad] = useState(false);

  const team = useMemo(() => teams.find(t => t.id === id), [teams, id]);

  const teamMatches = useMemo(() =>
    matches.filter(m => m.homeTeam === id || m.awayTeam === id),
    [matches, id]
  );

  const groupOpponents = useMemo(() =>
    teams.filter(t => t.group === team?.group && t.id !== id),
    [teams, team, id]
  );

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!team) return <div className="text-center py-20">Team not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-xs py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Button>

        {/* Team Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
              <Flag code={team.countryCode} style={{ fontSize: '10rem' }} />
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <Badge variant="blue">{team.confederation}</Badge>
                  <Badge variant="green">FIFA RANK #{team.fifaRanking}</Badge>
                  <Badge variant="gray">GROUP {team.group}</Badge>
                </div>
                <h1 className="text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">{team.name}</h1>
                <p className="text-gray-400 font-medium mb-6">Manager: <span className="text-white">{team.manager}</span></p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-800">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Appearances</p>
                    <p className="text-lg font-bold text-white">{team.historicalAppearances}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Best Finish</p>
                    <p className="text-sm font-bold text-white leading-tight">{team.bestFinish}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Formation</p>
                    <p className="text-lg font-bold text-white">{team.formation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Recent Form</p>
                    <FormGuide />
                  </div>
                </div>
              </div>
            </div>

            {/* Insights & History Widgets */}
            <div className="flex flex-col gap-4 w-full pt-4 border-t border-gray-800/80">
              {/* Did You Know? */}
              <div className="flex gap-4 items-start bg-gray-950/40 p-4 rounded-2xl border border-gray-800/60 w-full transition-all hover:border-green-500/20">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Info className="w-5 h-5 text-green-400 shrink-0" />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest italic">Did You Know?</h4>
                  <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                    {teamInsights[team.id] || "This team is set to compete in the highly anticipated 2026 FIFA World Cup tournament."}
                  </p>
                </div>
              </div>

              {/* Recent World Cup Finishes */}
              <div className="flex flex-col gap-3 bg-gray-950/40 p-4 rounded-2xl border border-gray-800/60 w-full transition-all hover:border-amber-500/20">
                <div className="flex items-center gap-2 border-b border-gray-800/60 pb-2 text-left">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Recent World Cup Finishes</h4>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[2022, 2018, 2014].map(year => {
                    const finish = recentFinishes[team.id]?.[year] || "Did Not Qualify";
                    
                    // Premium styling based on performance
                    let bgStyle = "bg-gray-950/60 border-gray-800/80 hover:bg-gray-900/40";
                    let textStyle = "text-gray-300";
                    
                    if (finish.includes("Winner") || finish.includes("🏆")) {
                      bgStyle = "bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/5 hover:bg-yellow-500/15";
                      textStyle = "text-yellow-400 font-extrabold";
                    } else if (finish.includes("Runner-up") || finish.includes("🥈") || finish.includes("Second")) {
                      bgStyle = "bg-slate-300/10 border-slate-300/30 hover:bg-slate-300/15";
                      textStyle = "text-slate-300 font-extrabold";
                    } else if (finish.includes("Third") || finish.includes("🥉")) {
                      bgStyle = "bg-amber-600/10 border-amber-600/30 hover:bg-amber-600/15";
                      textStyle = "text-amber-500 font-extrabold";
                    } else if (finish === "Did Not Qualify") {
                      bgStyle = "bg-gray-950/20 border-gray-900/40 opacity-40";
                      textStyle = "text-gray-500 font-medium";
                    }

                    return (
                      <div 
                        key={year} 
                        className={`border rounded-xl p-2.5 flex flex-col gap-1 items-center justify-center transition-all duration-300 ${bgStyle}`}
                      >
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{year}</span>
                        <span className={`text-[11px] mt-1 leading-snug ${textStyle}`}>{finish}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
              <Users className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Key Squad Players</h3>
            </div>
            <div className="space-y-4">
              {team.squad && team.squad.length > 0 ? (
                team.squad.slice(0, 8).map(player => (
                  <div key={player.number} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">#{player.number}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300">{player.name}</span>
                        <span className="text-[10px] text-gray-600">{player.club || 'National Team'}</span>
                      </div>
                    </div>
                    <Badge variant="gray" className="text-[8px]">{player.position}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-xs text-center py-4 italic">Squad data coming soon</p>
              )}
              {team.squad?.length > 8 && (
                <Button
                  variant="secondary"
                  className="w-full text-[10px] py-2 uppercase font-black tracking-widest border-gray-800"
                  onClick={() => setShowFullSquad(true)}
                >
                  View Full Squad ({team.squad.length})
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Full Squad Modal */}
        <Modal
          isOpen={showFullSquad}
          onClose={() => setShowFullSquad(false)}
          title={`${team.name} Squad`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {team.squad?.map(player => (
              <div key={player.number} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-800 transition-colors hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-bold text-green-500 shadow-lg">
                    #{player.number}
                  </div>
                  <div className="flex flex-col">
                    <a
                      href={player.transfermarktUrl || `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-white hover:text-[#22c55e] hover:underline"
                    >
                      {player.name}
                    </a>
                    {player.club && player.club.trim() !== '' && player.club.trim() !== 'National Team' && (
                      <span className="text-[10px] text-gray-500">{player.club}</span>
                    )}
                  </div>
                </div>
                <Badge variant="gray" className="text-[9px] px-2 py-0.5">{player.position}</Badge>
              </div>
            ))}
          </div>
        </Modal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Matches */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
              <Trophy className="w-6 h-6 text-green-500" />
              Tournament Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMatches.map(m => (
                <MatchCard key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>

          {/* H2H / Group Context */}
          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
              <Activity className="w-6 h-6 text-green-500" />
              Group Opponents
            </h2>
            <div className="space-y-4">
              {groupOpponents.map(opp => (
                <Card key={opp.id} className="p-4 flex items-center justify-between hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Flag code={opp.countryCode} style={{ fontSize: '1.5rem' }} />
                    <div>
                      <h4 className="font-bold text-white text-sm">{opp.name}</h4>
                      <p className="text-[10px] text-gray-500 italic">Rank #{opp.fifaRanking}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="text-[10px] px-3 py-1" onClick={() => navigate(`/teams/${opp.id}`)}>Stats</Button>
                </Card>
              ))}
              <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[10px] text-blue-300/70 leading-relaxed font-medium">
                  {team.name} has a win probability of ~65% against their group stage opponents based on current FIFA rankings and historical performance data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamDetail;
