import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Flag from '../ui/Flag';
import { venues } from '../../data/worldcup2026';

const formatMatchDate = (dateStr, timeStr, timeZone) => {
    if (!dateStr) return '';
    const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return dateStr;
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        return formatter.format(date);
    } catch (e) {
        return dateStr;
    }
};

const MatchCard = ({ match, teams, timeZone = 'UTC' }) => {
    const navigate = useNavigate();
    const homeTeam = teams?.find(t => t.id === match.homeTeam);
    const awayTeam = teams?.find(t => t.id === match.awayTeam);

    const statusVariants = {
        upcoming: 'gray',
        live: 'red',
        completed: 'green',
    };

    return (
        <Card
            onClick={() => navigate(`/match/${match.id}`)}
            className="flex flex-col justify-between h-full !p-4"
        >
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-3">
                <span>Group {match.group}</span>
                <Badge variant={statusVariants[match.status]}>
                    {match.status.toUpperCase()}
                </Badge>
            </div>

            <div className="flex justify-between items-center gap-2 my-auto py-2">
                <div className="flex flex-col items-center flex-1 min-w-0 gap-1">
                    <Flag code={homeTeam?.countryCode} style={{ fontSize: '1.75rem' }} />
                    <span className="text-[11px] font-bold text-white text-center leading-tight break-normal w-full">
                        {homeTeam?.name}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                    {match.status === 'upcoming' ? (
                        <span className="text-xl font-black text-gray-700">VS</span>
                    ) : (
                        <div className="flex items-center gap-2 text-2xl font-black text-white">
                            <span>{match.homeScore}</span>
                            <span className="text-gray-600">-</span>
                            <span>{match.awayScore}</span>
                        </div>
                    )}
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest text-center mt-1 leading-normal">
                        {formatMatchDate(match.date, match.time, timeZone)}
                    </span>
                </div>

                <div className="flex flex-col items-center flex-1 min-w-0 gap-1">
                    <Flag code={awayTeam?.countryCode} style={{ fontSize: '1.75rem' }} />
                    <span className="text-[11px] font-bold text-white text-center leading-tight break-normal w-full">
                        {awayTeam?.name}
                    </span>
                </div>
            </div>

            <div className="text-[9px] text-center text-gray-400 border-t border-white/10 pt-2 mt-3">
                {venues.find(v => v.id === match.venue)?.name || match.venue}
            </div>
        </Card>
    );
};

export default MatchCard;
