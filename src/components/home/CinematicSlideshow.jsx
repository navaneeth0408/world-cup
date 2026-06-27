import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const CinematicSlideshow = ({ categories }) => {
    const [activeTab, setActiveTab] = useState(categories[0]?.id || 'lastdance');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get active category configuration
    const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
    const {
        badge,
        titleMain,
        titleAccent,
        subhead,
        players = [],
        accentColor = '#f5c518',
        labelColor = '#00ff87'
    } = currentCategory;

    // Reset slide index to 0 when switching tabs
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setCurrentIndex(0);
    };

    const nextSlide = useCallback(() => {
        if (players.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % players.length);
        }
    }, [players.length]);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [isPaused, nextSlide]);

    const currentPlayer = players[currentIndex];

    // Swipe gestures state and handlers
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            // Next slide
            setCurrentIndex((prev) => (prev + 1) % players.length);
        } else if (isRightSwipe) {
            // Prev slide
            setCurrentIndex((prev) => (prev - 1 + players.length) % players.length);
        }

        // Reset
        setTouchStart(0);
        setTouchEnd(0);
    };

    if (!currentPlayer) return null;

    return (
        <div 
            className="w-full mb-16"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Tab Toggles Header */}
            <div className="w-full mb-8 flex justify-start md:justify-center overflow-x-auto no-scrollbar py-2 px-4 relative z-30">
                <div className="flex gap-2 mx-auto whitespace-nowrap">
                    {categories.map((category) => {
                        const isActive = activeTab === category.id;
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleTabChange(category.id)}
                                className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer border"
                                style={
                                    isActive
                                        ? { 
                                            backgroundColor: '#22c55e', 
                                            color: '#0a0a0a', 
                                            borderColor: '#22c55e'
                                          }
                                        : { 
                                            backgroundColor: 'transparent', 
                                            color: '#94a3b8', 
                                            borderColor: 'rgba(255,255,255,0.15)'
                                          }
                                }
                            >
                                {category.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Slideshow Viewport Card */}
            <div 
                className="relative w-full h-[580px] overflow-hidden bg-[#0a0a0a] rounded-3xl border border-gray-900 shadow-2xl"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Foreground Image Layer spanning the entire width */}
                <div className="absolute inset-0 w-full h-full overflow-hidden z-10">
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={`${activeTab}-${currentIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {currentPlayer.image ? (
                                <motion.img
                                    src={isMobile && currentPlayer.mobileImage ? currentPlayer.mobileImage : currentPlayer.image}
                                    alt={currentPlayer.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center"
                                    animate={{
                                        scale: [1.02, 1.08]
                                    }}
                                    transition={{
                                        duration: 12,
                                        ease: "linear"
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                                    <span className="text-8xl opacity-20">{currentPlayer.flag}</span>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Left side dark gradient overlay for text readability (desktop) */}
                <div 
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{
                        background: 'linear-gradient(to right, rgba(10, 10, 20, 0.85) 0%, rgba(10, 10, 20, 0.4) 40%, transparent 65%)',
                        zIndex: 15
                    }}
                />
                
                {/* Bottom dark gradient overlay for text readability (mobile) */}
                <div 
                    className="absolute inset-0 pointer-events-none block md:hidden"
                    style={{
                        background: 'linear-gradient(to top, rgba(10, 10, 20, 0.95) 0%, rgba(10, 10, 20, 0.4) 50%, transparent 100%)',
                        zIndex: 15
                    }}
                />

                {/* Text Zone */}
                <div className="absolute inset-0 z-20 px-6 md:px-12 pb-16 md:pb-0 flex items-end md:items-center pointer-events-none">
                    <div className="w-full md:max-w-[42%] pointer-events-auto">
                        <motion.p
                            key={`badge-${activeTab}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4 hidden md:block"
                            style={{ color: labelColor }}
                        >
                            {badge}
                        </motion.p>
     
                        <h2 className="flex flex-col gap-0 mb-8 leading-none hidden md:flex">
                            <span className="text-white font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter uppercase whitespace-normal break-words leading-none">
                                {titleMain}
                            </span>
                            <span
                                className="font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter uppercase whitespace-normal break-words leading-none"
                                style={{ color: accentColor }}
                            >
                                {titleAccent}
                            </span>
                        </h2>

                        {subhead && (
                            <p className="text-gray-300/90 text-xs md:text-sm font-semibold max-w-sm mb-6 leading-relaxed hidden md:block">
                                {subhead}
                            </p>
                        )}
     
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeTab}-${currentIndex}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <span className="inline-block md:hidden text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded mb-3" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                                    {badge || 'FEATURED'}
                                </span>
                                <h3 className="text-white text-3xl md:text-3xl font-black italic uppercase tracking-tight mb-1">
                                    {currentPlayer.name}
                                </h3>
                                <p className="text-gray-300 text-sm md:text-base font-semibold mb-4 flex items-center gap-1.5">
                                    <span>{currentPlayer.flag}</span>
                                    <span>{currentPlayer.country}</span>
                                    {currentPlayer.club && (
                                        <>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-gray-400">{currentPlayer.club}</span>
                                        </>
                                    )}
                                </p>
                                <Button
                                    variant="primary"
                                    className="flex items-center gap-1.5 px-5 py-2.5 font-black text-[10px] uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md border-none"
                                    style={{ backgroundColor: accentColor, color: '#090d16' }}
                                    onClick={() => navigate(`/player/${currentPlayer.id}`)}
                                >
                                    Read Profile
                                </Button>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
                    {players.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className="group relative p-2 border-none bg-transparent cursor-pointer"
                        >
                            <div
                                className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${currentIndex === index ? 'scale-125' : 'scale-100 hover:scale-110'
                                    }`}
                                style={{
                                    borderColor: accentColor,
                                    backgroundColor: currentIndex === index ? accentColor : 'transparent'
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CinematicSlideshow;
