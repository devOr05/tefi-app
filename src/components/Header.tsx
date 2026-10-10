import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { UserRole } from '../types/tefi';
import { Store, User, RefreshCw, Zap, ExternalLink, Check, Copy, Sun, Moon, Type } from 'lucide-react';
import { LanguageSwitch } from './LanguageSwitch';
import { getSolanaAccountUrl, hasRoleKeypair } from '../solana/connection';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    merchant,
    customer,
    resetDevice,
    exchangeRate,
    solanaBalance,
    requestAirdrop,
    isAirdropLoading,
    askConfirm,
    language,
    theme,
    toggleTheme,
    a11yLargeText,
    toggleA11yLargeText,
    t,
    tr
  } = useTefi();

  const [copied, setCopied] = useState(false);
  const [airdropFeedback, setAirdropFeedback] = useState<string | null>(null);
  const activeAddress = role === 'MERCHANT' ? merchant.walletAddress : customer.walletAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Usar el otro rol en este mismo teléfono crea también su clave acá: deja de ser una co-firma entre dos dispositivos
  const handleRoleSwitch = async (next: UserRole) => {
    if (next === role) return;
    const alreadyOnDevice = hasRoleKeypair(next === 'MERCHANT' ? 'merchant' : 'customer');
    if (!alreadyOnDevice) {
      const accepted = await askConfirm({
        title: tr('Use both roles on this device?', '¿Usar los dos roles en este dispositivo?'),
        message: tr(
          'This phone only holds the key of its current role. Using the other role here too puts both keys on one device (single-device demo).',
          'Este teléfono solo tiene la clave de su rol actual. Usar acá también el otro rol deja las dos claves en un mismo dispositivo (demo en un solo dispositivo).'
        ),
        confirmLabel: tr('Continue', 'Continuar')
      });
      if (!accepted) return;
    }
    setRole(next);
  };

  const handleAirdropClick = async () => {
    const res = await requestAirdrop();
    setAirdropFeedback(res.success ? tr('✓ +1 SOL credited on Devnet!', '✓ ¡+1 SOL acreditado en Devnet!') : res.error || null);
    setTimeout(() => setAirdropFeedback(null), 5000);
  };

  const handleReset = async () => {
    const isStore = role === 'MERCHANT';
    const accepted = await askConfirm({
      title: isStore ? tr('Reset this store?', '¿Reiniciar este almacén?') : tr('Reset this neighbor?', '¿Reiniciar este vecino?'),
      message: isStore
        ? tr(
            'It gets a brand-new identity (new key, empty passbook) and its devnet SOL moves to the new key. What is already on-chain stays on-chain under the old key.',
            'Queda con una identidad nueva (clave nueva, libreta vacía) y su SOL de devnet pasa a la clave nueva. Lo que ya está on-chain sigue on-chain bajo la clave anterior.'
          )
        : tr(
            'It gets a brand-new identity (new key, empty passbook, starting score). What is already on-chain stays on-chain under the old key.',
            'Queda con una identidad nueva (clave nueva, libreta vacía, score inicial). Lo que ya está on-chain sigue on-chain bajo la clave anterior.'
          ),
      confirmLabel: tr('Reset', 'Reiniciar'),
      tone: 'danger'
    });
    if (accepted) resetDevice();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-2 sm:px-3.5 py-1.5 sm:py-2 shadow-2xs transition-colors duration-200 w-full overflow-x-hidden">
      {/* Fila Superior: Logo Grande, Selector Almacén/Vecino y Controles Rápidos */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-1 w-full">
        {/* Brand: Logo + Tefi */}
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="/icon.svg"
            alt="Tefi Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-contain shadow-xs border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 shrink-0"
          />
          <div className="flex items-center gap-1">
            <span className="hidden min-[380px]:inline font-black text-base sm:text-lg tracking-tight text-gray-900 dark:text-white leading-none">Tefi</span>
            <span className="hidden sm:inline-flex text-[8.5px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 items-center gap-0.5 leading-tight">
              <Zap className="w-2.5 h-2.5 fill-purple-600 dark:fill-purple-400 text-purple-600 dark:text-purple-400 shrink-0" />
              Devnet
            </span>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-full text-xs font-semibold shrink-0">
          <button
            onClick={() => handleRoleSwitch('MERCHANT')}
            aria-label={t('store')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all duration-200 cursor-pointer ${
              role === 'MERCHANT'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px]">{t('store')}</span>
          </button>
          <button
            onClick={() => handleRoleSwitch('CUSTOMER')}
            aria-label={t('neighbor')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all duration-200 cursor-pointer ${
              role === 'CUSTOMER'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px]">{t('neighbor')}</span>
          </button>
        </div>

        {/* Quick Controls: Idioma, Modo Oscuro / Día, y Accesibilidad */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Idioma: bandera de Argentina (español) y de EE. UU. (inglés) */}
          <LanguageSwitch />

          {/* Switch Modo Oscuro / Día */}
          <button
            onClick={toggleTheme}
            aria-label={t('toggleTheme')}
            title={t('toggleTheme')}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all cursor-pointer border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-2xs"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
          </button>

          {/* A11y: Botón de texto grande para personas con visión reducida */}
          <button
            onClick={toggleA11yLargeText}
            aria-label={t('largeText')}
            title={a11yLargeText ? t('normalText') : t('largeText')}
            className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl active:scale-95 transition-all cursor-pointer border flex items-center justify-center shrink-0 shadow-2xs ${
              a11yLargeText
                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600 font-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fila Secundaria: clave pública de este dispositivo, saldo de SOL, airdrop y reset */}
      <div className="max-w-md mx-auto mt-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[9.5px] sm:text-[11px] gap-1">
        {/* Wallet Address & Copy */}
        <div className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300 shrink min-w-0">
          <span className="text-gray-400 dark:text-gray-500 font-sans font-medium text-[9px] sm:text-[10px]">{t('wallet')}:</span>
          <button
            onClick={handleCopy}
            aria-label={t('copyWallet')}
            className="flex items-center gap-1 hover:text-purple-700 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700 transition-colors cursor-pointer text-[9.5px] sm:text-[10px]"
            title={t('copyWallet')}
          >
            <span>{activeAddress.slice(0, 4)}...{activeAddress.slice(-4)}</span>
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-gray-400" />}
          </button>
          <a
            href={getSolanaAccountUrl(activeAddress)}
            target="_blank"
            rel="noreferrer"
            aria-label={t('viewSolanaExplorer')}
            className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
            title={t('viewSolanaExplorer')}
          >
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </a>
        </div>

        {/* Saldo de SOL: solo el almacén lo necesita, porque paga comisiones y rent */}
        <div className="flex items-center gap-1 shrink-0">
          {role === 'MERCHANT' ? (
            <>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-[9.5px] sm:text-[10px]">{solanaBalance.toFixed(3)} SOL</span>
              <button
                onClick={handleAirdropClick}
                disabled={isAirdropLoading}
                aria-label={t('airdropTitle')}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-50 dark:from-purple-950/60 via-amber-50/50 dark:via-amber-950/40 to-purple-50 dark:to-purple-950/60 text-purple-900 dark:text-purple-200 font-bold text-[9px] sm:text-[10px] hover:from-purple-100 hover:to-amber-100 disabled:opacity-50 transition-all border border-purple-200/90 dark:border-purple-800 shadow-2xs cursor-pointer"
                title={t('airdropTitle')}
              >
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[7.5px] sm:text-[8px] font-black leading-none shadow-2xs">+</span>
                <span>{isAirdropLoading ? '...' : '1 SOL'}</span>
              </button>
            </>
          ) : (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[9px] sm:text-[10px]">
              {tr('No SOL needed · the store pays the fees', 'Sin SOL · las comisiones las paga el almacén')}
            </span>
          )}

          {/* Reset del dispositivo */}
          <button
            onClick={handleReset}
            aria-label={t('resetDemo')}
            title={t('resetDemo')}
            className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>

      {/* Feedback de Airdrop / Faucet */}
      {airdropFeedback && (
        <div className="max-w-md mx-auto mt-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[9px] sm:text-[10px] flex items-center justify-between gap-1 shadow-2xs">
          <span className="font-medium leading-tight">{airdropFeedback}</span>
          <button
            onClick={() => setAirdropFeedback(null)}
            className="text-amber-700 dark:text-amber-400 font-bold px-1 hover:text-amber-950 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Cotización ARS/USDC consultada a dolarapi.com */}
      <div className="max-w-md mx-auto mt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40 overflow-hidden">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${exchangeRate.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="font-semibold text-emerald-950 dark:text-emerald-300 shrink-0">{t('liveOracle')}:</span>
          <span className="text-emerald-900 dark:text-emerald-200 font-bold truncate">1 USDC ≈ ${exchangeRate.rate.toLocaleString(language === 'en' ? 'en-US' : 'es-AR')} ARS</span>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-[8.5px] sm:text-[9.5px] shrink-0 pl-1">{exchangeRate.source}</span>
      </div>
    </header>
  );
};
