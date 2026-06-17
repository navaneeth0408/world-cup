import React from 'react';
import { motion } from 'framer-motion';
import Flag from '../ui/Flag';

const KnockoutBracket = ({ rounds }) => {
    if (!rounds || Object.keys(rounds).length === 0) return null;

    return (
        <div className="flex flex-nowrap gap-8 overflow-x-auto pb-8 min-h-[600px] items-center">
            {Object.entries(rounds).map(([roundName, matches], roundIdx) => (
                <div key={roundName} className="flex flex-col justify-around gap-4 min-w-[250px]">
                    <h3 className="text-center text-[10px] uppercase tracking-widest text-gray-500 mb-4">
                        {roundName.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="flex flex-col justify-around h-full gap-8">
                        {matches.map((match, matchIdx) => (
                            <motion.div
                                key={matchIdx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: roundIdx * 0.2 + matchIdx * 0.1 }}
                                className="relative"
                            >
                                <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                                    <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-800 ${match.winner?.id === match.t1?.id ? 'bg-green-500/10' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <Flag code={match.t1?.countryCode} />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold leading-tight ${match.winner?.id === match.t1?.id ? 'text-green-400' : 'text-white'}`}>{match.t1?.code}</span>
                                                <span className="text-[10px] text-gray-500 truncate max-w-[80px] leading-tight">{match.t1?.name}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-white">
                                            {match.score[0]}
                                            {match.isPenalties && match.pensScore && (
                                                <span className="text-[10px] text-yellow-500 font-bold ml-1">({match.pensScore[0]})</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className={`flex items-center justify-between px-3 py-2 ${match.winner?.id === match.t2?.id ? 'bg-green-500/10' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <Flag code={match.t2?.countryCode} />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold leading-tight ${match.winner?.id === match.t2?.id ? 'text-green-400' : 'text-white'}`}>{match.t2?.code}</span>
                                                <span className="text-[10px] text-gray-500 truncate max-w-[80px] leading-tight">{match.t2?.name}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-white">
                                            {match.score[1]}
                                            {match.isPenalties && match.pensScore && (
                                                <span className="text-[10px] text-yellow-500 font-bold ml-1">({match.pensScore[1]})</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* Visual connectors could be added here with SVG but keeping it clean for now */}
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KnockoutBracket;
