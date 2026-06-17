import React from 'react';

const FormGuide = ({ form = ['W', 'D', 'W', 'L', 'W'] }) => {
    const variants = {
        W: 'bg-green-500 text-gray-950',
        D: 'bg-gray-600 text-white',
        L: 'bg-red-500 text-white',
    };

    return (
        <div className="flex gap-1">
            {form.map((result, idx) => (
                <span
                    key={idx}
                    className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${variants[result] || variants.D}`}
                >
                    {result}
                </span>
            ))}
        </div>
    );
};

export default FormGuide;
