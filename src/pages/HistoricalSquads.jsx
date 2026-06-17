import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { historicalSquads } from '../data/historicalData';
import { ArrowLeft, Users, Shield, Zap, Target } from 'lucide-react';

const HistoricalSquads = () => {
  const squadKeys = Object.keys(historicalSquads);
  const [selectedKey, setSelectedKey] = useState(squadKeys[0] || '');

  const activeSquad = historicalSquads[selectedKey];

  // Group players by position
  const getGroupedPlayers = (players = []) => {
    const groups = { GK: [], DF: [], MF: [], FW: [] };
    players.forEach(p => {
      if (groups[p.position]) {
        groups[p.position].push(p);
      } else {
        groups.FW.push(p); // default to FW
      }
    });
    return groups;
  };

  const grouped = activeSquad ? getGroupedPlayers(activeSquad.players) : { GK: [], DF: [], MF: [], FW: [] };

  const getPlayerCoordinates = (position, index, count) => {
    let y = 10;
    if (position === 'GK') y = 10;
    else if (position === 'DF') y = 32;
    else if (position === 'MF') y = 58;
    else if (position === 'FW') y = 82;

    let x = 50;
    if (count > 1) {
      x = 85 - (70 / (count - 1)) * index;
    }
    return { left: `${x}%`, bottom: `${y}%` };
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/simulator/historical"
            className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:text-green-500 transition text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Classic Squads</h1>
            <p className="text-gray-500 font-medium">Explore starting lineups of legendary World Cup teams.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Squad Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Select a Legendary Team</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {squadKeys.map((key) => {
                const squad = historicalSquads[key];
                const isActive = key === selectedKey;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                      isActive
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-800 hover:bg-gray-800/50 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{squad.year}</span>
                    <span className="text-lg font-black tracking-tight">{squad.teamName}</span>
                    <span className="text-[10px] opacity-75 font-medium line-clamp-1">{squad.formation} Formation</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: Tactical Pitch & Player List */}
          {activeSquad ? (
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Tactical Pitch Board */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Tactical Board ({activeSquad.formation})</h2>
                <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-green-900 to-green-950 border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Field Markings */}
                  <div className="absolute inset-4 border border-white/10 rounded-2xl pointer-events-none" />
                  {/* Halfway Line */}
                  <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/10 pointer-events-none" />
                  {/* Center Circle */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full pointer-events-none" />
                  {/* Penalty Area Top */}
                  <div className="absolute left-1/4 right-1/4 top-4 h-20 border-b border-x border-white/10 pointer-events-none" />
                  {/* Penalty Area Bottom */}
                  <div className="absolute left-1/4 right-1/4 bottom-4 h-20 border-t border-x border-white/10 pointer-events-none" />
                  {/* Goal Areas */}
                  <div className="absolute left-1/3 right-1/3 top-4 h-8 border-b border-x border-white/10 pointer-events-none" />
                  {/* Goal Areas Bottom */}
                  <div className="absolute left-1/3 right-1/3 bottom-4 h-8 border-t border-x border-white/10 pointer-events-none" />

                  {/* Render Players */}
                  {Object.entries(grouped).map(([position, players]) =>
                    players.map((player, idx) => {
                      const coords = getPlayerCoordinates(position, idx, players.length);
                      return (
                        <div
                          key={player.name}
                          style={coords}
                          className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
                        >
                          <div className="w-9 h-9 rounded-full bg-white text-gray-950 font-black text-xs flex items-center justify-center border-2 border-blue-500 shadow-md group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white group-hover:border-white transition-all">
                            {player.number}
                          </div>
                          <span className="text-[10px] font-bold text-white bg-gray-950/80 px-2 py-0.5 rounded-md mt-1 border border-white/10 whitespace-nowrap shadow-sm text-center">
                            {player.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Player Details List & Description */}
              <div className="md:col-span-5 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Team Profile</h2>
                  <Card className="p-5 bg-gray-900 border-gray-800">
                    <h3 className="text-2xl font-black italic tracking-tighter">{activeSquad.teamName} ({activeSquad.year})</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{activeSquad.description}</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Lineup Details</h2>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {activeSquad.players.map((p) => {
                      let Icon = Target;
                      let badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                      if (p.position === 'GK') {
                        Icon = Users;
                        badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                      } else if (p.position === 'DF') {
                        Icon = Shield;
                        badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      } else if (p.position === 'MF') {
                        Icon = Zap;
                        badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                      }

                      return (
                        <div key={p.name} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-gray-500 w-5 text-right">{p.number}</span>
                            <span className="text-sm font-bold text-white">{p.name}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${badgeColor}`}>
                            {p.position}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-gray-800 rounded-3xl text-center p-8">
              <Users className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-500 font-medium">Select a team to inspect their starting squad.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoricalSquads;
