import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { Cpu, Sparkles, TrendingUp } from 'lucide-react';
import { getTeamStrengthDetails } from '../../utils/simulationHelpers';

const FavoriteTeamPredictions = ({ team }) => {
    const probabilities = useMemo(() => {
        // Calculate power score using the centralized system helper
        const details = getTeamStrengthDetails(team);
        const powerScore = details.powerScore;

        const ps = Math.max(10, Math.min(98, powerScore));

        // Group Stage qualification
        const pGroup = Math.min(99, Math.max(5, Math.round(15 + ps * 0.85 + (20 - (team.fifaRanking || 50)) * 0.3)));
        
        // R16 qualification (clamped)
        const pR16 = Math.min(pGroup - 2, Math.max(2, Math.round(pGroup * (ps / 115))));
        
        // QF qualification (clamped)
        const pQF = Math.min(pR16 - 2, Math.max(1, Math.round(pR16 * (ps / 135))));
        
        // SF qualification (clamped)
        const pSF = Math.min(pQF - 1, Math.max(0.5, Math.round(pQF * (ps / 160) * 10) / 10));
        
        // Finalist qualification (clamped)
        const pFinal = Math.min(pSF - 0.2, Math.max(0.2, Math.round(pSF * (ps / 185) * 10) / 10));
        
        // Winner qualification (clamped)
        const pWinner = Math.min(pFinal - 0.1, Math.max(0.1, Math.round(pFinal * (ps / 215) * 10) / 10));

        return {
            group: pGroup,
            r16: pR16,
            qf: pQF,
            sf: pSF,
            final: pFinal,
            winner: pWinner,
            powerScore: Math.round(ps)
        };
    }, [team]);

    const stages = [
        { label: 'Qualify from Group', value: probabilities.group, color: 'bg-green-500' },
        { label: 'Reach Round of 16', value: probabilities.r16, color: 'bg-green-500/80' },
        { label: 'Reach Quarter Final', value: probabilities.qf, color: 'bg-green-500/60' },
        { label: 'Reach Semi Final', value: probabilities.sf, color: 'bg-emerald-500/60' },
        { label: 'Reach World Cup Final', value: probabilities.final, color: 'bg-emerald-400' },
        { label: 'Win World Cup', value: probabilities.winner, color: 'bg-amber-400', isMain: true },
    ];

    return (
        <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-xl hover:border-green-500/20 transition-all duration-350">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Prediction Insights</h3>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.75 rounded-full uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    AI Power Score: {probabilities.powerScore}
                </span>
            </div>

            <div className="space-y-4">
                {stages.map((stage, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                            <span className={stage.isMain ? 'text-amber-300 font-extrabold flex items-center gap-1' : 'text-slate-300'}>
                                {stage.isMain && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                {stage.label}
                            </span>
                            <span className={stage.isMain ? 'text-amber-300 font-black' : 'text-slate-400 font-bold'}>
                                {stage.value}%
                            </span>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div className="h-2.5 rounded-full bg-slate-950 border border-slate-850 overflow-hidden p-0.5 shadow-inner">
                            <div 
                                className={`h-full rounded-full ${stage.color} transition-all duration-1000 ease-out`}
                                style={{ width: `${stage.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Note on data source */}
            <div className="border-t border-slate-800/40 pt-4 mt-5 flex items-start gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                <TrendingUp className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>
                    Probabilities are calculated dynamically using the 2026 World Cup AI Simulation Engine based on FIFA rankings, squad market values, recent form, and historical tournament performance.
                </span>
            </div>
        </Card>
    );
};

export default FavoriteTeamPredictions;
