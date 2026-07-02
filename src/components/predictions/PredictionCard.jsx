import React from 'react';
import Card from '../ui/Card';
import ProbabilityBar from '../match/ProbabilityBar';
import ConfidenceBadge from './ConfidenceBadge';
import Flag from '../ui/Flag';
const PredictionCard = ({ match, teams, prediction }) => {
    const homeTeam = teams?.find(t => t.id === match.homeTeam);
    const awayTeam = teams?.find(t => t.id === match.awayTeam);

    return (
        <Card className="flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center">
                <ConfidenceBadge level={prediction?.confidenceLevel} />
                <div className="text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-black">AI Predicted</span>
                    <p className="text-lg font-black text-green-400">{prediction?.predictedScore}</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex flex-col items-center flex-1">
                    <Flag code={homeTeam?.countryCode} style={{ fontSize: '2.5rem' }} className="mb-1" />
                    <span className="text-xs font-bold text-white text-center leading-tight truncate max-w-[100px]">{homeTeam?.name}</span>
                </div>
                <div className="text-gray-700 font-black text-xl italic">VS</div>
                <div className="flex flex-col items-center flex-1">
                    <Flag code={awayTeam?.countryCode} style={{ fontSize: '2.5rem' }} className="mb-1" />
                    <span className="text-xs font-bold text-white text-center leading-tight truncate max-w-[100px]">{awayTeam?.name}</span>
                </div>
            </div>

            <ProbabilityBar
                homeProb={prediction?.homeProbability}
                drawProb={prediction?.drawProbability}
                awayProb={prediction?.awayProbability}
            />

            <div className="grid grid-cols-2 gap-2 text-center border-t border-gray-800/80 pt-3 mt-1">
                <div>
                    <span className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider block mb-0.5">AI Predicts</span>
                    <span className="font-black text-green-400 text-sm">{prediction?.predictedScore}</span>
                </div>
                <div>
                    <span className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider block mb-0.5">Actual Score</span>
                    <span className={`font-black text-sm ${match.status === 'completed' ? 'text-white' : 'text-gray-500'}`}>
                        {match.status === 'completed' && match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'TBD'}
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default PredictionCard;
