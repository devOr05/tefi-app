import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, Plus, ShieldAlert, BookOpen, Award, TrendingUp } from 'lucide-react';

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
              <span className="text-[10px] font-black text-amber-700 mt-1 tracking-tight">Fiar Ahora</span>
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
              <TrendingUp className="w-5 h-5" />
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
