import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, User, RefreshCw, Zap, ExternalLink, Check, Copy, Sun, Moon, Type } from 'lucide-react';
import { getSolanaAccountUrl } from '../solana/connection';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    merchant,
    customer,
    resetDemoData,
    exchangeRate,
    solanaBalance,
    requestAirdrop,
    isAirdropLoading,
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    a11yLargeText,
    toggleA11yLargeText,
    t
  } = useTefi();

  const [copied, setCopied] = useState(false);
  const activeAddress = role === 'MERCHANT' ? merchant.walletAddress : customer.walletAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdropClick = async () => {
    await requestAirdrop();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-2.5 shadow-2xs transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/icon.svg"
            alt="Tefi Logo"
            className="w-8 h-8 rounded-xl object-contain shadow-xs border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">tefi</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-purple-600 dark:fill-purple-400 text-purple-600 dark:text-purple-400" />
                Devnet
              </span>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-full text-xs font-semibold shrink-0">
          <button
            onClick={() => setRole('MERCHANT')}
            aria-label={t('store')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              role === 'MERCHANT'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">{t('store')}</span>
          </button>
          <button
            onClick={() => setRole('CUSTOMER')}
            aria-label={t('neighbor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              role === 'CUSTOMER'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px]">{t('neighbor')}</span>
          </button>
        </div>

        {/* Quick Controls: Idioma, Tema Día/Noche, A11y, Reset */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Switch Idioma ES / EN */}
          <button
            onClick={toggleLanguage}
            aria-label={t('toggleLang')}
            title={t('toggleLang')}
            className="px-2 py-1 text-[10px] font-black rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700 touch-target-accessible flex items-center justify-center"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Switch Modo Oscuro / Día */}
          <button
            onClick={toggleTheme}
            aria-label={t('toggleTheme')}
            title={t('toggleTheme')}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700 touch-target-accessible flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* A11y: Botón de texto grande para personas con visión reducida */}
          <button
            onClick={toggleA11yLargeText}
            aria-label={t('largeText')}
            title={a11yLargeText ? t('normalText') : t('largeText')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border touch-target-accessible flex items-center justify-center ${
              a11yLargeText
                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600 font-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={resetDemoData}
            aria-label={t('resetDemo')}
            title={t('resetDemo')}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors cursor-pointer touch-target-accessible flex items-center justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Solana Web3 Identity & Balance Bar */}
      <div className="max-w-md mx-auto mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
        {/* Wallet Address & Copy */}
        <div className="flex items-center gap-1.5 font-mono text-gray-600 dark:text-gray-300">
          <span className="text-gray-400 dark:text-gray-500 font-sans font-medium">{t('wallet')}:</span>
          <button
            onClick={handleCopy}
            aria-label={t('copyWallet')}
            className="flex items-center gap-1 hover:text-purple-700 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700 transition-colors cursor-pointer"
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
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* SOL Balance & Airdrop */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-800 dark:text-gray-200">{solanaBalance.toFixed(2)} SOL</span>
          <button
            onClick={handleAirdropClick}
            disabled={isAirdropLoading}
            aria-label={t('airdropTitle')}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-50 dark:from-purple-950/60 via-amber-50/50 dark:via-amber-950/40 to-purple-50 dark:to-purple-950/60 text-purple-900 dark:text-purple-200 font-bold text-[10px] hover:from-purple-100 hover:to-amber-100 disabled:opacity-50 transition-all border border-purple-200/90 dark:border-purple-800 shadow-2xs cursor-pointer touch-target-accessible"
            title={t('airdropTitle')}
          >
            <span className="w-3 h-3 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[8px] font-black leading-none shadow-2xs">+</span>
            <span>{isAirdropLoading ? 'Airdrop...' : '1 SOL'}</span>
          </button>
        </div>
      </div>

      {/* Oráculo de Precio en Tiempo Real */}
      <div className="max-w-md mx-auto mt-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${exchangeRate.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="font-semibold text-emerald-950 dark:text-emerald-300">{t('liveOracle')}:</span>
          <span className="text-emerald-900 dark:text-emerald-200 font-bold">1 USDC ≈ ${exchangeRate.rate.toLocaleString(language === 'en' ? 'en-US' : 'es-AR')} ARS</span>
        </div>
        <span className="text-gray-400 dark:text-gray-500">{exchangeRate.source}</span>
      </div>
    </header>
  );
};
