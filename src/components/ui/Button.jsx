import React from 'react';

const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false, type = 'button' }) => {
    const variants = {
        primary: 'bg-green-500 hover:bg-green-600 text-gray-950 font-bold',
        secondary: 'bg-transparent border border-gray-700 hover:border-gray-500 text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
        dark: 'bg-gray-950 hover:bg-black text-white border border-gray-800 font-bold',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
