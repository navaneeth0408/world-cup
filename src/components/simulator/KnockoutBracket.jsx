import React from 'react';
import { motion } from 'framer-motion';
import Flag from '../ui/Flag';

const KnockoutBracket = ({ rounds }) => {
    if (!rounds || Object.keys(rounds).length === 0) return null;

    // Helper to get half of an array or return placeholders if the array is empty
    const getRoundHalf = (matchesArray, startIdx, count) => {
        const result = [];
        for (let i = 0; i < count; i++) {
            const actualIdx = startIdx + i;
            if (matchesArray && matchesArray[actualIdx]) {
                result.push(matchesArray[actualIdx]);
            } else {
                // Placeholder match structure
                result.push({
                    t1: null,
                    t2: null,
                    score: [null, null],
                    isPlaceholder: true
                });
            }
        }
        return result;
    };

    const leftR32 = getRoundHalf(rounds.roundOf32, 0, 8);
    const rightR32 = getRoundHalf(rounds.roundOf32, 8, 8);

    const leftR16 = getRoundHalf(rounds.roundOf16, 0, 4);
    const rightR16 = getRoundHalf(rounds.roundOf16, 4, 4);

    const leftQF = getRoundHalf(rounds.quarterFinals, 0, 2);
    const rightQF = getRoundHalf(rounds.quarterFinals, 2, 2);

    const leftSF = getRoundHalf(rounds.semiFinals, 0, 1);
    const rightSF = getRoundHalf(rounds.semiFinals, 1, 1);

    const finalMatch = rounds.final && rounds.final[0] ? rounds.final[0] : {
        t1: null,
        t2: null,
        score: [null, null],
        isPlaceholder: true
    };

    const thirdPlaceMatch = rounds.thirdPlace ? rounds.thirdPlace : {
        t1: null,
        t2: null,
        score: [null, null],
        isPlaceholder: true
    };

    const renderMatchCard = (match, index, isFinal = false) => {
        const isT1Winner = match.winner && match.t1 && match.winner.id === match.t1.id;
        const isT2Winner = match.winner && match.t2 && match.winner.id === match.t2.id;
        
        if (match.isPlaceholder) {
            return (
                <div className={`bg-gray-955/30 border border-gray-850/60 rounded-xl overflow-hidden shadow-sm opacity-25 select-none transition-all duration-300 ${isFinal ? 'p-0.5' : ''}`}>
                    <div className={`flex items-center justify-between border-b border-gray-900/50 ${isFinal ? 'px-3.5 py-2' : 'px-2.5 py-1.5'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`bg-gray-800 rounded-sm ${isFinal ? 'w-6 h-4' : 'w-5 h-3'}`} />
                            <span className={`font-bold text-gray-500 italic ${isFinal ? 'text-xs' : 'text-[10px]'}`}>TBD</span>
                        </div>
                        <span className={`font-bold text-gray-600 ${isFinal ? 'text-xs' : 'text-[10px]'}`}>-</span>
                    </div>
                    <div className={`flex items-center justify-between ${isFinal ? 'px-3.5 py-2' : 'px-2.5 py-1.5'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`bg-gray-800 rounded-sm ${isFinal ? 'w-6 h-4' : 'w-5 h-3'}`} />
                            <span className={`font-bold text-gray-500 italic ${isFinal ? 'text-xs' : 'text-[10px]'}`}>TBD</span>
                        </div>
                        <span className={`font-bold text-gray-600 ${isFinal ? 'text-xs' : 'text-[10px]'}`}>-</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`bg-gray-900/90 border border-gray-800/80 rounded-xl overflow-hidden shadow-lg hover:border-gray-755 hover:bg-gray-900 transition-all duration-300 w-full ${isFinal ? 'ring-2 ring-yellow-500/30 shadow-yellow-500/5 border-yellow-500/30' : ''}`}>
                <div className={`flex items-center justify-between border-b border-gray-850/80 ${isFinal ? 'px-3.5 py-2.5' : 'px-2.5 py-1.5'} ${isT1Winner ? 'bg-green-500/5' : ''}`}>
                    <div className="flex items-center gap-2.5">
                        <Flag code={match.t1?.countryCode} style={isFinal ? { fontSize: '15px' } : {}} />
                        <div className="flex flex-col">
                            <span className={`font-black leading-tight ${isT1Winner ? 'text-green-400' : 'text-white'} ${isFinal ? 'text-xs' : 'text-[10px]'}`}>{match.t1?.code || match.t1?.name}</span>
                            <span className={`text-gray-500 truncate leading-tight ${isFinal ? 'text-[9px] max-w-[95px]' : 'text-[8px] max-w-[65px]'}`}>{match.t1?.name}</span>
                        </div>
                    </div>
                    <span className={`font-black text-white flex items-center gap-1 ${isFinal ? 'text-sm' : 'text-xs'}`}>
                        {match.score[0] !== null ? match.score[0] : '-'}
                        {match.isPenalties && match.pensScore && (
                            <span className={`text-yellow-500 font-bold ${isFinal ? 'text-[10px]' : 'text-[9px]'}`}>({match.pensScore[0]})</span>
                        )}
                    </span>
                </div>
                <div className={`flex items-center justify-between ${isFinal ? 'px-3.5 py-2.5' : 'px-2.5 py-1.5'} ${isT2Winner ? 'bg-green-500/5' : ''}`}>
                    <div className="flex items-center gap-2.5">
                        <Flag code={match.t2?.countryCode} style={isFinal ? { fontSize: '15px' } : {}} />
                        <div className="flex flex-col">
                            <span className={`font-black leading-tight ${isT2Winner ? 'text-green-400' : 'text-white'} ${isFinal ? 'text-xs' : 'text-[10px]'}`}>{match.t2?.code || match.t2?.name}</span>
                            <span className={`text-gray-500 truncate leading-tight ${isFinal ? 'text-[9px] max-w-[95px]' : 'text-[8px] max-w-[65px]'}`}>{match.t2?.name}</span>
                        </div>
                    </div>
                    <span className={`font-black text-white flex items-center gap-1 ${isFinal ? 'text-sm' : 'text-xs'}`}>
                        {match.score[1] !== null ? match.score[1] : '-'}
                        {match.isPenalties && match.pensScore && (
                            <span className={`text-yellow-500 font-bold ${isFinal ? 'text-[10px]' : 'text-[9px]'}`}>({match.pensScore[1]})</span>
                        )}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full select-none">
            {/* Main Double Sided Bracket Container */}
            <div 
                className="flex flex-row justify-start items-stretch gap-3 md:gap-4 w-full pb-6 overflow-x-auto scrollbar-thin px-4"
                style={{ justifyContent: 'safe center' }}
            >
                
                {/* --- LEFT SIDE: R32 (8) -> R16 (4) -> QF (2) -> SF (1) --- */}
                <div className="flex flex-row items-stretch gap-3 md:gap-4 flex-shrink-0">
                    {/* Column 1: Round of 32 (Left) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Round of 32</h4>
                        <div className="flex flex-col justify-around h-full gap-3">
                            {leftR32.map((match, idx) => (
                                <motion.div key={`left-r32-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Round of 16 (Left) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Round of 16</h4>
                        <div className="flex flex-col justify-around h-full gap-6">
                            {leftR16.map((match, idx) => (
                                <motion.div key={`left-r16-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Quarterfinals (Left) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Quarterfinals</h4>
                        <div className="flex flex-col justify-around h-full gap-12">
                            {leftQF.map((match, idx) => (
                                <motion.div key={`left-qf-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 + idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 4: Semifinals (Left) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Semifinals</h4>
                        <div className="flex flex-col justify-around h-full">
                            {leftSF.map((match, idx) => (
                                <motion.div key={`left-sf-${idx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- CENTER: THE FINAL --- */}
                <div className="flex flex-col justify-center items-center w-[190px] min-w-[190px] px-2 py-4 border-l border-r border-gray-800/30">
                    <h4 className="text-center text-[10px] uppercase tracking-widest text-yellow-500 font-black mb-3 animate-pulse">The Final</h4>
                    <div className="flex flex-col justify-center items-center h-full w-full gap-5">
                        
                        {/* Winner/Champion Announcement if final is completed */}
                        {rounds.final && rounds.final[0] && rounds.final[0].winner ? (
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 w-full text-center flex flex-col items-center gap-1.5 shadow-lg shadow-yellow-500/5"
                            >
                                <span className="text-[9px] uppercase font-black tracking-widest text-yellow-500">🏆 Champion 🏆</span>
                                <Flag code={rounds.final[0].winner.countryCode} style={{ fontSize: '2.2rem' }} className="shadow-md animate-bounce" />
                                <h3 className="text-xs font-black text-white uppercase italic tracking-tight">{rounds.final[0].winner.name}</h3>
                                
                                {rounds.final[0].loser && (
                                    <div className="mt-2 border-t border-gray-800/40 pt-2 w-full flex items-center justify-center gap-1 text-[9px] text-gray-400">
                                        <span>🥈 2nd:</span>
                                        <Flag code={rounds.final[0].loser.countryCode} />
                                        <span className="font-bold text-white truncate max-w-[80px]">{rounds.final[0].loser.code || rounds.final[0].loser.name}</span>
                                    </div>
                                )}
                                {rounds.thirdPlace && rounds.thirdPlace.winner && (
                                    <div className="mt-1 w-full flex items-center justify-center gap-1 text-[9px] text-gray-400">
                                        <span>🥉 3rd:</span>
                                        <Flag code={rounds.thirdPlace.winner.countryCode} />
                                        <span className="font-bold text-white truncate max-w-[80px]">{rounds.thirdPlace.winner.code || rounds.thirdPlace.winner.name}</span>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="bg-gray-955/20 border border-gray-850 rounded-2xl p-3.5 w-full text-center flex flex-col items-center gap-1 select-none opacity-30">
                                <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">Champion</span>
                                <div className="w-7 h-7 rounded-full bg-gray-850 flex items-center justify-center text-xs font-black text-gray-650">🏆</div>
                                <span className="text-[10px] font-bold text-gray-600 italic mt-0.5">TBD</span>
                            </div>
                        )}

                        {/* Final Match Card */}
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="w-full"
                        >
                            {renderMatchCard(finalMatch, 0, true)}
                        </motion.div>

                        {/* Third Place Match Section */}
                        <div className="w-full flex flex-col items-center gap-1.5 mt-2 pt-3 border-t border-gray-800/40">
                            <span className="text-[8px] uppercase tracking-widest text-amber-500/80 font-black">Third Place Playoff</span>
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="w-full"
                            >
                                {renderMatchCard(thirdPlaceMatch, 0)}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: SF (1) <- QF (2) <- R16 (4) <- R32 (8) --- */}
                <div className="flex flex-row-reverse items-stretch gap-3 md:gap-4 flex-shrink-0">
                    {/* Column 9: Round of 32 (Right) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Round of 32</h4>
                        <div className="flex flex-col justify-around h-full gap-3">
                            {rightR32.map((match, idx) => (
                                <motion.div key={`right-r32-${idx}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 8: Round of 16 (Right) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Round of 16</h4>
                        <div className="flex flex-col justify-around h-full gap-6">
                            {rightR16.map((match, idx) => (
                                <motion.div key={`right-r16-${idx}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 7: Quarterfinals (Right) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Quarterfinals</h4>
                        <div className="flex flex-col justify-around h-full gap-12">
                            {rightQF.map((match, idx) => (
                                <motion.div key={`right-qf-${idx}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 + idx * 0.03 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Column 6: Semifinals (Right) */}
                    <div className="flex flex-col justify-around w-[130px] min-w-[130px] py-4">
                        <h4 className="text-center text-[9px] uppercase tracking-widest text-gray-500 font-black mb-3">Semifinals</h4>
                        <div className="flex flex-col justify-around h-full">
                            {rightSF.map((match, idx) => (
                                <motion.div key={`right-sf-${idx}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
                                    {renderMatchCard(match, idx)}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KnockoutBracket;
