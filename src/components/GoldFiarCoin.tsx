import React from 'react';

interface GoldFiarCoinProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GoldFiarCoin: React.FC<GoldFiarCoinProps> = ({ size = 'md', className = '' }) => {
  // Dimensiones idénticas compartidas
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-12 h-12'
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }[size];

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/30 border-2 border-yellow-200/95 active:scale-95 transition-transform flex items-center justify-center relative ${sizeClasses} ${className}`}
    >
      <div className="w-full h-full rounded-full border border-amber-600/30 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 shadow-inner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${iconSizes} stroke-white stroke-[3.5] drop-shadow-[0_1px_2px_rgba(120,53,15,0.6)]`}
        >
          <path d="M12 5 V19 M5 12 H19" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
