import React from 'react';
import Button from '../ui/Button';
import { Play, RotateCcw } from 'lucide-react';

const SimulationControls = ({ onRun, onReset, isSimulating, mode, setMode }) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900 p-4 rounded-xl border border-gray-700 mb-8">
            <div className="flex items-center gap-2 p-1 bg-gray-950 rounded-lg border border-gray-800">
                {['auto', 'manual', 'hybrid'].map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === m
                                ? 'bg-green-500 text-gray-950'
                                : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    onClick={onReset}
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={onRun}
                    disabled={isSimulating}
                    className="flex items-center gap-2 min-w-[160px] justify-center"
                >
                    <Play className={`w-4 h-4 ${isSimulating ? 'animate-pulse' : ''}`} />
                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </Button>
            </div>
        </div>
    );
};

export default SimulationControls;
