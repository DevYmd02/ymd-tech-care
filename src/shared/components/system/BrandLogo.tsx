import React from 'react';

interface BrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * BrandLogo - High-fidelity SVG recreation of YOUNGMEEDEE FUTURE GROUP logo.
 * Uses pure SVG paths and modern typography for maximum clarity.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
    // Scaling logic
    const sizeMap = {
        sm: 'h-12',
        md: 'h-16',
        lg: 'h-24',
        xl: 'h-32'
    };

    return (
        <div className={`flex flex-col items-center select-none ${sizeMap[size]} ${className}`}>
            <svg 
                viewBox="0 0 400 120" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-2xl"
            >
                {/* YOUNGMEEDEE Text */}
                <g className="font-sans font-black italic">
                    <text x="50%" y="45" textAnchor="middle" fontSize="52" className="fill-[#0054A6] dark:fill-blue-500">
                        YOUNG
                        <tspan className="fill-[#ED1C24] dark:fill-red-500">MEEDEE</tspan>
                    </text>
                </g>

                {/* V-Wing Path */}
                <path 
                    d="M20 55 L190 65 L200 85 L210 65 L380 55 L190 70 Z" 
                    fill="url(#wingGradient)" 
                    className="opacity-90"
                />
                
                {/* Modernized V-Wing with two parts for colors */}
                <path 
                    d="M20 55 L200 85 L200 75 L20 62 Z" 
                    fill="#0054A6" 
                    className="dark:fill-blue-600 drop-shadow-lg"
                />
                <path 
                    d="M380 55 L200 85 L200 75 L380 62 Z" 
                    fill="#ED1C24" 
                    className="dark:fill-red-600 drop-shadow-lg"
                />

                {/* TECH CARE Text */}
                <text 
                    x="50%" 
                    y="105" 
                    textAnchor="middle" 
                    fontSize="28" 
                    letterSpacing="12" 
                    className="fill-[#0054A6] dark:fill-blue-400 font-bold uppercase"
                >
                    TECH CARE
                </text>

                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
        </div>
    );
};
