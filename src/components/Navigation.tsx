import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, Plus, ShieldAlert, BookOpen, Award } from 'lucide-react';

// Icono de 3 monedas doradas amarillas en la misma línea creciendo de menor a mayor (Score & Límite)
const GrowingGoldCoinsIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-5" }) => (
  <svg viewBox="0 0 28 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scoreGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE047"/>
        <stop offset="45%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
      <filter id="scoreCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#78350F" flood-opacity="0.30"/>
      </filter>
    </defs>
    <g filter="url(#scoreCoinShadow)">
      {/* Moneda 1 (Chica - Izquierda) */}
      <circle cx="5" cy="10" r="3.4" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="0.8"/>
      <path d="M5 8.3V11.7 M3.3 10H6.7" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M5 8.3V11.7 M3.3 10H6.7" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round"/>

      {/* Moneda 2 (Mediana - Centro) */}
      <circle cx="12.5" cy="10" r="4.8" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="0.9"/>
      <path d="M12.5 7.8V12.2 M10.3 10H14.7" stroke="#78350F" strokeWidth="1.9" strokeLinecap="round"/>
      <path d="M12.5 7.8V12.2 M10.3 10H14.7" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round"/>

      {/* Moneda 3 (Grande - Derecha) */}
      <circle cx="21" cy="10" r="6.6" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="1.0"/>
      <path d="M21 7.0V13.0 M18.0 10H24.0" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M21 7.0V13.0 M18.0 10H24.0" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round"/>
    </g>
  </svg>
);

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { role } = useTefi();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 py-2 px-6 shadow-lg safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {role === 'MERCHANT' ? (
          <>
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                currentTab === 'dashboard' ? 'text-tefi-primary font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="text-[10px]">Almacén</span>
            </button>

            <button
              onClick={() => onTabChange('new-fiado')}
              className="flex flex-col items-center -mt-5 group"
            >
              {/* Moneda Dorada con Signo Más (+) */}
              <div className="w-13 h-13 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/35 border-2 border-yellow-200/90 active:scale-95 transition-all flex items-center justify-center relative">
                <div className="w-full h-full rounded-full border border-amber-600/30 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 shadow-inner">
                  <Plus className="w-7 h-7 text-white stroke-[3.5] drop-shadow-[0_1px_2px_rgba(120,53,15,0.6)]" />
                </div>
              </div>
              <span className="text-[10px] font-black text-amber-700 mt-1 tracking-tight">Fiar</span>
            </button>

            <button
              onClick={() => onTabChange('insurance')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                currentTab === 'insurance' ? 'text-tefi-primary font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px]">Seguro & Riesgo</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTabChange('libreta')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                currentTab === 'libreta' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px]">Mi Libreta</span>
            </button>

            <button
              onClick={() => onTabChange('credit')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                currentTab === 'credit' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <GrowingGoldCoinsIcon className="w-7 h-5" />
              <span className="text-[10px]">Score & Límite</span>
            </button>

            <button
              onClick={() => onTabChange('loyalty')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                currentTab === 'loyalty' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px]">Fidelidad</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
