import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { Newspaper, Calendar, Globe } from 'lucide-react';

const FavoriteTeamNews = ({ team }) => {
    // Generate realistic news articles dynamically based on team properties
    const newsArticles = useMemo(() => {
        const teamName = team.name;
        const manager = team.manager || 'The coaching staff';
        const keyPlayer = team.squad && team.squad.length > 0 ? team.squad[0].name : 'The team captain';

        return [
            {
                id: '1',
                headline: `${teamName} Camp Confirms Maximum Readiness Ahead of Opening Match`,
                summary: `Head coach ${manager} expressed immense confidence in his 26-man roster after their final tactical session today. The squad reported a clean bill of health with ${keyPlayer} leading training.`,
                date: 'June 18, 2026',
                source: 'FIFA.com',
                category: 'Tournament Update'
            },
            {
                id: '2',
                headline: `Tactical Spotlight: How ${manager} Plans to Unlock Group Rivals`,
                summary: `Analytical breakdown of ${teamName}'s tactical evolution. Analysts highlight how their ${team.formation || '4-3-3'} shape shifts dynamically to dominate possession and exploit spaces in transition.`,
                date: 'June 17, 2026',
                source: 'Sky Sports',
                category: 'Tactical Analysis'
            },
            {
                id: '3',
                headline: `${keyPlayer} Speaks: "Our Only Goal is to Make Our Country Proud"`,
                summary: `In an exclusive press conference, the ${teamName} star discussed squad chemistry, training high-altitude preparation, and carrying the nation's dreams into the 2026 World Cup campaign.`,
                date: 'June 16, 2026',
                source: 'FotMob',
                category: 'Exclusive Interview'
            },
            {
                id: '4',
                headline: `${teamName} Fan Base Floods Host Cities in Massive Show of Support`,
                summary: `Thousands of passionate ${teamName} fans have arrived in North America, turning local fan zones into seas of color. Local organizers anticipate record-breaking turnouts for their upcoming fixtures.`,
                date: 'June 15, 2026',
                source: 'ESPN FC',
                category: 'Fan Experience'
            }
        ];
    }, [team]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Newspaper className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Latest Team News</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsArticles.map((article) => (
                    <Card 
                        key={article.id}
                        className="bg-slate-900/30 border border-slate-800/80 hover:border-green-500/20 hover:bg-slate-900/40 transition-all duration-300 flex flex-col justify-between h-full p-5 rounded-2xl relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex flex-col gap-2 relative z-10">
                            {/* Category Badge */}
                            <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wider self-start leading-none">
                                {article.category}
                            </span>
                            <h4 className="text-sm font-black text-white group-hover:text-green-400 transition-colors leading-snug uppercase tracking-tight mt-1">
                                {article.headline}
                            </h4>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mt-1">
                                {article.summary}
                            </p>
                        </div>

                        {/* Footer metadata */}
                        <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-4 relative z-10 text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-650" />
                                {article.date}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                                <Globe className="w-3 h-3 text-slate-650" />
                                {article.source}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FavoriteTeamNews;
