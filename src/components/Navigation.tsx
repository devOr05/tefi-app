import React from 'react';
import { useTefi } from '../context/TefiContext';
import { GoldFiarCoin } from './GoldFiarCoin';

// 1. Icono Almacén con los colores de Solana (Toldo verde esmeralda, puerta violeta, paredes y vitrina blancas/celeste)
export const SolanaStoreIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="storeRoofGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00FFA3" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
      <linearGradient id="storeDoorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    {/* Paredes del almacén en blanco puro con marco sutil */}
    <rect x="3.5" y="9.5" width="17" height="11" rx="1.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
    {/* Toldo / Techo verde Solana ondulado característico de almacén de barrio */}
    <path d="M2 5.5 C2 4.5 3 4 4 4 H20 C21 4 22 4.5 22 5.5 L21 10 C21 10.8 20 11.5 19 11.5 C18 11.5 17.2 10.8 17 10 C16.8 10.8 16 11.5 15 11.5 C14 11.5 13.2 10.8 13 10 C12.8 10.8 12 11.5 11 11.5 C10 11.5 9.2 10.8 9 10 C8.8 10.8 8 11.5 7 11.5 C6 11.5 5 10.8 5 10 L4 5.5" fill="url(#storeRoofGrad)" stroke="#059669" strokeWidth="0.8" />
    {/* Puerta violeta Solana */}
    <rect x="5.5" y="12" width="5.5" height="8.5" rx="1" fill="url(#storeDoorGrad)" stroke="#5B21B6" strokeWidth="0.8" />
    {/* Picaporte blanco */}
    <circle cx="9.6" cy="16" r="0.75" fill="#FFFFFF" />
    {/* Ventana / Vitrina en celeste Solana con marco blanco */}
    <rect x="13" y="12" width="6" height="5.5" rx="1" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.8" />
    {/* Marco divisor de ventana */}
    <path d="M16 12 V17.5 M13 14.7 H19" stroke="#38BDF8" strokeWidth="0.7" />
  </svg>
);

// 2. Icono Libreta con los colores de Solana (tornasolada como la S de Solana, con páginas visibles)
export const SolanaLibretaIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="solanaSpineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00FFA3" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#9945FF" />
      </linearGradient>
      <linearGradient id="solanaPageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F5F3FF" />
        <stop offset="100%" stopColor="#ECFEFF" />
      </linearGradient>
      <linearGradient id="solanaCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14F195" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    {/* Tapa trasera con gradiente Solana tornasolado */}
    <rect x="4.5" y="2.5" width="15.5" height="19" rx="2.5" fill="url(#solanaCoverGrad)" stroke="#7C3AED" strokeWidth="0.8" />
    {/* Páginas interiores tornasoladas */}
    <rect x="7" y="4" width="12" height="16" rx="1.5" fill="url(#solanaPageGrad)" stroke="#E2E8F0" strokeWidth="0.7" />
    {/* Renglones tornasolados de la libreta */}
    <line x1="9.5" y1="7.5" x2="16.5" y2="7.5" stroke="#9945FF" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    <line x1="9.5" y1="10.5" x2="16.5" y2="10.5" stroke="#06B6D4" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
    <line x1="9.5" y1="13.5" x2="15" y2="13.5" stroke="#14F195" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
    <line x1="9.5" y1="16.5" x2="13" y2="16.5" stroke="#8B5CF6" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
    {/* Lomo izquierdo en degradé Solana */}
    <rect x="4" y="2.5" width="3.2" height="19" rx="1.5" fill="url(#solanaSpineGrad)" stroke="#059669" strokeWidth="0.6" />
  </svg>
);

// 3. Icono de 3 Monedas Doradas para Score Crediticio (Proporcionadas y armónicas)
export const GrowingGoldCoinsIcon: React.FC<{ className?: string }> = ({ className = "w-9.5 h-6" }) => (
  <svg viewBox="0 0 34 22" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scoreGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047"/>
        <stop offset="45%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#D97706"/>
      </linearGradient>
      <filter id="scoreCoinShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#78350F" floodOpacity="0.32"/>
      </filter>
    </defs>
    <g filter="url(#scoreCoinShadow)">
      {/* Moneda 1 (Chica - Izquierda, r=4.2) */}
      <circle cx="6" cy="12" r="4.2" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="0.9"/>
      <path d="M6 9.8 V14.2 M3.8 12 H8.2" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6 9.8 V14.2 M3.8 12 H8.2" stroke="#FFFFFF" strokeWidth="1.0" strokeLinecap="round"/>

      {/* Moneda 2 (Mediana - Centro, r=5.8) */}
      <circle cx="15.5" cy="11.5" r="5.8" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="1.0"/>
      <path d="M15.5 8.8 V14.2 M12.8 11.5 H18.2" stroke="#78350F" strokeWidth="2.1" strokeLinecap="round"/>
      <path d="M15.5 8.8 V14.2 M12.8 11.5 H18.2" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Moneda 3 (Grande - Derecha, r=7.8) */}
      <circle cx="26" cy="10.5" r="7.8" fill="url(#scoreGoldGrad)" stroke="#FEF08A" strokeWidth="1.2"/>
      <path d="M26 6.8 V14.2 M22.3 10.5 H29.7" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 6.8 V14.2 M22.3 10.5 H29.7" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round"/>
    </g>
  </svg>
);

// 4. Icono Medalla con Moneda Dorada y Cintas Azul/Violeta (Fidelidad)
export const SolanaLoyaltyMedalIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="medalGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047"/>
        <stop offset="45%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#B45309"/>
      </linearGradient>
      <linearGradient id="medalRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
    {/* Cintas inferiores en azul/violeta Solana */}
    <path d="M8 12 L6 21 L10 18.5 L12 21 L10 14" fill="url(#medalRibbonGrad)" stroke="#4338CA" strokeWidth="0.7" />
    <path d="M16 12 L18 21 L14 18.5 L12 21 L14 14" fill="url(#medalRibbonGrad)" stroke="#4338CA" strokeWidth="0.7" />
    {/* Moneda circular dorada superior */}
    <circle cx="12" cy="8.5" r="7" fill="url(#medalGoldGrad)" stroke="#FEF08A" strokeWidth="1.2"/>
    <circle cx="12" cy="8.5" r="5.6" fill="none" stroke="#78350F" strokeWidth="0.7" strokeDasharray="1.5 1" opacity="0.4"/>
    {/* Símbolo cruz/estrella Tefi en la moneda */}
    <path d="M12 5.5 V11.5 M9 8.5 H15" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 5.5 V11.5 M9 8.5 H15" stroke="#FFFFFF" strokeWidth="1.0" strokeLinecap="round"/>
  </svg>
);

// 5. Icono Escudo en Violeta Solana (Seguro & Riesgo)
export const SolanaShieldIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    {/* Escudo violeta Solana */}
    <path d="M12 2.5 L19.5 5.8 C19.5 12.5 16.5 18.5 12 21.5 C7.5 18.5 4.5 12.5 4.5 5.8 L12 2.5 Z" fill="url(#shieldVioletGrad)" stroke="#C084FC" strokeWidth="1.2" />
    {/* Check interno blanco */}
    <path d="M8.5 11.5 L11 14 L15.5 9.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { role, t } = useTefi();

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/70 dark:border-gray-800 h-13 sm:h-14 shadow-lg flex items-center justify-center"
    >
      <div className="w-full max-w-md px-4 grid grid-cols-3 items-center justify-items-center">
        {role === 'MERCHANT' ? (
          <>
            {/* Columna 1: Almacén */}
            <button
              onClick={() => onTabChange('dashboard')}
              aria-label={t('navStore')}
              className={`flex flex-col items-center justify-center py-0.5 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-tefi-primary dark:text-emerald-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <SolanaStoreIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="text-[9.5px] font-semibold text-center mt-0.5 leading-none">{t('navStore')}</span>
            </button>

            {/* Columna 2: Botón Central Fiar (+) */}
            <button
              onClick={() => onTabChange('new-fiado')}
              aria-label={t('navFiar')}
              className="flex flex-col items-center justify-center -mt-2.5 group cursor-pointer focus:outline-hidden"
            >
              <GoldFiarCoin size="sm" />
              <span className="text-[9.5px] font-black text-amber-700 dark:text-amber-400 mt-0.5 tracking-tight leading-none">{t('navFiar')}</span>
            </button>

            {/* Columna 3: Seguro & Riesgo */}
            <button
              onClick={() => onTabChange('insurance')}
              aria-label={t('navInsurance')}
              className={`flex flex-col items-center justify-center py-0.5 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'insurance'
                  ? 'text-purple-700 dark:text-purple-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <SolanaShieldIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="text-[9.5px] font-semibold text-center leading-none mt-0.5">{t('navInsurance')}</span>
            </button>
          </>
        ) : (
          <>
            {/* Columna 1: Mi Libreta */}
            <button
              onClick={() => onTabChange('libreta')}
              aria-label={t('navLibreta')}
              className={`flex flex-col items-center justify-center py-0.5 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'libreta'
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <SolanaLibretaIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="text-[9.5px] font-semibold text-center mt-0.5 leading-none">{t('navLibreta')}</span>
            </button>

            {/* Columna 2: Score Crediticio */}
            <button
              onClick={() => onTabChange('credit')}
              aria-label={t('navScore')}
              className={`flex flex-col items-center justify-center py-0.5 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'credit'
                  ? 'text-amber-700 dark:text-amber-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <GrowingGoldCoinsIcon className="w-7.5 h-4.5 sm:w-8 sm:h-5" />
              <span className="text-[9.5px] font-bold text-center mt-0.5 leading-none">{t('navScore')}</span>
            </button>

            {/* Columna 3: Fidelidad */}
            <button
              onClick={() => onTabChange('loyalty')}
              aria-label={t('navLoyalty')}
              className={`flex flex-col items-center justify-center py-0.5 transition-all active:scale-95 cursor-pointer ${
                currentTab === 'loyalty'
                  ? 'text-blue-700 dark:text-blue-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <SolanaLoyaltyMedalIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="text-[9.5px] font-semibold text-center mt-0.5 leading-none">{t('navLoyalty')}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
