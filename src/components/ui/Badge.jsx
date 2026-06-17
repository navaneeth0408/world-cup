import React from 'react';

const Badge = ({ children, variant = 'gray', className = '' }) => {
    const variants = {
        green: 'bg-green-500/20 text-green-400 border-green-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        gray: 'bg-gray-700/50 text-gray-400 border-gray-600',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
