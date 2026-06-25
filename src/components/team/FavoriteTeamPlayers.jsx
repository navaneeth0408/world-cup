import React, { useMemo } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Users, Award, Shield, Zap } from 'lucide-react';
import { powerRankingData } from '../../data/powerRankingData';
import { useTournament } from '../../hooks/useTournament';
import playerValues from '../../data/player_values.json';

// Helper to normalize name strings for dynamic stat mapping
const normalizePlayerName = (name) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
};

// Helper to map position names to abbreviations
const mapPosition = (pos) => {
    if (!pos) return 'MID';
    const p = pos.toLowerCase();
    if (p.includes('forward') || p.includes('winger') || p.includes('striker')) {
        return 'FWD';
    }
    if (p.includes('midfield')) {
        return 'MID';
    }
    if (p.includes('back') || p.includes('defender')) {
        return 'DEF';
    }
    if (p.includes('goalkeeper') || p.includes('keeper')) {
        return 'GK';
    }
    return 'MID';
};

// Helper to format market value to standard Transfermarkt-style display values
const formatMarketValue = (value) => {
    if (!value) return 'N/A';
    if (value >= 1000000) {
        const millions = value / 1000000;
        return `€${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
    } else {
        const thousands = value / 1000;
        return `€${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}K`;
    }
};

// Curated list of top stars with high-quality real details
const curatedStars = {
    'argentina': [
        { name: 'Lionel Messi', position: 'FWD', club: 'Inter Miami CF', value: '€35M', goals: 3, assists: 2, isStar: true },
        { name: 'Lautaro Martínez', position: 'FWD', club: 'Inter Milan', value: '€110M', goals: 2, assists: 1 },
        { name: 'Enzo Fernández', position: 'MID', club: 'Chelsea FC', value: '€75M', goals: 0, assists: 2 },
        { name: 'Alexis Mac Allister', position: 'MID', club: 'Liverpool FC', value: '€75M', goals: 1, assists: 1 },
        { name: 'Emiliano Martínez', position: 'GK', club: 'Aston Villa', value: '€28M', goals: 0, assists: 0 },
    ],
    'england': [
        { name: 'Jude Bellingham', position: 'MID', club: 'Real Madrid', value: '€180M', goals: 2, assists: 2, isStar: true },
        { name: 'Harry Kane', position: 'FWD', club: 'FC Bayern Munich', value: '€100M', goals: 4, assists: 1 },
        { name: 'Bukayo Saka', position: 'FWD', club: 'Arsenal FC', value: '€140M', goals: 2, assists: 2 },
        { name: 'Declan Rice', position: 'MID', club: 'Arsenal FC', value: '€120M', goals: 0, assists: 1 },
        { name: 'Phil Foden', position: 'FWD', club: 'Manchester City', value: '€150M', goals: 1, assists: 2 },
    ],
    'portugal': [
        { name: 'Cristiano Ronaldo', position: 'FWD', club: 'Al Nassr', value: '€15M', goals: 2, assists: 1, isStar: true },
        { name: 'Bruno Fernandes', position: 'MID', club: 'Manchester United', value: '€65M', goals: 1, assists: 3 },
        { name: 'Rafael Leão', position: 'FWD', club: 'AC Milan', value: '€75M', goals: 2, assists: 1 },
        { name: 'Bernardo Silva', position: 'MID', club: 'Manchester City', value: '€70M', goals: 0, assists: 2 },
        { name: 'Rúben Dias', position: 'DEF', club: 'Manchester City', value: '€80M', goals: 0, assists: 0 },
    ],
    'brazil': [
        { name: 'Vinícius Júnior', position: 'FWD', club: 'Real Madrid', value: '€200M', goals: 3, assists: 2, isStar: true },
        { name: 'Rodrygo Goes', position: 'FWD', club: 'Real Madrid', value: '€110M', goals: 1, assists: 1 },
        { name: 'Bruno Guimarães', position: 'MID', club: 'Newcastle United', value: '€85M', goals: 0, assists: 2 },
        { name: 'Lucas Paquetá', position: 'MID', club: 'West Ham United', value: '€55M', goals: 1, assists: 1 },
        { name: 'Marquinhos Correa', position: 'DEF', club: 'Paris Saint-Germain', value: '€50M', goals: 0, assists: 0 },
    ],
    'france': [
        { name: 'Kylian Mbappé', position: 'FWD', club: 'Real Madrid', value: '€180M', goals: 4, assists: 2, isStar: true },
        { name: 'Antoine Griezmann', position: 'MID', club: 'Atlético Madrid', value: '€25M', goals: 1, assists: 3 },
        { name: 'William Saliba', position: 'DEF', club: 'Arsenal FC', value: '€80M', goals: 0, assists: 0 },
        { name: 'Aurélien Tchouaméni', position: 'MID', club: 'Real Madrid', value: '€100M', goals: 0, assists: 1 },
        { name: 'Mike Maignan', position: 'GK', club: 'AC Milan', value: '€38M', goals: 0, assists: 0 },
    ],
    'germany': [
        { name: 'Jamal Musiala', position: 'MID', club: 'FC Bayern Munich', value: '€130M', goals: 3, assists: 1, isStar: true },
        { name: 'Florian Wirtz', position: 'MID', club: 'Liverpool', value: '€130M', goals: 2, assists: 2 },
        { name: 'Kai Havertz', position: 'FWD', club: 'Arsenal FC', value: '€75M', goals: 2, assists: 1 },
        { name: 'Antonio Rüdiger', position: 'DEF', club: 'Real Madrid', value: '€25M', goals: 0, assists: 0 },
        { name: 'Joshua Kimmich', position: 'MID', club: 'FC Bayern Munich', value: '€50M', goals: 0, assists: 2 },
    ],
    'spain': [
        { name: 'Lamine Yamal', position: 'FWD', club: 'FC Barcelona', value: '€150M', goals: 2, assists: 3, isStar: true },
        { name: 'Rodri Hernández', position: 'MID', club: 'Manchester City', value: '€130M', goals: 1, assists: 1 },
        { name: 'Pedri González', position: 'MID', club: 'FC Barcelona', value: '€80M', goals: 1, assists: 2 },
        { name: 'Nico Williams', position: 'FWD', club: 'Athletic Bilbao', value: '€75M', goals: 2, assists: 1 },
        { name: 'Dani Carvajal', position: 'DEF', club: 'Real Madrid', value: '€12M', goals: 0, assists: 1 },
    ]
};

// Helper to get club for player by checking curatedStars first, then falling back to realistic list
const getClubForPlayer = (playerName, confederation, index) => {
    for (const country in curatedStars) {
        const found = curatedStars[country].find(
            p => normalizePlayerName(p.name) === normalizePlayerName(playerName)
        );
        if (found && found.club) {
            return found.club;
        }
    }

    const uefaClubs = ['Borussia Dortmund', 'Juventus', 'Marseille', 'SL Benfica', 'Sporting CP', 'Aston Villa', 'Real Sociedad', 'Lazio', 'Fenerbahçe'];
    const conmebolClubs = ['Flamengo', 'Palmeiras', 'Boca Juniors', 'River Plate', 'Grêmio', 'São Paulo FC', 'Colo-Colo'];
    const otherClubs = ['Al Ahly', 'Galatasaray', 'Club América', 'LA Galaxy', 'Inter Miami CF', 'Al Hilal', 'Monterrey', 'Urawa Red Diamonds'];

    if (confederation === 'UEFA') {
        return uefaClubs[index % uefaClubs.length];
    } else if (confederation === 'CONMEBOL') {
        return index === 0 ? 'Atlético Madrid' : conmebolClubs[index % conmebolClubs.length];
    } else {
        return index === 0 ? 'FC Porto' : otherClubs[index % otherClubs.length];
    }
};

const FavoriteTeamPlayers = ({ team }) => {
    const { matches } = useTournament();

    // Dynamically compute completed match statistics (goals, assists) for all players
    const playerStatsMap = useMemo(() => {
        const stats = {};
        (matches || []).filter(m => m.status === 'completed').forEach(match => {
            (match.scorers || []).forEach(s => {
                if (s.ownGoal) return;
                
                if (s.name) {
                    const goalKey = normalizePlayerName(s.name);
                    if (goalKey) {
                        if (!stats[goalKey]) stats[goalKey] = { goals: 0, assists: 0 };
                        stats[goalKey].goals += 1;
                    }
                }
                
                if (s.assist) {
                    const assist = normalizePlayerName(s.assist);
                    if (assist) {
                        if (!stats[assist]) stats[assist] = { goals: 0, assists: 0 };
                        stats[assist].assists += 1;
                    }
                }
            });
        });
        return stats;
    }, [matches]);

    const keyPlayers = useMemo(() => {
        let basePlayers = [];

        // Try to match the team with a country in player_values.json
        const mapTeamIdToCountryName = (teamId) => {
            const mapping = {
                'bosniaandherzegovina': 'Bosnia-Herzegovina',
                'capeverde': 'Cape Verde',
                'curacao': 'Curaçao',
                'drcongo': 'Democratic Republic of the Congo',
                'ivorycoast': 'Ivory Coast',
                'newzealand': 'New Zealand',
                'saudiarabia': 'Saudi Arabia',
                'southafrica': 'South Africa',
                'southkorea': 'South Korea',
                'turkiye': 'Türkiye',
                'usa': 'United States',
            };
            return mapping[teamId.toLowerCase()] || null;
        };

        const countryNameMapped = mapTeamIdToCountryName(team.id);
        const countryData = playerValues.countries.find(c => {
            const name = c.country.toLowerCase();
            return name === team.name.toLowerCase() || 
                   name === team.id.toLowerCase() ||
                   (countryNameMapped && name === countryNameMapped.toLowerCase());
        });

        if (countryData && countryData.top_market_value_players && countryData.top_market_value_players.length > 0) {
            basePlayers = countryData.top_market_value_players.map((p, index) => {
                const positionMapped = mapPosition(p.position);
                const club = getClubForPlayer(p.name, team.confederation, index);
                const displayVal = formatMarketValue(p.market_value_eur);
                return {
                    name: p.name,
                    position: positionMapped,
                    club: club,
                    value: displayVal,
                    isStar: index === 0
                };
            });
        } else {
            // Fallback: Generate dynamically based on team squad and powerRanking market value
            const squad = team.squad || [];
            const powerData = powerRankingData[team.id] || { marketValue: 50 };
            const totalMarketValue = powerData.marketValue || 50;

            // Take first 5 players from squad or make mock players
            const squadPlayers = squad.length >= 5 ? squad.slice(0, 5) : [
                { name: 'Star Attacker', position: 'FWD', age: 25 },
                { name: 'Playmaker', position: 'MID', age: 26 },
                { name: 'Defensive Anchor', position: 'MID', age: 27 },
                { name: 'Lead Defender', position: 'DEF', age: 28 },
                { name: 'Main Goalkeeper', position: 'GK', age: 29 },
            ];

            const getRealisticClub = (index, confed) => {
                const uefaClubs = ['Borussia Dortmund', 'Juventus', 'Marseille', 'SL Benfica', 'Sporting CP', 'Aston Villa', 'Real Sociedad', 'Lazio', 'Fenerbahçe'];
                const conmebolClubs = ['Flamengo', 'Palmeiras', 'Boca Juniors', 'River Plate', 'Grêmio', 'São Paulo FC', 'Colo-Colo'];
                const otherClubs = ['Al Ahly', 'Galatasaray', 'Club América', 'LA Galaxy', 'Inter Miami CF', 'Al Hilal', 'Monterrey', 'Urawa Red Diamonds'];

                if (confed === 'UEFA') {
                    return uefaClubs[index % uefaClubs.length];
                } else if (confed === 'CONMEBOL') {
                    return index === 0 ? 'Atlético Madrid' : conmebolClubs[index % conmebolClubs.length];
                } else {
                    return index === 0 ? 'FC Porto' : otherClubs[index % otherClubs.length];
                }
            };

            const valueRatios = [0.35, 0.22, 0.16, 0.11, 0.08];

            basePlayers = squadPlayers.map((player, index) => {
                const rawVal = totalMarketValue * valueRatios[index];
                const displayVal = rawVal >= 1 ? `€${Math.round(rawVal)}M` : `€${(rawVal * 1000).toFixed(0)}K`;

                return {
                    name: player.name,
                    position: player.position || 'MID',
                    club: player.club || getRealisticClub(index, team.confederation),
                    value: displayVal,
                    isStar: index === 0
                };
            });
        }

        // Dynamically assign actual tournament stats
        return basePlayers.map(player => {
            const normName = normalizePlayerName(player.name);
            const stats = playerStatsMap[normName] || { goals: 0, assists: 0 };
            return {
                ...player,
                goals: stats.goals,
                assists: stats.assists
            };
        });

    }, [team, playerStatsMap]);

    return (
        <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-xl hover:border-green-500/20 transition-all duration-300 flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Users className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Key Squad Players</h3>
            </div>

            <div className="flex-1 flex flex-col gap-3.5">
                {keyPlayers.map((player, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${player.isStar
                            ? 'bg-green-500/10 border-green-500/35 shadow-inner'
                            : 'bg-slate-950/45 border-slate-850 hover:border-slate-800 hover:bg-slate-900/30'
                            }`}
                    >
                        {/* Left Details */}
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${player.isStar ? 'bg-green-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}>
                                {player.isStar ? <Award className="w-4.5 h-4.5" /> : idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-white truncate max-w-[140px] md:max-w-none">{player.name}</span>
                                    {player.isStar && (
                                        <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.25 rounded uppercase tracking-wider">
                                            STAR
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-extrabold uppercase mt-0.5 tracking-wider">
                                    <span className="text-green-400">{player.position}</span>
                                    <span>·</span>
                                    <span className="truncate max-w-[120px]">{player.club}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Stats & Valuation */}
                        <div className="text-right flex items-center gap-4">
                            {/* Goals / Assists metrics */}
                            {player.position !== 'GK' && (player.goals > 0 || player.assists > 0) && (
                                <div className="hidden sm:flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                    {player.goals > 0 && (
                                        <span className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                            <Zap className="w-3 h-3 text-amber-400" /> {player.goals} G
                                        </span>
                                    )}
                                    {player.assists > 0 && (
                                        <span className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                            {player.assists} A
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xs font-black text-white font-mono">{player.value}</span>
                                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">Value</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default FavoriteTeamPlayers;
