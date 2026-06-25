import React from 'react';
import * as Cards from 'country-flag-icons/react/3x2';

const Flag = ({ code, className = "", style = {}, circular = false }) => {
    const roundedClass = circular ? "rounded-full" : "rounded-sm";
    const sizeStyle = circular ? { width: '40px', height: '40px', aspectRatio: '1/1' } : { width: '1.5em', height: '1em' };
    const mediaClass = "w-full h-full object-cover";

    if (!code) {
        return (
            <div
                className={`inline-block bg-gray-700 ${roundedClass} ${className}`}
                style={{ ...sizeStyle, height: circular ? '40px' : '1em', ...style }}
            />
        );
    }

    const normalizedCode = code.toUpperCase();

    // Direct CDNs for commonly mismatched flags
    const flagUrls = {
        'ES': 'https://flagcdn.com/es.svg',
        'PT': 'https://flagcdn.com/pt.svg',
        'FR': 'https://flagcdn.com/fr.svg',
        'DE': 'https://flagcdn.com/de.svg'
    };

    if (flagUrls[normalizedCode]) {
        return (
            <div className={`inline-flex items-center justify-center overflow-hidden ${roundedClass} ${className}`} style={{ ...sizeStyle, ...style }}>
                <img 
                    src={flagUrls[normalizedCode]} 
                    alt={`${normalizedCode} Flag`} 
                    className={mediaClass}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    const svgProps = circular ? { preserveAspectRatio: "xMidYMid slice" } : {};

    // Custom flags for England and Scotland
    if (normalizedCode === 'GB-ENG') {
        return (
            <div className={`inline-flex items-center justify-center overflow-hidden ${roundedClass} ${className}`} style={{ ...sizeStyle, border: '1px solid rgba(255,255,255,0.1)', ...style }}>
                <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className={mediaClass} {...svgProps}>
                    <rect width="300" height="200" fill="#fff" />
                    <rect x="135" width="30" height="200" fill="#ce1124" />
                    <rect y="85" width="300" height="30" fill="#ce1124" />
                </svg>
            </div>
        );
    }

    if (normalizedCode === 'GB-SCT') {
        return (
            <div className={`inline-flex items-center justify-center overflow-hidden ${roundedClass} ${className}`} style={{ ...sizeStyle, ...style }}>
                <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={mediaClass} {...svgProps}>
                    <rect width="5" height="3" fill="#005eb8" />
                    <path d="M0,0 L5,3 M5,0 L0,3" stroke="#fff" strokeWidth="0.6" />
                </svg>
            </div>
        );
    }

    const simpleCode = normalizedCode.replace('-', '');
    const FlagComponent = Cards[simpleCode] || Cards[normalizedCode.substring(0, 2)] || null;

    if (!FlagComponent) {
        return (
            <div
                className={`inline-block bg-gray-700 ${roundedClass} ${className}`}
                style={{ ...sizeStyle, height: circular ? '40px' : '1em', ...style }}
                title={code}
            />
        );
    }

    return (
        <div className={`inline-flex items-center justify-center overflow-hidden ${roundedClass} ${className}`} style={{ ...sizeStyle, ...style }}>
            <FlagComponent className={mediaClass} {...svgProps} />
        </div>
    );
};

export default Flag;
