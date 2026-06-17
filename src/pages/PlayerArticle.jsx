import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playerArticles } from '../data/playerArticles';
import Navbar from '../components/ui/Navbar';
import Button from '../components/ui/Button';
import Flag from '../components/ui/Flag';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, Shield, Landmark } from 'lucide-react';

const PlayerArticle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const article = playerArticles[id];

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white px-4">
                <Navbar />
                <h1 className="text-3xl font-black mb-4">PLAYER NOT FOUND</h1>
                <p className="text-gray-400 mb-8">We couldn't find the article you were looking for.</p>
                <Button onClick={() => navigate('/')}>Return Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 pb-24 text-white">
            <Navbar />

            {/* Back Navigation Bar */}
            <div className="max-w-7xl mx-auto px-4 pt-24 pb-6 relative z-30">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 font-bold text-sm uppercase tracking-wider group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    Back to Showcase
                </button>
            </div>

            {/* Main Content Layout */}
            <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-20">
                {/* Left side: Article text & stats (7 cols) */}
                <article className="lg:col-span-7 space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest ${
                                article.section === 'Last Dance' ? 'text-amber-400' : 'text-green-400'
                            }`}>
                                {article.section}
                            </span>
                            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-300">
                                <Flag code={article.country === 'Argentina' ? 'AR' : 
                                           article.country === 'Portugal' ? 'PT' : 
                                           article.country === 'Brazil' ? 'BR' : 
                                           article.country === 'Croatia' ? 'HR' : 
                                           article.country === 'Egypt' ? 'EG' : 
                                           article.country === 'South Korea' ? 'KR' : 
                                           article.country === 'Belgium' ? 'BE' : 
                                           article.country === 'Germany' ? 'DE' : 
                                           article.country === 'Spain' ? 'ES' : 
                                           article.country === 'England' ? 'GB' : 
                                           article.country === 'France' ? 'FR' : 'US'} 
                                      className="w-4 h-3 object-cover rounded" />
                                {article.country}
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                            {article.name}
                        </h1>
                        <p className="text-xl md:text-2xl font-black text-gray-400 uppercase italic tracking-tight">
                            "{article.title}"
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-900/50 border border-gray-900 rounded-2xl p-5 backdrop-blur-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Age</span>
                            <span className="text-lg font-black text-white">{article.age} Years</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Role</span>
                            <span className="text-lg font-black text-white">{article.role}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Club</span>
                            <span className="text-lg font-black text-white truncate block" title={article.club}>{article.club}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Confederation</span>
                            <span className="text-lg font-black text-white">{
                                article.country === 'Argentina' || article.country === 'Brazil' ? 'CONMEBOL' :
                                article.country === 'Egypt' ? 'CAF' :
                                article.country === 'South Korea' ? 'AFC' : 'UEFA'
                            }</span>
                        </div>
                    </div>

                    {/* Article Paragraphs */}
                    <div className="space-y-6 text-gray-300 text-lg leading-relaxed font-medium">
                        {article.content.map((p, idx) => {
                            const isLast = idx === article.content.length - 1;
                            return (
                                <p 
                                    key={idx} 
                                    className={`${
                                        isLast 
                                            ? 'text-xl font-black text-amber-300 italic border-l-4 border-amber-500 pl-4 py-2 mt-8' 
                                            : ''
                                    }`}
                                >
                                    {p}
                                </p>
                            );
                        })}
                    </div>

                    {/* Call to Action Card */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-3xl p-8 space-y-6 mt-12">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2 text-green-400">
                                <Trophy className="w-6 h-6 text-green-400" />
                                Test His Fate
                            </h3>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                Will {article.name} rise to the challenge and lead his country all the way to World Cup glory, or will the dream fall short? Launch the Tournament Simulator to run realistic match forecasts based on live rankings and tactical values!
                            </p>
                        </div>
                        <Button 
                            variant="primary" 
                            className="bg-green-500 hover:bg-green-600 text-gray-950 font-black tracking-wider uppercase text-xs px-6 py-3"
                            onClick={() => navigate('/simulator')}
                        >
                            Launch Tournament Simulator
                        </Button>
                    </div>
                </article>

                {/* Right side: Giant glowing player card (5 cols) */}
                <div className="lg:col-span-5 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative group w-full max-w-[400px] aspect-[3/4] bg-gray-900 rounded-3xl border border-gray-800 p-4 shadow-2xl flex flex-col justify-end overflow-hidden"
                    >
                        {/* Background subtle glowing radial gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                        {/* Player Image filled to the top */}
                        <div className="absolute inset-0 overflow-hidden z-0">
                            <img 
                                src={article.image} 
                                alt={article.name}
                                className="w-full h-full object-cover filter brightness-[0.85] group-hover:scale-105 transition-transform duration-700 ease-out"
                                style={{ objectPosition: article.objectPosition || 'center top' }}
                            />
                            {/* bottom fade overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                        </div>

                        {/* Card Footer info */}
                        <div className="z-10 bg-black/45 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center relative">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{article.role}</span>
                                <h4 className="text-lg font-black uppercase text-white leading-none tracking-tight">{article.name}</h4>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <Flag code={article.country === 'Argentina' ? 'AR' : 
                                           article.country === 'Portugal' ? 'PT' : 
                                           article.country === 'Brazil' ? 'BR' : 
                                           article.country === 'Croatia' ? 'HR' : 
                                           article.country === 'Egypt' ? 'EG' : 
                                           article.country === 'South Korea' ? 'KR' : 
                                           article.country === 'Belgium' ? 'BE' : 
                                           article.country === 'Germany' ? 'DE' : 
                                           article.country === 'Spain' ? 'ES' : 
                                           article.country === 'England' ? 'GB' : 
                                           article.country === 'France' ? 'FR' : 'US'} 
                                      className="w-5 h-4 object-cover rounded-sm shadow-sm" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default PlayerArticle;
