import React from 'react';
import Flag from '../ui/Flag';

const GroupTable = ({ group, teams = [], highlightedTeamIds = [], showQualificationZone = false }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                    <tr>
                        <th className="px-2 py-3">Pos</th>
                        <th className="px-2 py-3">Team</th>
                        <th className="px-2 py-3 text-center">P</th>
                        <th className="px-2 py-3 text-center">GD</th>
                        <th className="px-2 py-3 text-center">Pts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {teams.map((team, idx) => {
                        const isHighlighted = highlightedTeamIds.includes(team.id);
                        
                        const borderLeftStyle = showQualificationZone
                            ? (idx < 2 
                                ? '2px solid #22c55e' 
                                : idx === 2 
                                    ? '2px solid #f59e0b' 
                                    : '2px solid #ef4444')
                            : undefined;

                        const rowClass = isHighlighted
                            ? 'bg-blue-500/20 shadow-[inset_0_0_8px_rgba(59,130,246,0.2)] font-semibold'
                            : showQualificationZone
                                ? (idx < 2 
                                    ? 'bg-green-900/20' 
                                    : idx === 2 
                                        ? 'bg-amber-500/5' 
                                        : 'bg-red-500/5')
                                : (idx < 2 
                                    ? 'bg-green-500/5' 
                                    : idx === 2 
                                        ? 'bg-yellow-500/5' 
                                        : '');

                        return (
                            <tr 
                                key={team.id} 
                                className={`transition-all duration-300 ${rowClass}`}
                            >
                                <td 
                                    className="px-2 py-3 font-medium text-gray-400"
                                    style={borderLeftStyle ? { borderLeft: borderLeftStyle } : undefined}
                                >
                                    {idx + 1}
                                </td>
                                <td className="px-2 py-3">
                                    <div className="flex items-center gap-3">
                                        <Flag code={team.countryCode} />
                                        <div className="flex flex-col">
                                            <span className={`font-bold leading-tight ${isHighlighted ? 'text-blue-400' : 'text-white'}`}>{team.code}</span>
                                            <span className="text-[10px] text-gray-500 truncate max-w-[100px] leading-tight">{team.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-center text-gray-300">{team.played || 0}</td>
                                <td className="px-2 py-3 text-center text-gray-300">{(team.gd > 0 ? '+' : '') + (team.gd || 0)}</td>
                                <td className="px-2 py-3 text-center font-bold text-green-400">{team.pts || 0}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default GroupTable;
