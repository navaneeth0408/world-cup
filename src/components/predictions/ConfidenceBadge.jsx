import React from 'react';
import Badge from '../ui/Badge';

const ConfidenceBadge = ({ level = 'Medium' }) => {
    const variants = {
        High: 'green',
        Medium: 'yellow',
        Low: 'red',
    };

    return (
        <div className="flex flex-col items-start">
            <span className="text-[8px] text-gray-500 uppercase font-black mb-0.5">Confidence</span>
            <Badge variant={variants[level] || 'gray'}>
                {level.toUpperCase()}
            </Badge>
        </div>
    );
};

export default ConfidenceBadge;
