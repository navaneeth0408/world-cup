import React, { useState, useEffect, useMemo } from 'react';
import { useTournament } from '../hooks/useTournament';
import Navbar from '../components/ui/Navbar';
import MatchCard from '../components/match/MatchCard';
import GroupTable from '../components/simulator/GroupTable';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, Sparkles, ArrowRightLeft, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroBackground from '../components/home/HeroBackground';
import CinematicSlideshow from '../components/home/CinematicSlideshow';
import Flag from '../components/ui/Flag';
// Player Images - Last Dance
import messiImg from '../assets/players/last-dance/Messi.jpg';
import ronaldoImg from '../assets/players/last-dance/Cr7.jpg';
import neymarImg from '../assets/players/last-dance/Neymar.jpg';
import modricImg from '../assets/players/last-dance/Luka Modric.jpg';
import kdbImg from '../assets/players/last-dance/de bruyne.jpg';
import neuerImg from '../assets/players/last-dance/Manuel Neur.jpg';
import vvdImg from '../assets/players/last-dance/vvd.jpg';
import jamesImg from '../assets/players/last-dance/James Rodriguez.jpg';
import kaneImg from '../assets/players/last-dance/Harry Kane.jpg';

// Player Images - Next Gen
import yamalImg from '../assets/players/next-gen/yamal.jpg';
import oliseImg from '../assets/players/next-gen/Michael Olise.jpg';
import bellinghamImg from '../assets/players/next-gen/bellingham.jpg';
import pedriImg from '../assets/players/next-gen/pedri.jpg';
import musialaImg from '../assets/players/next-gen/Musiala.jpg';
import viniciusImg from '../assets/players/next-gen/Vinicius.jpg';
import dembeleImg from '../assets/players/next-gen/Dembele.jpg';
import mbappeImg from '../assets/players/next-gen/Mbappe.jpg';
import wirtzImg from '../assets/players/next-gen/wirtz.jpg';
import alvarezImg from '../assets/players/next-gen/Alvarez.jpg';
import endrickImg from '../assets/players/next-gen/ones-to-watch/endrick.jpg';
import vitinhaImg from '../assets/players/next-gen/ones-to-watch/vitinha.jpg';

const Home = () => {
  const { teams, matches, groupStandings, loading } = useTournament();
  const navigate = useNavigate();

  const [currentGroupPageIndex, setCurrentGroupPageIndex] = useState(0);
  const groupPages = [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'I'],
    ['J', 'K', 'L']
  ];
  const nextGroupPage = () => {
    if (currentGroupPageIndex < groupPages.length - 1) {
      setCurrentGroupPageIndex(prev => prev + 1);
    }
  };
  const prevGroupPage = () => {
    if (currentGroupPageIndex > 0) {
      setCurrentGroupPageIndex(prev => prev - 1);
    }
  };

  const [selectedTimeZone, setSelectedTimeZone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'UTC';
    }
  });

  const timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'EST (UTC-5)', value: 'America/New_York' },
    { label: 'CST (UTC-6)', value: 'America/Chicago' },
    { label: 'PST (UTC-8)', value: 'America/Los_Angeles' },
    { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
    { label: 'CET (UTC+1)', value: 'Europe/Paris' },
    { label: 'GST (UTC+4)', value: 'Asia/Dubai' },
    { label: 'AEST (UTC+10)', value: 'Australia/Sydney' }
  ];

  const finalTimezones = (() => {
    const exists = timezoneOptions.some(t => t.value === selectedTimeZone);
    if (!exists && selectedTimeZone) {
      return [
        { label: `Local (${selectedTimeZone})`, value: selectedTimeZone },
        ...timezoneOptions
      ];
    }
    return timezoneOptions;
  })();

  // Sort all matches chronologically
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [matches]);

  // Filter matches to get only upcoming ones
  const upcomingMatches = useMemo(() => {
    return sortedMatches.filter(m => m.status === 'upcoming');
  }, [sortedMatches]);

  const displayedMatches = useMemo(() => {
    return upcomingMatches.slice(0, 8);
  }, [upcomingMatches]);

  const theLastDance = [
    { id: 'lionel-messi', name: 'Lionel Messi', country: 'Argentina', flag: '🇦🇷', club: 'Inter Miami CF', image: messiImg },
    { id: 'cristiano-ronaldo', name: 'Cristiano Ronaldo', country: 'Portugal', flag: '🇵🇹', club: 'Al Nassr', image: ronaldoImg },
    { id: 'neymar-jr', name: 'Neymar Jr', country: 'Brazil', flag: '🇧🇷', club: 'Santos', image: neymarImg },
    { id: 'luka-modric', name: 'Luka Modrić', country: 'Croatia', flag: '🇭🇷', club: 'AC Milan', image: modricImg },
    { id: 'kevin-de-bruyne', name: 'Kevin De Bruyne', country: 'Belgium', flag: '🇧🇪', club: 'Napoli', image: kdbImg },
    { id: 'manuel-neuer', name: 'Manuel Neuer', country: 'Germany', flag: '🇩🇪', club: 'FC Bayern Munich', image: neuerImg },
    { id: 'virgil-van-dijk', name: 'Virgil van Dijk', country: 'Netherlands', flag: '🇳🇱', club: 'Liverpool FC', image: vvdImg },
    { id: 'james-rodriguez', name: 'James Rodríguez', country: 'Colombia', flag: '🇨🇴', club: 'Rayo Vallecano', image: jamesImg },
    { id: 'harry-kane', name: 'Harry Kane', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'FC Bayern Munich', image: kaneImg },
  ];

  const readyToTakeOver = [
    { id: 'kylian-mbappe', name: 'Kylian Mbappé', country: 'France', flag: '🇫🇷', club: 'Real Madrid', image: mbappeImg },
    { id: 'pedri', name: 'Pedri', country: 'Spain', flag: '🇪🇸', club: 'FC Barcelona', image: pedriImg },
    { id: 'jude-bellingham', name: 'Jude Bellingham', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Real Madrid', image: bellinghamImg },
    { id: 'vinicius-junior', name: 'Vinícius Júnior', country: 'Brazil', flag: '🇧🇷', club: 'Real Madrid', image: viniciusImg },
    { id: 'ousmane-dembele', name: 'Ousmane Dembélé', country: 'France', flag: '🇫🇷', club: 'Paris Saint-Germain', image: dembeleImg },
    { id: 'jamal-musiala', name: 'Jamal Musiala', country: 'Germany', flag: '🇩🇪', club: 'FC Bayern Munich', image: musialaImg },
    { id: 'julian-alvarez', name: 'Julián Álvarez', country: 'Argentina', flag: '🇦🇷', club: 'Atlético Madrid', image: alvarezImg },
  ];

  const onesToWatch = [
    { id: 'michael-olise', name: 'Michael Olise', country: 'France', flag: '🇫🇷', club: 'FC Bayern Munich', image: oliseImg },
    { id: 'florian-wirtz', name: 'Florian Wirtz', country: 'Germany', flag: '🇩🇪', club: 'Liverpool', image: wirtzImg },
    { id: 'lamine-yamal', name: 'Lamine Yamal', country: 'Spain', flag: '🇪🇸', club: 'FC Barcelona', image: yamalImg },
    { id: 'endrick', name: 'Endrick', country: 'Brazil', flag: '🇧🇷', club: 'Real Madrid', image: endrickImg },
    { id: 'vitinha', name: 'Vitinha', country: 'Portugal', flag: '🇵🇹', club: 'Paris Saint-Germain', image: vitinhaImg },
  ];

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-950 pb-6">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-16 pb-32 px-4 min-h-[420px] md:min-h-[500px] flex items-center">
        <HeroBackground />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3" />
            FIFA World Cup 2026
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8"
          >
            THE WORLD'S <br />
            <span className="text-green-500">BIGGEST STAGE</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              USA · Canada · Mexico
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              June 11 – July 19 2026
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">

        {/* Upcoming Matches Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Upcoming Matches</h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">The next scheduled matches for the FIFA World Cup 2026.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Timezone Selector Dropdown */}
              <div className="relative inline-block text-left">
                <select
                  value={selectedTimeZone}
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-gray-300 text-[11px] md:text-xs rounded-full px-4 py-1.5 pr-8 outline-none focus:border-green-500/50 cursor-pointer appearance-none transition-colors font-bold shadow-lg"
                >
                  {finalTimezones.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-gray-950 text-gray-200">
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <Button variant="secondary" className="text-xs py-1" onClick={() => navigate('/matches')}>View All</Button>
            </div>
          </div>

          {/* Matches Grid */}
          {displayedMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedMatches.map((match) => (
                <MatchCard key={match.id} match={match} teams={teams} timeZone={selectedTimeZone} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-900/10 rounded-2xl border border-gray-900 border-dashed">
              No upcoming matches scheduled.
            </div>
          )}
        </section>

        <div className="space-y-16">
          {/* Standings Snapshot */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">GROUP STANDINGS</h2>
                {/* Navigation Arrows */}
                <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-full p-1 shadow-inner shrink-0">
                  <button
                    onClick={prevGroupPage}
                    disabled={currentGroupPageIndex === 0}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Previous Groups"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black text-gray-300 px-1.5 select-none min-w-[32px] text-center tracking-wider">
                    {groupPages[currentGroupPageIndex].join(' - ')}
                  </span>
                  <button
                    onClick={nextGroupPage}
                    disabled={currentGroupPageIndex === groupPages.length - 1}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Next Groups"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Button variant="secondary" className="text-xs py-1" onClick={() => navigate('/standings')}>Full Standings</Button>
            </div>

            <motion.div
              key={currentGroupPageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {groupPages[currentGroupPageIndex].map((groupLetter, index) => {
                const colors = ['border-green-500', 'border-blue-500', 'border-yellow-500'];
                const borderColor = colors[index % 3];
                return (
                  <div key={groupLetter}>
                    <h3 className={`text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-2 border-l-2 ${borderColor}`}>
                      Group {groupLetter}
                    </h3>
                    <GroupTable teams={groupStandings[groupLetter]?.slice(0, 4)} showQualificationZone={true} />
                  </div>
                );
              })}
            </motion.div>

            {/* Qualification Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span>Qualify to Round of 32</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span>Best 8 third-place teams qualify</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span>Eliminated</span>
              </div>
            </div>
          </div>

          {/* Player Showcase Section */}
          <CinematicSlideshow
            categories={[
              {
                id: 'lastdance',
                label: 'THE LAST DANCE',
                badge: 'FIFA WORLD CUP 2026 · THE LAST DANCE',
                titleMain: 'THE LAST',
                titleAccent: 'DANCE',
                players: theLastDance,
                accentColor: '#f5c518',
                labelColor: '#00ff87'
              },
              {
                id: 'heirsthrone',
                label: 'HEIRS TO THE THRONE',
                badge: 'FIFA WORLD CUP 2026 · HEIRS TO THE THRONE',
                titleMain: 'TAKE THE',
                titleAccent: 'REINS',
                players: readyToTakeOver,
                subhead: 'Already the focal point of their national teams. This is their tournament to define.',
                accentColor: '#38bdf8',
                labelColor: '#38bdf8'
              },
              {
                id: 'onestowatch',
                label: 'ONES TO WATCH',
                badge: 'FIFA WORLD CUP 2026 · ONES TO WATCH',
                titleMain: 'READY TO',
                titleAccent: 'RISE',
                players: onesToWatch,
                accentColor: '#00ff87',
                labelColor: '#00ff87'
              }
            ]}
          />

          {/* Quick Match Predictor Card */}
          <div>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-8 md:p-12 shadow-xl cursor-pointer flex flex-col lg:flex-row items-center gap-8 justify-between"
              onClick={() => navigate('/predictions')}
            >
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                  <Calculator className="w-3.5 h-3.5 text-white" />
                  AI Predictor
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white leading-none uppercase italic tracking-tighter">
                  Quick Match Predictor
                </h3>
                <p className="text-white/95 text-base font-medium max-w-2xl leading-relaxed">
                  Put our machine learning engine to the test! Our advanced AI model parses team form, historic head-to-head records, home advantage, and player ratings to generate detailed probability distributions, score forecasts, and custom tactical recommendations for every single match. Log your own score votes and track your prediction accuracy leaderboard against fans worldwide!
                </p>
                <Button variant="primary" className="bg-white text-indigo-950 border-none hover:bg-gray-100 px-6 py-3 font-black text-sm uppercase tracking-wider">
                  Predict Matches
                </Button>
              </div>

              {/* Mockup Slip: Mexico vs South Africa */}
              <div className="hidden lg:flex flex-col gap-4 bg-black/30 p-6 rounded-2xl border border-white/10 w-96 text-white text-xs font-medium shadow-2xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="font-bold text-[10px] tracking-wider uppercase text-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    AI Forecast Report
                  </span>
                  <span className="bg-amber-400 text-gray-950 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                    Confidence: Medium
                  </span>
                </div>

                {/* Matchup */}
                <div className="flex justify-between items-center py-2 relative z-10">
                  {/* Team A */}
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-8 h-6 overflow-hidden rounded shadow-sm flex items-center justify-center bg-gray-950">
                      <Flag code="MX" className="w-full h-auto object-cover" />
                    </div>
                    <span className="font-bold text-sm text-white">Mexico</span>
                  </div>

                  {/* AI Score */}
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Predicted</span>
                    <span className="text-xl font-black text-amber-300 tracking-wider">1 - 1</span>
                  </div>

                  {/* Team B */}
                  <div className="flex items-center gap-2.5 flex-1 justify-end">
                    <span className="font-bold text-sm text-white">South Africa</span>
                    <div className="w-8 h-6 overflow-hidden rounded shadow-sm flex items-center justify-center bg-gray-950">
                      <Flag code="ZA" className="w-full h-auto object-cover" />
                    </div>
                  </div>
                </div>

                {/* Horizontal Probabilities */}
                <div className="space-y-1.5 relative z-10">
                  <div className="flex justify-between text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                    <span>WIN 68%</span>
                    <span>DRAW 22%</span>
                    <span>WIN 10%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-white/10 border border-white/5 shadow-inner">
                    <div className="bg-emerald-400 h-full" style={{ width: '68%' }} />
                    <div className="bg-gray-400 h-full" style={{ width: '22%' }} />
                    <div className="bg-blue-400 h-full" style={{ width: '10%' }} />
                  </div>
                </div>

                {/* Detail Info Panels */}
                <div className="grid grid-cols-2 gap-2 text-[10px] relative z-10">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
                    <span className="text-purple-300 uppercase tracking-wider text-[8px] font-bold">Key Insight</span>
                    <span className="font-bold text-white mt-1 leading-tight">Giménez in hot goalscoring form</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
                    <span className="text-purple-300 uppercase tracking-wider text-[8px] font-bold">AI Recommended Tip</span>
                    <span className="font-bold text-amber-300 mt-1 leading-tight">Double Chance (1X)</span>
                  </div>
                </div>

                {/* Comparative Metrics */}
                <div className="border-t border-white/10 pt-3 grid grid-cols-3 gap-2 text-center text-[9px] relative z-10">
                  <div className="bg-white/5 py-1.5 px-1 rounded border border-white/5">
                    <span className="text-purple-300 block mb-0.5 uppercase text-[8px]">AI Predicts</span>
                    <span className="font-black text-sm text-white">1 - 1</span>
                  </div>
                  <div className="bg-white/5 py-1.5 px-1 rounded border border-white/5">
                    <span className="text-purple-300 block mb-0.5 uppercase text-[8px]">Your Predicts</span>
                    <span className="font-black text-sm text-white">1 - 0</span>
                  </div>
                  <div className="bg-emerald-500/20 py-1.5 px-1 rounded border border-emerald-500/30">
                    <span className="text-emerald-400 block mb-0.5 uppercase text-[8px]">Actual Score</span>
                    <span className="font-black text-sm text-emerald-300">2 - 0</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tournament Simulation */}
          <div>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 md:p-12 shadow-xl cursor-pointer flex flex-col lg:flex-row items-center gap-8 justify-between"
              onClick={() => navigate('/simulator')}
            >
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                  <Trophy className="w-3.5 h-3.5 text-white" />
                  Tournament Engine
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-gray-950 leading-none uppercase italic tracking-tighter">
                  Run Tournament Simulation
                </h3>
                <p className="text-gray-900/80 text-base font-medium max-w-2xl leading-relaxed">
                  Take control of the entire 2026 World Cup bracket! Our advanced simulation engine runs realistic match simulations based on current FIFA rankings, squad values, and historical performance metrics. Play through the Group Stage, resolve third-place wildcard allocations, and guide your team through the intense knockout rounds all the way to the final.
                </p>
                <Button variant="dark" className="px-6 py-3 text-sm uppercase tracking-wider transition-all duration-150 shadow-2xl hover:scale-105 border-slate-700/80">
                  Launch Simulator
                </Button>
              </div>

              {/* Nice Graphic: Mini CSS Bracket Mockup */}
              <div className="hidden lg:flex items-center gap-6 bg-black/10 p-6 rounded-2xl border border-white/10 w-96 justify-center">
                <div className="flex flex-col gap-8">
                  <div className="bg-gray-950/80 px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-center w-28 text-white">
                    Quarterfinalist A
                  </div>
                  <div className="bg-gray-950/80 px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-center w-28 text-white">
                    Quarterfinalist B
                  </div>
                </div>
                <div className="w-8 h-0.5 bg-white/30 relative">
                  <div className="absolute top-1/2 left-full -translate-y-1/2 w-4 h-12 border-y-2 border-r-2 border-white/30 rounded-r" />
                </div>
                <div className="bg-gray-950 px-5 py-3 rounded-xl border-2 border-yellow-500 text-xs font-black text-center w-32 text-yellow-400 flex flex-col items-center gap-1 shadow-lg">
                  <Trophy className="w-4 h-4" />
                  WORLD CUP FINAL
                </div>
              </div>
            </motion.div>
          </div>

          {/* Historical Team Simulator */}
          <div>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 md:p-12 shadow-xl cursor-pointer flex flex-col lg:flex-row items-center gap-8 justify-between"
              onClick={() => navigate('/simulator/historical')}
            >
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  History Rewriter
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white leading-none uppercase italic tracking-tighter">
                  Historical Team Simulator
                </h3>
                <p className="text-gray-400 text-base font-medium max-w-2xl leading-relaxed">
                  What if Pelé's legendary 1970 Brazil squad or Diego Maradona's 1986 Argentina squad competed in the modern 2026 World Cup? Replace any current qualifying nation with a legendary lineup of the past. Watch them play live, inspect their tactical squads, and see if history repeats itself or if modern tactics prevail!
                </p>
                <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 font-black text-sm uppercase tracking-wider">
                  Rewrite History
                </Button>
              </div>

              {/* Nice Graphic: Swap Visual Mockup */}
              <div className="hidden lg:flex items-center gap-6 bg-black/25 p-6 rounded-2xl border border-gray-800 w-96 justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 text-white font-bold text-sm">
                    ARG
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 mt-2 uppercase">Modern</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRightLeft className="w-6 h-6 text-gray-600 animate-pulse" />
                  <span className="text-[9px] font-bold text-gray-500 mt-2">SWAP</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40 text-yellow-400 font-bold text-sm shadow-lg">
                    1986
                  </div>
                  <span className="text-[9px] font-bold text-yellow-500 mt-2 uppercase">Legendary</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <footer className="mt-6 border-t border-gray-900 pt-6 pb-6 text-center">
        <p className="text-gray-600 text-sm font-medium">
          Built for World Cup 2026 | Powered by AI Analysis
        </p>
      </footer>
    </div>
  );
};

export default Home;