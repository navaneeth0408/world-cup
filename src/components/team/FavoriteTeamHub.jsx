import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteTeamHero from './FavoriteTeamHero';
import FavoriteTeamNews from './FavoriteTeamNews';
import FavoriteTeamFixtures from './FavoriteTeamFixtures';
import FavoriteTeamStats from './FavoriteTeamStats';
import FavoriteTeamPredictions from './FavoriteTeamPredictions';
import FavoriteTeamPlayers from './FavoriteTeamPlayers';
import FavoriteTeamLineup from './FavoriteTeamLineup';
import FavoriteTeamSelector from './FavoriteTeamSelector';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Flag from '../ui/Flag';
import { Star, Settings, ChevronRight, Award, Trophy, Users, HelpCircle, ExternalLink, Calendar, BarChart3, Calculator } from 'lucide-react';
import favTeamStats from '../../data/fav team stats.json';

// Historical records mapping for Fan Experience section
const historicalRecords = {
    argentina: { scorer: 'Lionel Messi (109)', capped: 'Lionel Messi (189)', best: 'Winner (1978, 1986, 2022)' },
    brazil: { scorer: 'Neymar Jr (79)', capped: 'Cafu (142)', best: 'Winner (1958, 1962, 1970, 1994, 2002)' },
    england: { scorer: 'Harry Kane (68)', capped: 'Peter Shilton (125)', best: 'Winner (1966)' },
    germany: { scorer: 'Miroslav Klose (71)', capped: 'Lothar Matthäus (150)', best: 'Winner (1954, 1974, 1990, 2014)' },
    portugal: { scorer: 'Cristiano Ronaldo (135)', capped: 'Cristiano Ronaldo (216)', best: 'Third Place (1966)' },
    france: { scorer: 'Olivier Giroud (57)', capped: 'Hugo Lloris (145)', best: 'Winner (1998, 2018)' },
    spain: { scorer: 'David Villa (59)', capped: 'Sergio Ramos (180)', best: 'Winner (2010)' },
    italy: { scorer: 'Gigi Riva (35)', capped: 'Gianluigi Buffon (176)', best: 'Winner (1934, 1938, 1982, 2006)' },
    netherlands: { scorer: 'Robin van Persie (50)', capped: 'Wesley Sneijder (134)', best: 'Runner-up (1974, 1978, 2010)' },
    croatia: { scorer: 'Davor Šuker (45)', capped: 'Luka Modrić (180)', best: 'Runner-up (2018)' },
    belgium: { scorer: 'Romelu Lukaku (85)', capped: 'Jan Vertonghen (157)', best: 'Third Place (2018)' },
    colombia: { scorer: 'Radamel Falcao (36)', capped: 'David Ospina (128)', best: 'Quarter-finals (2014)' },
    mexico: { scorer: 'Javier Hernández (52)', capped: 'Andrés Guardado (179)', best: 'Quarter-finals (1970, 1986)' },
    usa: { scorer: 'Clint Dempsey / Landon Donovan (57)', capped: 'Cobi Jones (164)', best: 'Third Place (1930)' },
    canada: { scorer: 'Cyle Larin (29)', capped: 'Atiba Hutchinson (104)', best: 'Group Stage (1986, 2022)' },
};

const FavoriteTeamHub = ({ teams, matches }) => {
    const navigate = useNavigate();
    const [favoriteTeamId, setFavoriteTeamId] = useState(() => {
        return localStorage.getItem('wc2026_favorite_team_id') || '';
    });
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

    // Get current favorite team object
    const favoriteTeam = useMemo(() => {
        if (!favoriteTeamId) return null;
        return teams.find(t => t.id === favoriteTeamId);
    }, [favoriteTeamId, teams]);

    // Handle selecting a team
    const handleSelectTeam = (teamId) => {
        localStorage.setItem('wc2026_favorite_team_id', teamId);
        setFavoriteTeamId(teamId);
        setIsChangeModalOpen(false);
    };

    // Filter matches for this team
    const teamMatchesData = useMemo(() => {
        if (!favoriteTeamId) return { upcoming: [], completed: [], nextMatch: null, opponent: null };

        const allTeamMatches = matches.filter(
            m => m.homeTeam === favoriteTeamId || m.awayTeam === favoriteTeamId
        );

        const upcoming = allTeamMatches
            .filter(m => m.status === 'upcoming')
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

        const completed = allTeamMatches
            .filter(m => m.status === 'completed')
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

        const nextMatch = upcoming.length > 0 ? upcoming[0] : null;
        let opponent = null;

        if (nextMatch) {
            const opponentId = nextMatch.homeTeam === favoriteTeamId ? nextMatch.awayTeam : nextMatch.homeTeam;
            opponent = teams.find(t => t.id === opponentId);
        }

        return { upcoming, completed, nextMatch, opponent };
    }, [favoriteTeamId, matches, teams]);

    // Handle actions
    const handleOpenChangeTeam = () => {
        setIsChangeModalOpen(true);
    };

    const handleSearchTransfermarkt = () => {
        if (!favoriteTeam) return;
        const query = encodeURIComponent(`${favoriteTeam.name} national team`);
        window.open(`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${query}`, '_blank');
    };

    // Get historical record details from fav team stats JSON
    const records = useMemo(() => {
        if (!favoriteTeam) return null;

        const normalizeNameForStats = (name) => {
            if (!name) return '';
            return name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "")
                .trim();
        };

        const targetName = normalizeNameForStats(favoriteTeam.name);
        const statsEntry = favTeamStats?.teams?.find(
            t => normalizeNameForStats(t.name) === targetName
        );

        if (statsEntry) {
            return {
                appearances: statsEntry.appearances,
                best: statsEntry.best_finish || 'Group Stage',
                scorer: statsEntry.top_scorer || 'None',
                capped: statsEntry.most_caps || 'None'
            };
        }

        const record = historicalRecords[favoriteTeam.id];
        const squad = favoriteTeam.squad || [];
        const topScorerFallback = squad.length > 0 ? `${squad[0].name} (Squad Leader)` : 'TBD';
        const cappedFallback = squad.length > 1 ? `${squad[1].name} (Squad Veteran)` : 'TBD';

        return {
            appearances: favoriteTeam.historicalAppearances || 1,
            scorer: record?.scorer || topScorerFallback,
            capped: record?.capped || cappedFallback,
            best: record?.best || favoriteTeam.bestFinish || 'Group Stage'
        };
    }, [favoriteTeam]);

    // Render selector if no favorite team chosen
    if (!favoriteTeam) {
        return (
            <FavoriteTeamSelector teams={teams} onSelectTeam={handleSelectTeam} />
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header / Actions section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                        <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Favorite Team Hub</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Your personalized World Cup command center.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        className="text-xs font-black uppercase tracking-wider py-2 flex items-center gap-1.5 border-slate-800 hover:border-green-500/30 transition-colors"
                        onClick={handleOpenChangeTeam}
                    >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Change Team
                    </Button>
                </div>
            </div>

            {/* Grid Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hero Widget: spans all 3 columns */}
                <div className="lg:col-span-3">
                    <FavoriteTeamHero 
                        team={favoriteTeam} 
                        nextMatch={teamMatchesData.nextMatch} 
                        opponent={teamMatchesData.opponent}
                        onChangeTeam={handleOpenChangeTeam}
                    />
                </div>

                {/* Left Side: news & upcoming fixtures (2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Reusable News Component */}
                    <FavoriteTeamNews team={favoriteTeam} />
                    
                    {/* Reusable Fixtures Component */}
                    <FavoriteTeamFixtures 
                        team={favoriteTeam} 
                        teamMatches={teamMatchesData.upcoming}
                        teams={teams}
                    />
                </div>

                {/* Right Side: stats & predictions (1 col) */}
                <div className="flex flex-col gap-6">
                    {/* Reusable Predictions Component */}
                    <FavoriteTeamPredictions team={favoriteTeam} />

                    {/* Quick Actions Card */}
                    <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-xl hover:border-green-500/20 transition-all duration-300">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                            <Trophy className="w-5 h-5 text-green-500" />
                            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Quick Actions</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2.5">
                            <Button 
                                variant="secondary" 
                                className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-800"
                                onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
                            >
                                <Users className="w-3.5 h-3.5 text-slate-450" />
                                View Squad
                            </Button>
                            <Button 
                                variant="secondary" 
                                className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-800"
                                onClick={() => navigate(`/matches?team=${favoriteTeam.id}`)}
                            >
                                <Calendar className="w-3.5 h-3.5 text-slate-450" />
                                Fixtures
                            </Button>
                            <Button 
                                variant="secondary" 
                                className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-800"
                                onClick={() => navigate('/standings')}
                            >
                                <BarChart3 className="w-3.5 h-3.5 text-slate-450" />
                                Statistics
                            </Button>
                            <Button 
                                variant="secondary" 
                                className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-800"
                                onClick={() => navigate('/simulator')}
                            >
                                <Calculator className="w-3.5 h-3.5 text-slate-450" />
                                Simulation
                            </Button>
                            <Button 
                                variant="secondary" 
                                className="col-span-2 text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/30 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80"
                                onClick={handleSearchTransfermarkt}
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                Transfermarkt Profiles
                            </Button>
                        </div>
                    </Card>

                    {/* Fan Experience: facts, historical records */}
                    {records && (
                        <Card className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-xl hover:border-green-500/20 transition-all duration-300">
                            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                                <Award className="w-5 h-5 text-green-500" />
                                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Fan Experience</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 border-b border-slate-800/40 pb-4">
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Best Finish</span>
                                        <span className="text-xs font-black text-white mt-1 block leading-tight">{records.best}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Appearances</span>
                                        <span className="text-xs font-black text-white mt-1 block leading-tight">
                                            {records.appearances ? `${records.appearances} tournaments` : 'TBD'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-b border-slate-800/40 pb-4">
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Top Scorer</span>
                                        <span className="text-xs font-bold text-slate-350 mt-1 block truncate leading-tight" title={records.scorer}>{records.scorer}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Most Capped</span>
                                        <span className="text-xs font-bold text-slate-350 mt-1 block truncate leading-tight" title={records.capped}>{records.capped}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Bottom line: Lineup predicted & Key players */}
                <div className="lg:col-span-2">
                    <FavoriteTeamLineup team={favoriteTeam} />
                </div>
                <div className="lg:col-span-1">
                    <FavoriteTeamPlayers team={favoriteTeam} />
                </div>

            </div>

            {/* Change Favorite Team Modal */}
            <Modal
                isOpen={isChangeModalOpen}
                onClose={() => setIsChangeModalOpen(false)}
                title="Change Favorite Team"
            >
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {teams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => handleSelectTeam(team.id)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                                team.id === favoriteTeamId
                                    ? 'bg-green-500/10 border-green-500/40 text-white'
                                    : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/30 hover:border-slate-800 text-slate-300 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Flag code={team.countryCode} style={{ fontSize: '1.8rem' }} className="shadow border border-slate-800" />
                                <span className="font-bold text-sm">{team.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    GROUP {team.group}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-650" />
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default FavoriteTeamHub;
