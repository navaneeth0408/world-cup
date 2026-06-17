import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`${sizes[size]} border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin`}></div>
        </div>
    );
};

export default LoadingSpinner;
