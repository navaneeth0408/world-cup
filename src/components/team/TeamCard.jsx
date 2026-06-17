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
            className="flex flex-col items-center gap-3"
        >
            <div className="w-full flex justify-between items-start">
                <Badge variant="blue">RANK #{team.fifaRanking}</Badge>
                <Badge variant="gray">Group {team.group}</Badge>
            </div>

            <Flag code={team.countryCode} style={{ fontSize: '4rem' }} className="my-2" />

            <div className="text-center">
                <h3 className="text-xl font-bold text-white">{team.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{team.confederation}</p>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-800">
                <div className="text-center flex flex-col items-center justify-start">
                    <p className="text-[10px] text-gray-500 uppercase">Appearances</p>
                    {team.historicalAppearances === 0 ? (
                        <span className="inline-block text-[10px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2.5 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                            DEBUT
                        </span>
                    ) : (
                        <p className="text-sm font-bold text-white mt-0.5">{team.historicalAppearances}</p>
                    )}
                </div>
                <div className="text-center flex flex-col items-center justify-start">
                    <p className="text-[10px] text-gray-500 uppercase">Formation</p>
                    <p className="text-sm font-bold text-white mt-0.5">{team.formation}</p>
                </div>
            </div>
        </Card>
    );
};

export default TeamCard;
