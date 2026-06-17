import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-gray-900 rounded-xl border border-gray-700 p-6 transition-all duration-300 hover:border-green-500/50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
