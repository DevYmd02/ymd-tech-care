import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium YMD Logo - High Fidelity Squircle & Custom Typography
 * @description ออกแบบใหม่โดยเน้นความสมบูรณ์แบบของสัดส่วน (Golden Ratio & Squircle)
 */
export const Logo: React.FC<LogoProps> = ({ 
  className = '',
  size = 'md'
}) => {
  const sizeMap = {
    sm: { box: 32, totalWidth: 140 },
    md: { box: 44, totalWidth: 190 },
    lg: { box: 56, totalWidth: 240 },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center space-x-4 group cursor-pointer ${className} select-none`}>
      {/* ---------- SQUIRCLE ICON ---------- */}
      <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-[2deg]">
        {/* Outer Glow / Shadow */}
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <svg 
          width={currentSize.box} 
          height={currentSize.box} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          {/* iOS-Style Squircle Path (Super-ellipse approximation) */}
          <path 
            d="M0,33.3 C0,5.9 5.9,0 33.3,0 H66.7 C94.1,0 100,5.9 100,33.3 V66.7 C100,94.1 94.1,100 66.7,100 H33.3 C5.9,100 0,94.1 0,66.7 Z" 
            fill="white"
          />
          
          {/* YMD Custom Typography with Dual-Color Gradient */}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="url(#ymd_split_gradient)"
            style={{ 
              fontFamily: 'Prompt, sans-serif',
              fontWeight: 900,
              fontSize: '38px',
              letterSpacing: '-2px',
              filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))'
            }}
          >
            YMD
          </text>

          <defs>
            <linearGradient id="ymd_split_gradient" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0055A4" />
              <stop offset="52%" stopColor="#0055A4" />
              <stop offset="52.1%" stopColor="#DA251D" />
              <stop offset="100%" stopColor="#DA251D" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* ---------- BRAND TEXT ---------- */}
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center">
          <span className="text-white font-extrabold text-base tracking-tight leading-none">
            YMD Tech Care
          </span>
        </div>
        <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-100/60 text-[10px] font-semibold tracking-wider uppercase">
                Enterprise ERP v1.0
            </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
