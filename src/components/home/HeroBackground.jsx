import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import all images in the wc-winners directory
const imagesGlob = import.meta.glob('../../assets/wc-winners/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP}', { eager: true });
const images = Object.values(imagesGlob).map(mod => mod.default);

const HeroBackground = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Background Images */}
            <AnimatePresence>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src={images[currentIndex]}
                        alt="World Cup Winning Moment"
                        className="w-full h-full object-cover object-[center_top]"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Overlays */}
            <div className="absolute inset-0 flex flex-col">
                {/* Base dark layer */}
                <div className="absolute inset-0 bg-black/20" />

                {/* Linear Gradient Overlay (Left to Right) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/15" />

                {/* Green tint overlay */}
                <div className="absolute inset-0 bg-[rgba(0,30,15,0.08)]" />
            </div>

            {/* Fade Gradients */}
            {/* Top Fade */}
            <div
                className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none z-[2]"
                style={{ background: 'linear-gradient(to top, transparent, #030712)' }}
            />

            {/* Bottom Fade */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[180px] pointer-events-none z-[2]"
                style={{ background: 'linear-gradient(to bottom, transparent, #030712)' }}
            />
        </div>
    );
};

export default HeroBackground;
