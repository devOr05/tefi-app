import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, PlusCircle, ShieldAlert, BookOpen, Award, TrendingUp } from 'lucide-react';

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
              className="flex flex-col items-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full gradient-tefi text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-tefi-primary mt-1">Fiar Ahora</span>
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
