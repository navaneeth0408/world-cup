import React, { useMemo } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Target, Users } from 'lucide-react';
import lineupsData from '../../data/lineups.json';

const positionCoordinates = {
    // Goalkeeper
    'GK': { x: 50, y: 88 },
    
    // Defenders
    'LB': { x: 15, y: 72 },
    'LWB': { x: 12, y: 64 },
    'CB_L': { x: 35, y: 75 },
    'CB_C': { x: 50, y: 77 },
    'CB_R': { x: 65, y: 75 },
    'CB': { x: 50, y: 75 },
    'RB': { x: 85, y: 72 },
    'RWB': { x: 88, y: 64 },
    
    // Midfielders
    'LM': { x: 15, y: 48 },
    'DM_L': { x: 35, y: 58 },
    'DM': { x: 50, y: 58 },
    'DM_R': { x: 65, y: 58 },
    'CM_L': { x: 35, y: 48 },
    'CM': { x: 50, y: 48 },
    'CM_C': { x: 50, y: 48 },
    'CM_R': { x: 65, y: 48 },
    'RM': { x: 85, y: 48 },
    'AM_L': { x: 35, y: 38 },
    'AM': { x: 50, y: 38 },
    'AM_R': { x: 65, y: 38 },
    
    // Forwards
    'LW': { x: 20, y: 22 },
    'CF_L': { x: 38, y: 16 },
    'CF': { x: 50, y: 16 },
    'CF_R': { x: 62, y: 16 },
    'RW': { x: 80, y: 22 },
    'RF': { x: 35, y: 22 },
    'LF': { x: 65, y: 22 },
    'SS': { x: 50, y: 26 }
};

const defaultJerseyNumbers = {
    'GK': 1,
    'RB': 2,
    'LB': 3,
    'CB_R': 4,
    'CB_L': 5,
    'CB_C': 6,
    'CB': 5,
    'DM': 6,
    'DM_R': 8,
    'DM_L': 6,
    'CM_R': 8,
    'CM_L': 10,
    'CM': 8,
    'CM_C': 8,
    'RM': 7,
    'LM': 11,
    'LWB': 3,
    'RWB': 2,
    'AM': 10,
    'AM_R': 10,
    'AM_L': 10,
    'RW': 7,
    'LW': 11,
    'CF': 9,
    'CF_R': 9,
    'CF_L': 19,
    'RF': 7,
    'LF': 11,
    'SS': 10
};

const normalizeName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
};

const FavoriteTeamLineup = ({ team }) => {
    const squad = team.squad || [];

    const { startingXI, bench, formation, usingLineupsJson } = useMemo(() => {
        // Look up lineup from lineups.json first
        const lineupInfo = lineupsData?.teams?.find(
            t => t.country_name.toLowerCase() === team.name.toLowerCase()
        );

        if (lineupInfo && lineupInfo.starting_lineup) {
            const xi = [];
            const startingNames = new Set();

            Object.entries(lineupInfo.starting_lineup).forEach(([posKey, playerName]) => {
                const normalizedPlayerName = normalizeName(playerName);
                const squadPlayer = squad.find(p => normalizeName(p.name) === normalizedPlayerName);
                const number = squadPlayer ? squadPlayer.number : (defaultJerseyNumbers[posKey] || 99);
                const coords = positionCoordinates[posKey] || { x: 50, y: 50 };

                xi.push({
                    name: playerName,
                    number,
                    position: posKey,
                    role: posKey,
                    x: coords.x,
                    y: coords.y
                });
                startingNames.add(normalizedPlayerName);
            });

            // Bench consists of all squad members who are not in the starting XI
            const backup = squad.filter(p => !startingNames.has(normalizeName(p.name)));

            return {
                startingXI: xi,
                bench: backup,
                formation: lineupInfo.formation || 'Custom',
                usingLineupsJson: true
            };
        }

        // Fallback: Original dynamic parsing of squad array
        const formationStr = team.formation || '4-3-3';
        const gks = squad.filter(p => p.position === 'GK');
        const defs = squad.filter(p => p.position === 'DEF');
        const mids = squad.filter(p => p.position === 'MID');
        const fwds = squad.filter(p => p.position === 'FWD');

        const parts = formationStr.split('-').map(Number);
        const defCount = parts[0] || 4;
        const midCount = parts[1] || 3;
        const fwdCount = parts[2] || 3;

        const xi = [];
        const backup = [];

        // GK
        if (gks.length > 0) xi.push({ ...gks[0], role: 'GK', x: 50, y: 88 });
        else xi.push({ name: 'Goalkeeper', position: 'GK', role: 'GK', x: 50, y: 88 });

        // DEFs
        const defPositions = [];
        if (defCount === 4) {
            defPositions.push({ x: 12, y: 70 }, { x: 37, y: 74 }, { x: 63, y: 74 }, { x: 88, y: 70 });
        } else if (defCount === 3) {
            defPositions.push({ x: 22, y: 74 }, { x: 50, y: 76 }, { x: 78, y: 74 });
        } else if (defCount === 5) {
            defPositions.push({ x: 10, y: 70 }, { x: 30, y: 74 }, { x: 50, y: 76 }, { x: 70, y: 74 }, { x: 90, y: 70 });
        } else {
            defPositions.push({ x: 12, y: 70 }, { x: 37, y: 74 }, { x: 63, y: 74 }, { x: 88, y: 70 });
        }

        for (let i = 0; i < defCount; i++) {
            const p = defs[i];
            const pos = defPositions[i] || { x: 50, y: 74 };
            xi.push({
                name: p ? p.name : `Defender ${i + 1}`,
                number: p ? p.number : i + 2,
                position: 'DEF',
                role: 'DEF',
                ...pos
            });
        }

        // MIDs
        const midPositions = [];
        if (midCount === 3) {
            midPositions.push({ x: 25, y: 48 }, { x: 50, y: 52 }, { x: 75, y: 48 });
        } else if (midCount === 4) {
            midPositions.push({ x: 15, y: 50 }, { x: 38, y: 52 }, { x: 62, y: 52 }, { x: 85, y: 50 });
        } else if (midCount === 5) {
            midPositions.push({ x: 32, y: 56 }, { x: 68, y: 56 }, { x: 20, y: 40 }, { x: 50, y: 40 }, { x: 80, y: 40 });
        } else if (midCount === 2) {
            midPositions.push({ x: 35, y: 52 }, { x: 65, y: 52 });
        } else {
            midPositions.push({ x: 25, y: 48 }, { x: 50, y: 52 }, { x: 75, y: 48 });
        }

        for (let i = 0; i < midCount; i++) {
            const p = mids[i];
            const pos = midPositions[i] || { x: 50, y: 50 };
            xi.push({
                name: p ? p.name : `Midfielder ${i + 1}`,
                number: p ? p.number : i + defCount + 2,
                position: 'MID',
                role: 'MID',
                ...pos
            });
        }

        // FWDs
        const fwdPositions = [];
        if (fwdCount === 3) {
            fwdPositions.push({ x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 });
        } else if (fwdCount === 1) {
            fwdPositions.push({ x: 50, y: 18 });
        } else if (fwdCount === 2) {
            fwdPositions.push({ x: 32, y: 18 }, { x: 68, y: 18 });
        } else {
            fwdPositions.push({ x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 });
        }

        for (let i = 0; i < fwdCount; i++) {
            const p = fwds[i];
            const pos = fwdPositions[i] || { x: 50, y: 18 };
            xi.push({
                name: p ? p.name : `Forward ${i + 1}`,
                number: p ? p.number : i + defCount + midCount + 2,
                position: 'FWD',
                role: 'FWD',
                ...pos
            });
        }

        const startingNames = new Set(xi.map(p => p.name));
        squad.forEach(p => {
            if (!startingNames.has(p.name)) {
                backup.push(p);
            }
        });

        return {
            startingXI: xi,
            bench: backup,
            formation: formationStr,
            usingLineupsJson: false
        };
    }, [squad, team]);

    // Split starting XI names to display cleanly with correct initials for all players across all teams
    const getLastName = (fullName) => {
        if (!fullName) return '';
        
        const trimmed = fullName.trim();
        
        const parts = trimmed.split(' ');
        if (parts.length <= 1) return trimmed;

        // Find if there is a Dutch/Spanish/German particle (van, de, der, von, etc.)
        const particles = ['van', 'de', 'der', 'von', 'da', 'di', 'del'];
        let particleIndex = -1;
        for (let i = 0; i < parts.length; i++) {
            if (particles.includes(parts[i].toLowerCase())) {
                particleIndex = i;
                break;
            }
        }

        const initial = `${parts[0].charAt(0).toUpperCase()}. `;

        if (particleIndex > 0) {
            // e.g., "Micky van de Ven" -> "M. van de Ven"
            const lastNamePart = parts.slice(particleIndex).join(' ');
            return `${initial}${lastNamePart}`;
        }

        // Standard: "Lionel Messi" -> "L. Messi"
        const lastNamePart = parts[parts.length - 1];
        return `${initial}${lastNamePart}`;
    };

    return (
        <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-xl hover:border-green-500/20 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                        {usingLineupsJson ? 'Latest Lineup' : 'Predicted Lineup'}
                    </h3>
                </div>
                <Badge variant="blue">{formation} Formation</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2/3 column: Soccer Field */}
                <div className="lg:col-span-2 relative bg-emerald-950/20 border border-emerald-900/40 rounded-2xl aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4] overflow-hidden p-4 shadow-inner">
                    {/* Pitch markings */}
                    <div className="absolute inset-4 border border-white/10 rounded-lg pointer-events-none">
                        {/* Center line */}
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                        {/* Center circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/10 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/10 rounded-full" />

                        {/* Penalty Area Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-x border-b border-white/10">
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/10 rounded-full" />
                            {/* Penalty Arc */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-8 border-b border-x border-dashed border-white/10 rounded-b-full" />
                        </div>
                        {/* Goal Area Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 border-x border-b border-white/10" />

                        {/* Penalty Area Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-x border-t border-white/10">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/10 rounded-full" />
                            {/* Penalty Arc */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8 border-t border-x border-dashed border-white/10 rounded-t-full" />
                        </div>
                        {/* Goal Area Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-5 border-x border-t border-white/10" />
                    </div>

                    {/* Pitch Players */}
                    <div className="absolute inset-0 w-full h-full">
                        {startingXI.map((player, idx) => (
                            <div 
                                key={idx}
                                className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group z-10"
                                style={{ left: `${player.x}%`, top: `${player.y}%` }}
                                title={`${player.name} (${player.position})`}
                            >
                                {/* Player Dot */}
                                <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-green-500 flex items-center justify-center text-[10px] font-black text-white group-hover:scale-110 group-hover:bg-green-500 group-hover:text-slate-950 transition-all shadow-lg cursor-pointer">
                                    {player.number}
                                </div>
                                {/* Player Name Tag */}
                                <div className="mt-1 bg-slate-900/90 border border-slate-800 rounded px-1 py-0.5 max-w-[75px] sm:max-w-[95px] truncate text-[8px] sm:text-[9px] font-bold text-white text-center shadow group-hover:border-green-500/30 transition-colors whitespace-nowrap">
                                    {getLastName(player.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1/3 column: Bench list */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5 leading-none">
                            <Users className="w-3.5 h-3.5 text-slate-500" /> Substitutes Bench
                        </h4>
                        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 border border-slate-800/40 p-2.5 rounded-xl bg-slate-950/25">
                            {bench.length > 0 ? (
                                bench.map((player) => (
                                    <div 
                                        key={player.number}
                                        className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-900/30 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                                                #{player.number}
                                            </span>
                                            <span className="font-semibold text-slate-200 truncate">{player.name}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider shrink-0 bg-slate-950 border border-slate-800 px-1 py-0.25 rounded">
                                            {player.position}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] text-slate-500 text-center py-6">
                                    No substitutes registered
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default FavoriteTeamLineup;
