import React from 'react';

export const LogoSymbol = ({ size = 36, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0px 4px 12px rgba(16, 185, 129, 0.35))' }}
  >
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="furrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Base Shield / Emblem */}
    <rect x="6" y="6" width="88" height="88" rx="26" fill="url(#shieldGrad)" />
    
    {/* Subtle Inner Border */}
    <rect x="8" y="8" width="84" height="84" rx="24" stroke="white" strokeOpacity="0.25" strokeWidth="2" fill="none" />

    {/* Sun / Golden Harvest Arc in Background */}
    <circle cx="50" cy="42" r="18" fill="url(#goldGrad)" opacity="0.9" />

    {/* Agricultural Field Furrows / Surcos Agricolas */}
    <path 
      d="M20 74 C 35 60, 44 48, 50 42 C 56 48, 65 60, 80 74 Z" 
      fill="url(#furrowGrad)" 
    />
    <path 
      d="M32 76 C 42 66, 48 56, 50 48 C 52 56, 58 66, 68 76" 
      stroke="#059669" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
    />
    <line x1="50" y1="46" x2="50" y2="76" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />

    {/* Golden Wheat / Espiga de Trigo Izquierda y Derecha */}
    {/* Espiga Izquierda */}
    <path d="M42 34 Q 38 28 32 30 Q 36 34 42 34 Z" fill="url(#goldGrad)" />
    <path d="M45 27 Q 42 21 36 24 Q 40 28 45 27 Z" fill="url(#goldGrad)" />
    <path d="M48 20 Q 48 14 43 17 Q 46 22 48 20 Z" fill="url(#goldGrad)" />

    {/* Espiga Central / Punta */}
    <path d="M50 12 Q 53 6 50 2 Q 47 6 50 12 Z" fill="url(#goldGrad)" />

    {/* Espiga Derecha */}
    <path d="M58 34 Q 62 28 68 30 Q 64 34 58 34 Z" fill="url(#goldGrad)" />
    <path d="M55 27 Q 58 21 64 24 Q 60 28 55 27 Z" fill="url(#goldGrad)" />
    <path d="M52 20 Q 52 14 57 17 Q 54 22 52 20 Z" fill="url(#goldGrad)" />

    {/* Stem */}
    <path d="M50 14 L 50 40" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const Logo = ({ size = 36, showText = true, subtitle = "Comercial Agrícola", className = "" }) => {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <LogoSymbol size={size} />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ 
            fontSize: '1.05rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#fff'
          }}>
            Mares Cervantes
          </span>
          {subtitle && (
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 600, 
              color: '#34d399', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em' 
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
