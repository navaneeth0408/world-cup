import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useTournamentStore } from '../store/tournamentStore';
import { historicalAppearancesMap, historicalSquads, getHistoricalTeamDetails } from '../data/historicalData';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import Flag from '../components/ui/Flag';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Sparkles, ChevronRight, Users } from 'lucide-react';

const HistoricalSimulator = () => {
  const navigate = useNavigate();
  const { teams, loading } = useTournament();
  const {
    historicalSwaps,
    setHistoricalSwaps,
    resetSimulation
  } = useTournamentStore();

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedHistId, setSelectedHistId] = useState('');

  const selectedCurrentTeam = teams.find(t => t.id === selectedTeamId);
  const availableHistoricalTeams = selectedCurrentTeam
    ? (historicalAppearancesMap[selectedCurrentTeam.id] || []).map(year => {
        const swapId = `${selectedCurrentTeam.id}-${year}`;
        const predefined = historicalSquads[swapId];
        return {
          id: swapId,
          year,
          teamName: selectedCurrentTeam.name,
          description: predefined?.description || `${selectedCurrentTeam.name} squad from the ${year} World Cup.`
        };
      })
    : [];

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const handleSwap = () => {
    if (!selectedTeamId || !selectedHistId) return;
    setHistoricalSwaps({
      ...historicalSwaps,
      [selectedTeamId]: selectedHistId
    });
    setSelectedTeamId('');
    setSelectedHistId('');
    resetSimulation();
  };

  const handleRemoveSwap = (teamId) => {
    const updated = { ...historicalSwaps };
    delete updated[teamId];
    setHistoricalSwaps(updated);
    resetSimulation();
  };

  const handleClearAll = () => {
    setHistoricalSwaps({});
    resetSimulation();
  };

  const handleRunSimulation = () => {
    sessionStorage.setItem('startHistoricalSim', 'true');
    navigate('/simulator');
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Historical Simulator</h1>
            <p className="text-gray-500 font-medium">Rewrite history by replacing current teams with legendary squads of the past.</p>
          </div>
          <Link
            to="/simulator/historical/squads"
            className="self-start md:self-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm uppercase tracking-tight"
          >
            <Users className="w-4 h-4" />
            Classic Squads
          </Link>
        </div>

        <div className="space-y-8">
          {/* Replace a Team */}
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-tight mb-4 justify-center">
              <ArrowRightLeft className="w-5 h-5 text-green-500" />
              Replace a Team
            </h2>

            <Card className="p-8 border-dashed border-2 border-gray-800">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block text-center lg:text-left">Current Team to Replace</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setSelectedHistId('');
                    }}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="">Select Team...</option>
                    {teams.map(t => {
                      const isSwapped = !!historicalSwaps[t.id];
                      return (
                        <option key={t.id} value={t.id} disabled={isSwapped}>
                          {t.name} (Grp {t.group}){isSwapped ? ' - Swapped' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-gray-700 rotate-90" />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block text-center lg:text-left">Historical Team to Inject</label>
                  <select
                    value={selectedHistId}
                    onChange={(e) => setSelectedHistId(e.target.value)}
                    disabled={!selectedTeamId || availableHistoricalTeams.length === 0}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!selectedTeamId ? (
                      <option value="">Select current team first...</option>
                    ) : availableHistoricalTeams.length === 0 ? (
                      <option value="">No legendary teams available for {selectedCurrentTeam?.name}</option>
                    ) : (
                      <>
                        <option value="">Select Legendary Team...</option>
                        {availableHistoricalTeams.map(h => (
                          <option key={h.id} value={h.id}>{h.teamName} ({h.year})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <Button
                  variant="primary"
                  onClick={handleSwap}
                  className="w-full py-4 text-lg font-black mt-4"
                  disabled={!selectedTeamId || !selectedHistId}
                >
                  Confirm Swap
                </Button>
              </div>
            </Card>
          </div>

          {Object.keys(historicalSwaps).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="green">ACTIVE SWAPS</Badge>
                  <span className="text-xs text-green-400 font-bold">({Object.keys(historicalSwaps).length} teams replaced)</span>
                </div>
                <Button
                  variant="secondary"
                  className="text-[10px] py-1 px-3 border border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(historicalSwaps).map(([teamId, swapId]) => {
                  const origTeam = teams.find(t => t.id === teamId);
                  const histTeam = getHistoricalTeamDetails(teamId, swapId, teams);
                  if (!origTeam || !histTeam) return null;

                  return (
                    <div key={teamId} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center">
                          <Flag code={origTeam.countryCode} style={{ fontSize: '1.8rem' }} />
                          <span className="text-[9px] font-black text-gray-500 mt-1 uppercase">{origTeam.code}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-white">{histTeam.teamName} ({histTeam.year})</h4>
                          <p className="text-xs text-gray-400 line-clamp-1">{histTeam.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="text-[10px] py-1 hover:text-red-400 border border-gray-700 hover:border-red-500/30 ml-4"
                        onClick={() => handleRemoveSwap(teamId)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="primary"
                className="w-full mt-6 flex items-center justify-center gap-2 py-4 text-lg font-black"
                onClick={handleRunSimulation}
              >
                <Sparkles className="w-5 h-5" />
                Run Historical Simulation
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoricalSimulator;