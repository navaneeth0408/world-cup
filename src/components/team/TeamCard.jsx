import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Flag from '../ui/Flag';

const TeamCard = ({ team }) => {
    const navigate = useNavigate();

    return (
        <Card
            onClick={() => navigate(`/teams/${team.id}`)}
            className="flex flex-col items-center gap-1.5 md:gap-3 p-3 md:p-5 min-w-0 w-full hover:scale-[1.02] transition-transform duration-300"
        >
            <div className="w-full flex justify-between items-start">
                <Badge variant="blue" className="text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2.5">RANK #{team.fifaRanking}</Badge>
                <Badge variant="gray" className="text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2.5">Group {team.group}</Badge>
            </div>

            <Flag code={team.countryCode} style={{ fontSize: 'inherit' }} className="my-1 md:my-2 text-[2.2rem] md:text-[4rem] flex-shrink-0" />

            <div className="text-center w-full min-w-0">
                <h3 className="text-sm md:text-xl font-black text-white uppercase italic tracking-tight truncate w-full" title={team.name}>{team.name}</h3>
                <p className="text-[9px] md:text-xs text-gray-500 uppercase tracking-widest">{team.confederation}</p>
            </div>

            <div className="w-full grid grid-cols-2 gap-1 md:gap-2 mt-1 md:mt-2 pt-2 md:pt-3 border-t border-gray-800">
                <div className="text-center flex flex-col items-center justify-start min-w-0">
                    <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Apps</p>
                    {team.historicalAppearances === 0 ? (
                        <span className="inline-block text-[7px] md:text-[9px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-1.5 md:px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-widest scale-95 md:scale-100">
                            DEBUT
                        </span>
                    ) : (
                        <p className="text-xs md:text-sm font-bold text-slate-200 mt-0.5">{team.historicalAppearances}</p>
                    )}
                </div>
                <div className="text-center flex flex-col items-center justify-start min-w-0">
                    <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Formation</p>
                    <p className="text-xs md:text-sm font-bold text-slate-200 mt-0.5">{team.formation}</p>
                </div>
            </div>
        </Card>
    );
};

export default TeamCard;
