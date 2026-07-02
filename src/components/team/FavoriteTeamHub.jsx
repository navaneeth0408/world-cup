import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteTeamHero from './FavoriteTeamHero';
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
import Badge from '../ui/Badge';
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

    // Compute group standings locally to check group stage elimination
    const localGroupStandings = useMemo(() => {
        if (!teams || !matches) return {};
        const standings = {};

        // Initialize standings for each team
        teams.forEach(team => {
            if (!standings[team.group]) {
                standings[team.group] = [];
            }

            standings[team.group].push({
                ...team,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                pts: 0
            });
        });

        // Update standings from completed group matches (match_id <= 72)
        matches.filter(m => m.status === 'completed' && m.match_id <= 72).forEach(match => {
            const group = standings[match.group];
            if (!group) return;

            const homeTeam = group.find(t => t.id === match.homeTeam);
            const awayTeam = group.find(t => t.id === match.awayTeam);

            if (!homeTeam || !awayTeam) return;

            homeTeam.played += 1;
            awayTeam.played += 1;
            homeTeam.gf += match.homeScore;
            homeTeam.ga += match.awayScore;
            awayTeam.gf += match.awayScore;
            awayTeam.ga += match.homeScore;

            if (match.homeScore > match.awayScore) {
                homeTeam.won += 1;
                homeTeam.pts += 3;
                awayTeam.lost += 1;
            } else if (match.homeScore < match.awayScore) {
                awayTeam.won += 1;
                awayTeam.pts += 3;
                homeTeam.lost += 1;
            } else {
                homeTeam.drawn += 1;
                awayTeam.drawn += 1;
                homeTeam.pts += 1;
                awayTeam.pts += 1;
            }

            homeTeam.gd = homeTeam.gf - homeTeam.ga;
            awayTeam.gd = awayTeam.gf - awayTeam.ga;
        });

        // Sort standings
        Object.keys(standings).forEach(groupKey => {
            standings[groupKey].sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });
        });

        return standings;
    }, [teams, matches]);

    // Check if favorite team is eliminated / knocked out
    const eliminationInfo = useMemo(() => {
        if (!favoriteTeamId || !matches || !teams || !favoriteTeam) return { isEliminated: false };

        // 1. Get all matches involving our favorite team
        const teamMatches = matches.filter(m => m.homeTeam === favoriteTeamId || m.awayTeam === favoriteTeamId);

        // 2. Check knockout matches first (descending by match_id to find the latest knockout match first)
        const knockoutMatches = teamMatches
            .filter(m => m.match_id > 72)
            .sort((a, b) => b.match_id - a.match_id);

        for (const match of knockoutMatches) {
            if (match.status === 'completed') {
                const isHome = match.homeTeam === favoriteTeamId;
                const isAway = match.awayTeam === favoriteTeamId;

                // Determine winner
                let won = false;
                const winnerId = (match.winnerId || match.winner || '');
                const winnerStr = typeof winnerId === 'object' ? (winnerId.id || '') : winnerId;

                if (winnerStr) {
                    won = winnerStr.toLowerCase() === favoriteTeamId.toLowerCase();
                } else {
                    // Fallback to score comparison
                    if (match.homeScore !== null && match.awayScore !== null) {
                        if (match.homeScore > match.awayScore) {
                            won = isHome;
                        } else if (match.awayScore > match.homeScore) {
                            won = isAway;
                        }
                    }
                }

                const isSemi = match.stage === 'Semi-finals' || match.group === 'SF';
                if (!won && !isSemi) {
                    const isFinal = match.stage === 'Final' || match.stage === 'Grand Final' || match.group === 'F';
                    if (isFinal) {
                        return {
                            isEliminated: true,
                            stage: 'Runner-up',
                            message: `🥈 What an incredible campaign! ${favoriteTeam.name} fought bravely to the final whistle and finishes as the World Cup 2026 Runner-up. The entire nation stands proud of this historic achievement!`,
                            type: 'runner-up'
                        };
                    }

                    const isThirdPlace = match.stage === 'Third Place' || match.stage === 'Third Place Play-off' || match.group === '3RD';
                    if (isThirdPlace) {
                        return {
                            isEliminated: true,
                            stage: '4th Place',
                            message: `🥉 A phenomenal tournament! ${favoriteTeam.name} finished in 4th place at the World Cup 2026. Reaching the final four of the world's biggest stage is a monumental feat!`,
                            type: 'fourth'
                        };
                    }

                    return {
                        isEliminated: true,
                        stage: match.stage || 'Knockout Stage',
                        message: `💔 Heartbreak! ${favoriteTeam.name}'s World Cup 2026 journey has come to an end after a hard-fought defeat in the ${match.stage || 'knockout rounds'}. Thank you for the memories and the passion!`,
                        type: 'knockout'
                    };
                }

                const isFinal = match.stage === 'Final' || match.stage === 'Grand Final' || match.group === 'F';
                if (won && isFinal) {
                    return {
                        isEliminated: true, // completed tournament but as champion
                        stage: 'Champion',
                        message: `🏆 CHAMPIONS OF THE WORLD! ${favoriteTeam.name} has won the FIFA World Cup 2026! History has been written in gold! Congratulations to the players and fans! 🎉🥳`,
                        type: 'champion'
                    };
                }

                const isThirdPlace = match.stage === 'Third Place' || match.stage === 'Third Place Play-off' || match.group === '3RD';
                if (won && isThirdPlace) {
                    return {
                        isEliminated: true,
                        stage: '3rd Place',
                        message: `🥉 Bronze Medalists! ${favoriteTeam.name} clinches 3rd place at the World Cup 2026 with a spectacular victory. A proud moment for the entire country!`,
                        type: 'third'
                    };
                }
            }
        }

        // 3. Check group stage status if no knockout losses are found
        if (favoriteTeam && localGroupStandings[favoriteTeam.group]) {
            const groupStandingsForTeam = localGroupStandings[favoriteTeam.group];
            const groupMatchesForTeam = matches.filter(m => m.group === favoriteTeam.group && m.match_id <= 72);
            const completedGroupMatches = groupMatchesForTeam.filter(m => m.status === 'completed');

            if (completedGroupMatches.length === 6) {
                // Group is completely finished
                const teamIndex = groupStandingsForTeam.findIndex(t => t.id === favoriteTeamId);
                const position = teamIndex + 1;

                if (position === 4) {
                    return {
                        isEliminated: true,
                        stage: 'Group Stage',
                        message: `💔 Eliminated in the Group Stage. ${favoriteTeam.name} finished 4th in Group ${favoriteTeam.group}. We will keep our flags high, learn from this stage, and return stronger for 2030!`,
                        type: 'group'
                    };
                }

                if (position === 3) {
                    // Check if the entire group stage of the tournament is finished (all 72 matches completed)
                    const allGroupMatches = matches.filter(m => m.match_id <= 72);
                    const completedAllGroupMatches = allGroupMatches.filter(m => m.status === 'completed');

                    if (completedAllGroupMatches.length === 72) {
                        // Check if this team is in any Round of 32 matches
                        const hasRoundOf32Match = matches.some(m => m.match_id > 72 && (m.homeTeam === favoriteTeamId || m.awayTeam === favoriteTeamId));
                        if (!hasRoundOf32Match) {
                            return {
                                isEliminated: true,
                                stage: 'Group Stage',
                                message: `💔 Eliminated in the Group Stage. ${favoriteTeam.name} finished 3rd in Group ${favoriteTeam.group} but did not qualify as one of the best 8 third-placed teams. We hold our heads high!`,
                                type: 'group'
                            };
                        }
                    }
                }
            }
        }

        return { isEliminated: false };
    }, [favoriteTeamId, matches, teams, favoriteTeam, localGroupStandings]);

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
            <div className="flex flex-col gap-6">
                {/* Consoling / Celebration banner when knocked out or champion */}
                {eliminationInfo.isEliminated && (
                    <div className="w-full bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900/40 border border-red-500/25 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-red-950/10">
                        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <span className="text-2xl">
                                    {eliminationInfo.type === 'runner-up' ? '🥈' : 
                                     eliminationInfo.type === 'third' ? '🥉' : 
                                     eliminationInfo.type === 'champion' ? '🏆' : '💔'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-black text-white text-base md:text-lg uppercase tracking-tight italic">
                                    {eliminationInfo.type === 'champion' ? 'World Cup Champions!' : 
                                     eliminationInfo.type === 'runner-up' ? 'World Cup Runners-Up!' : 
                                     'Tournament Journey Ended'}
                                </h3>
                                <p className="text-xs text-slate-350 font-semibold mt-1 leading-relaxed max-w-2xl">
                                    {eliminationInfo.message}
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <Badge variant={eliminationInfo.type === 'champion' ? 'green' : 'red'} className="text-[10px] font-black uppercase tracking-wider py-1 px-3">
                                {eliminationInfo.stage}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Hero Widget: spans full width */}
                <FavoriteTeamHero 
                    team={favoriteTeam} 
                    nextMatch={teamMatchesData.nextMatch} 
                    opponent={teamMatchesData.opponent}
                    onChangeTeam={handleOpenChangeTeam}
                />

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Column (2/3 width on large screens): Fixtures & Lineup */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Reusable Fixtures Component */}
                        <div className="hidden md:block">
                            <FavoriteTeamFixtures 
                                team={favoriteTeam} 
                                teamMatches={teamMatchesData.upcoming}
                                teams={teams}
                            />
                        </div>

                        {/* Predicted Starting XI Lineup */}
                        <FavoriteTeamLineup team={favoriteTeam} />
                    </div>

                    {/* Right Column (1/3 width on large screens): Stats, Actions, & Players */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
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
                                    className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-850"
                                    onClick={() => navigate(`/teams/${favoriteTeam.id}/stats`)}
                                >
                                    <BarChart3 className="w-3.5 h-3.5 text-slate-450" />
                                    Statistics
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="text-xs py-2.5 font-bold uppercase tracking-wider border-slate-800 bg-slate-950/20 flex items-center justify-center gap-1.5 hover:bg-slate-850"
                                    onClick={() => navigate('/simulator')}
                                >
                                    <Calculator className="w-3.5 h-3.5 text-slate-450" />
                                    Simulation
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
                                            <span className="text-xs font-bold text-slate-350 mt-1 block leading-relaxed" title={records.scorer}>{records.scorer}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Most Capped</span>
                                            <span className="text-xs font-bold text-slate-350 mt-1 block leading-relaxed" title={records.capped}>{records.capped}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Key Squad Players List */}
                        <FavoriteTeamPlayers team={favoriteTeam} />
                    </div>

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
