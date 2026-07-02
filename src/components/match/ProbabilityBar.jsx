import React from 'react';

const ProbabilityBar = ({ homeProb, drawProb, awayProb }) => {
    const hasDraw = drawProb > 0;

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-wider">
                <span className="text-green-400">WIN {homeProb}%</span>
                {hasDraw && <span className="text-gray-400">DRAW {drawProb}%</span>}
                <span className="text-blue-400">WIN {awayProb}%</span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full flex overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${homeProb}%` }}
                />
                {hasDraw && (
                    <div
                        className="h-full bg-gray-600 transition-all duration-500"
                        style={{ width: `${drawProb}%` }}
                    />
                )}
                <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${awayProb}%` }}
                />
            </div>
        </div>
    );
};

export default ProbabilityBar;
