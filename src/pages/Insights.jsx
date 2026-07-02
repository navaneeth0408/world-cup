import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/ui/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Card from '../components/ui/Card';
import Flag from '../components/ui/Flag';
import { useSimulationData } from '../hooks/useSimulationData';
import { 
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import { Trophy, BarChart3, ShieldAlert, Globe2, ArrowRight } from 'lucide-react';

const confedColors = {
    UEFA: '#3b82f6',
    CONMEBOL: '#eab308',
    CONCACAF: '#ef4444',
    CAF: '#22c55e',
    AFC: '#a855f7',
    OFC: '#f97316'
};

const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl shadow-2xl text-xs relative z-50">
                <p className="font-extrabold text-white flex items-center gap-1.5 mb-1.5">
                    {item.name}
                </p>
                <div className="space-y-1 font-medium text-slate-300">
                    <p>🎯 Reach QF: <span className="text-white font-extrabold">{item.qf}%</span></p>
                    <p>🏆 Win World Cup: <span className="text-green-400 font-extrabold">{item.champion}%</span></p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-1">{item.confederation}</p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs relative z-50">
                <p className="font-extrabold text-white mb-1">{item.name}</p>
                <p className="text-slate-400">
                    🏆 Win World Cup: <span className="text-green-400 font-extrabold">{item.champion}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const CustomConfedTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs relative z-50">
                <p className="font-extrabold text-white mb-1">{item.name}</p>
                <p className="text-slate-400">
                    🏆 Summed Title Odds: <span className="text-green-400 font-extrabold">{item.championRate}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const Insights = () => {
    const { entireData, knockoutData, loading } = useSimulationData();
    const [simulationType, setSimulationType] = useState('entire'); // 'entire' or 'knockout'
    const [showAllOdds, setShowAllOdds] = useState(false);
    const [heatmapConfed, setHeatmapConfed] = useState('ALL');
    const [heatmapSearch, setHeatmapSearch] = useState('');

    const data = simulationType === 'knockout' ? knockoutData : entireData;

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Account for sticky headers (approx 130px)
            const yOffset = -130;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // 2. Scatter Plot Data: filter teams with QF% > 10
    const scatterData = useMemo(() => {
        if (!data.teams) return [];
        return data.teams
            .filter(t => t.stageReached.qf > 10)
            .map(t => ({
                name: t.name,
                qf: t.stageReached.qf,
                champion: t.stageReached.champion,
                confederation: t.confederation
            }));
    }, [data]);

    // 3. Title Odds Data: sorted by champion rate
    const sortedTeams = useMemo(() => {
        if (!data.teams) return [];
        return [...data.teams]
            .sort((a, b) => b.stageReached.champion - a.stageReached.champion || b.stageReached.final - a.stageReached.final || a.name.localeCompare(b.name));
    }, [data]);

    const visibleBarData = useMemo(() => {
        if (showAllOdds) return sortedTeams;
        return sortedTeams.slice(0, 15);
    }, [sortedTeams, showAllOdds]);

    // 4. Heatmap Filtered Data
    const heatmapTeams = useMemo(() => {
        return sortedTeams.filter(t => {
            const matchesConfed = heatmapConfed === 'ALL' || t.confederation === heatmapConfed;
            const matchesSearch = t.name.toLowerCase().includes(heatmapSearch.toLowerCase());
            return matchesConfed && matchesSearch;
        });
    }, [sortedTeams, heatmapConfed, heatmapSearch]);

    // 5. Anomaly Drop-offs
    const dropAnomalies = useMemo(() => {
        if (!data.teams) return [];

        const dropStages = [
            { from: 'Group Stage', to: 'Round of 32', keyFrom: 'group', keyTo: 'r32' },
            { from: 'Round of 32', to: 'Round of 16', keyFrom: 'r32', keyTo: 'r16' },
            { from: 'Round of 16', to: 'Quarter-finals', keyFrom: 'r16', keyTo: 'qf' },
            { from: 'Quarter-finals', to: 'Semi-finals', keyFrom: 'qf', keyTo: 'sf' },
            { from: 'Semi-finals', to: 'Finals', keyFrom: 'sf', keyTo: 'final' },
            { from: 'Finals', to: 'Champion', keyFrom: 'final', keyTo: 'champion' }
        ];

        return data.teams
            .filter(t => t.stageReached.r16 > 10) // Focus on major competitors
            .map(t => {
                let maxDrop = 0;
                let maxStage = null;

                dropStages.forEach(stage => {
                    const drop = t.stageReached[stage.keyFrom] - t.stageReached[stage.keyTo];
                    if (drop > maxDrop) {
                        maxDrop = drop;
                        maxStage = stage;
                    }
                });

                return {
                    name: t.name,
                    drop: maxDrop,
                    stage: maxStage
                };
            })
            .sort((a, b) => b.drop - a.drop)
            .slice(0, 5);
    }, [data]);


    // 6. Confederation Sumo
    const confedData = useMemo(() => {
        if (!data.teams) return [];
        const sums = {};
        data.teams.forEach(t => {
            const c = t.confederation;
            sums[c] = (sums[c] || 0) + (t.stageReached.champion || 0);
        });
        return Object.entries(sums)
            .map(([name, championRate]) => ({ name, championRate }))
            .sort((a, b) => b.championRate - a.championRate);
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            <Navbar />

            {/* HERO */}
            <header className="relative bg-[#020617] border-b border-slate-900 overflow-hidden py-16">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block bg-green-500/10 text-green-400 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full mb-3 border border-green-500/20">
                            Predictive Insights
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white max-w-3xl mx-auto leading-none mb-4">
                            100 {simulationType === 'knockout' ? 'Knockout Stage' : 'Entire Tournament'} Sims. <br className="hidden md:inline" /> Here's What They Reveal.
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-semibold max-w-xl mx-auto leading-relaxed">
                            A deep dive into pre-tournament Monte Carlo {simulationType === 'knockout' ? 'Knockout-Only' : 'Entire Tournament'} simulations. This represents statistical probability projections, not live-tracking.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Sticky Table of Contents */}
            <div className="sticky top-16 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 py-3.5 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <button onClick={() => scrollToSection('tier-breakdown')} className="hover:text-green-400 transition-colors border-none bg-transparent cursor-pointer shrink-0">Tier Breakdown</button>
                        <span className="text-slate-800 font-normal shrink-0">|</span>
                        <button onClick={() => scrollToSection('title-odds')} className="hover:text-green-400 transition-colors border-none bg-transparent cursor-pointer shrink-0">Title Odds</button>
                        <span className="text-slate-800 font-normal shrink-0">|</span>
                        <button onClick={() => scrollToSection('heatmap')} className="hover:text-green-400 transition-colors border-none bg-transparent cursor-pointer shrink-0">Stage Survival</button>
                        <span className="text-slate-800 font-normal shrink-0">|</span>
                        <button onClick={() => scrollToSection('anomalies')} className="hover:text-green-400 transition-colors border-none bg-transparent cursor-pointer shrink-0">Anomalies</button>
                        <span className="text-slate-800 font-normal shrink-0">|</span>
                        <button onClick={() => scrollToSection('confederations')} className="hover:text-green-400 transition-colors border-none bg-transparent cursor-pointer shrink-0">Confederations</button>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex bg-slate-900/60 border border-slate-800/80 p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        <button 
                            onClick={() => setSimulationType('entire')} 
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${simulationType === 'entire' ? 'bg-green-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Entire Tournament
                        </button>
                        <button 
                            onClick={() => setSimulationType('knockout')} 
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${simulationType === 'knockout' ? 'bg-green-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Knockout Only
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                
                {/* 2. TIER BREAKDOWN */}
                <section id="tier-breakdown" className="scroll-mt-36">
                    <Card className="p-6 bg-slate-900/30 border border-slate-900">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                                    🏆 Confederation Tier Breakdown
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Mapping consistency (QF Reach %) against ceiling (Champion Odds %). Only shows teams with QF reach {`>`} 10%.
                                </p>
                            </div>
                        </div>

                        <div className="h-[380px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="qf" 
                                        name="Reach QF" 
                                        unit="%" 
                                        stroke="#64748b" 
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                        label={{ value: 'Reach QF %', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="champion" 
                                        name="Champion Odds" 
                                        unit="%" 
                                        stroke="#64748b" 
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                        label={{ value: 'Champion %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                                    />
                                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                                    <Scatter name="Teams" data={scatterData}>
                                        {scatterData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={confedColors[entry.confederation] || '#94a3b8'} 
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 justify-center items-center mt-6 pt-4 border-t border-slate-900 text-[10px] font-black uppercase tracking-wider">
                            {Object.entries(confedColors).map(([conf, color]) => (
                                <div key={conf} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-slate-400">{conf}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* 3. TITLE ODDS */}
                <section id="title-odds" className="scroll-mt-36">
                    <Card className="p-6 bg-slate-900/30 border border-slate-900">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                                    📊 Champion Probability Projections
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Odds of winning the World Cup based on 100 Monte Carlo {simulationType === 'knockout' ? 'Knockout-Only' : 'Entire Tournament'} simulations.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAllOdds(!showAllOdds)}
                                className="px-4 py-2 self-start sm:self-auto text-[10px] font-black uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl transition-all cursor-pointer"
                            >
                                {showAllOdds ? 'Show Top 15' : 'Show All 48 Teams'}
                            </button>
                        </div>

                        <div className="h-[450px] w-full pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={visibleBarData} margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke="#64748b" 
                                        tickFormatter={(v) => `${v}%`} 
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#64748b" 
                                        width={100} 
                                        tick={{ fontSize: 9, fontWeight: 800 }}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Bar dataKey="champion" radius={[0, 4, 4, 0]}>
                                        {visibleBarData.map((entry, index) => {
                                            const isTop3 = index < 3;
                                            return (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={isTop3 ? '#22c55e' : '#22c55e33'} 
                                                    stroke={isTop3 ? '#22c55e' : '#22c55e4d'}
                                                    strokeWidth={1}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </section>

                {/* 4. STAGE SURVIVAL HEATMAP */}
                <section id="heatmap" className="scroll-mt-36">
                    <Card className="p-6 bg-slate-900/30 border border-slate-900 overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                                    🌡️ Stage Survival Heatmap
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Probability of each team reaching or passing each phase of the tournament.
                                </p>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Search team..." 
                                    value={heatmapSearch}
                                    onChange={(e) => setHeatmapSearch(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-xs font-bold px-3.5 py-2.2 rounded-xl text-white placeholder-slate-650 w-full sm:w-44 focus:outline-none focus:border-green-500/40"
                                />
                                <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl overflow-x-auto max-w-full">
                                    {['ALL', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].map(conf => (
                                        <button
                                            key={conf}
                                            onClick={() => setHeatmapConfed(conf)}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border-none bg-transparent cursor-pointer shrink-0 ${
                                                heatmapConfed === conf 
                                                    ? 'bg-green-500/10 text-green-400' 
                                                    : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {conf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Custom Grid Heatmap */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px] border border-slate-800/80 rounded-2xl overflow-hidden">
                                {/* Header */}
                                <div className="grid grid-cols-[160px_repeat(7,1fr)] bg-slate-900/60 border-b border-slate-800/80 text-[9px] font-black uppercase tracking-widest text-slate-400 py-3.5 text-center px-4">
                                    <div className="text-left">Team</div>
                                    <div>Group</div>
                                    <div>R32</div>
                                    <div>R16</div>
                                    <div>QF</div>
                                    <div>SF</div>
                                    <div>Final</div>
                                    <div>Winner</div>
                                </div>

                                {/* Body */}
                                <div className="divide-y divide-slate-900 max-h-[500px] overflow-y-auto pr-1">
                                    {heatmapTeams.length > 0 ? (
                                        heatmapTeams.map((t) => (
                                            <div key={t.name} className="grid grid-cols-[160px_repeat(7,1fr)] items-center text-center px-4 py-2 hover:bg-slate-900/10 transition-colors">
                                                {/* Team Info */}
                                                <div className="flex items-center gap-2.5 text-left truncate">
                                                    <Flag code={t.countryCode} className="shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-black text-white truncate max-w-[110px] leading-tight">{t.name}</p>
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wide">{t.confederation}</span>
                                                    </div>
                                                </div>

                                                {/* Heatmap cells */}
                                                {[
                                                    t.stageReached.group,
                                                    t.stageReached.r32,
                                                    t.stageReached.r16,
                                                    t.stageReached.qf,
                                                    t.stageReached.sf,
                                                    t.stageReached.final,
                                                    t.stageReached.champion
                                                ].map((val, cellIdx) => {
                                                    const textLight = val > 45;
                                                    const bgOpacity = val / 100;
                                                    return (
                                                        <div 
                                                            key={cellIdx}
                                                            className="py-2.5 text-[10px] font-black transition-all group relative cursor-pointer"
                                                            style={{ 
                                                                backgroundColor: val > 0 ? `rgba(34, 197, 94, ${bgOpacity})` : 'transparent',
                                                                color: textLight ? '#020617' : '#94a3b8'
                                                            }}
                                                        >
                                                            {val}%
                                                            
                                                            {/* Custom tooltip on hover */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 text-white border border-slate-800 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase whitespace-nowrap shadow-2xl pointer-events-none z-50">
                                                                {val}% survival chance
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-xs font-bold text-slate-500">
                                            No teams match your search criteria.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 5. ANOMALY CALLOUTS */}
                <section id="anomalies" className="scroll-mt-36">
                    {/* Round over Round steepest drop */}
                    <Card className="p-6 bg-slate-900/30 border border-slate-900">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="w-5 h-5 text-green-400" />
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">
                                🚨 Steepest Round Drop-offs
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mb-6">
                            Teams who suffer the single largest percentage-point drop between consecutive tournament phases. Represents critical choke/barrier points.
                        </p>

                        <div className="space-y-4">
                            {dropAnomalies.map((a, index) => (
                                <div key={index} className="bg-slate-950 p-4 border border-slate-900 rounded-2xl flex items-start gap-4 hover:border-green-500/10 transition-colors">
                                    <div className="bg-green-500/10 text-green-400 text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-green-500/15">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{a.name}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                                            Steepest drop is <span className="text-green-400 font-black">{a.drop}%</span> going from the <span className="text-white font-extrabold">{a.stage.from}</span> ({a.stage.keyFrom === 'group' ? 100 : data.teams.find(x => x.name === a.name).stageReached[a.stage.keyFrom]}%) to the <span className="text-white font-extrabold">{a.stage.to}</span> ({data.teams.find(x => x.name === a.name).stageReached[a.stage.keyTo]}%).
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* 6. CONFEDERATION BREAKDOWN */}
                <section id="confederations" className="scroll-mt-36">
                    <Card className="p-6 bg-slate-900/30 border border-slate-900">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                                    🌍 Confederation Strength Projections
                                </h2>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                    Summed Champion probabilities for all teams grouped by continental confederation.
                                </p>
                            </div>
                        </div>

                        <div className="h-[280px] w-full pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={confedData} margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke="#64748b" 
                                        tickFormatter={(v) => `${v}%`} 
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#64748b" 
                                        width={100} 
                                        tick={{ fontSize: 10, fontWeight: 800 }}
                                    />
                                    <Tooltip content={<CustomConfedTooltip />} />
                                    <Bar dataKey="championRate" radius={[0, 4, 4, 0]}>
                                        {confedData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={confedColors[entry.name] || '#94a3b8'} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </section>

            </main>
        </div>
    );
};

export default Insights;
