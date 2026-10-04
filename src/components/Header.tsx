import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, User, RefreshCw, Zap, ExternalLink, Coins, Check, Copy } from 'lucide-react';
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
    isAirdropLoading
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-2.5 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="Tefi Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs border border-gray-100 bg-white" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-gray-900">tefi</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-purple-600 text-purple-600" />
                Devnet
              </span>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-full text-xs font-semibold">
          <button
            onClick={() => setRole('MERCHANT')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all duration-200 ${
              role === 'MERCHANT'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Store className="w-3 h-3 text-emerald-600" />
            <span>Almacén</span>
          </button>
          <button
            onClick={() => setRole('CUSTOMER')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all duration-200 ${
              role === 'CUSTOMER'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-3 h-3 text-blue-600" />
            <span>Vecino</span>
          </button>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={resetDemoData}
          title="Reiniciar datos de demo"
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Solana Web3 Identity & Balance Bar */}
      <div className="max-w-md mx-auto mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
        {/* Wallet Address & Copy */}
        <div className="flex items-center gap-1.5 font-mono text-gray-600">
          <span className="text-gray-400 font-sans font-medium">Billetera:</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-purple-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 transition-colors"
            title="Copiar clave pública"
          >
            <span>{activeAddress.slice(0, 4)}...{activeAddress.slice(-4)}</span>
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-gray-400" />}
          </button>
          <a
            href={getSolanaAccountUrl(activeAddress)}
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-purple-600"
            title="Ver en Solana Explorer"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* SOL Balance & Airdrop */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-800">{solanaBalance.toFixed(2)} SOL</span>
          <button
            onClick={handleAirdropClick}
            disabled={isAirdropLoading}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] hover:bg-purple-100 disabled:opacity-50 transition-colors border border-purple-200"
            title="Solicitar 1 SOL gratuito para gas en Devnet"
          >
            <Coins className="w-2.5 h-2.5 text-purple-600" />
            <span>{isAirdropLoading ? 'Airdrop...' : '+1 SOL'}</span>
          </button>
        </div>
      </div>

      {/* Oráculo de Precio en Tiempo Real */}
      <div className="max-w-md mx-auto mt-1 flex items-center justify-between text-[10px] text-gray-500 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100/60">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${exchangeRate.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="font-semibold text-emerald-950">Oráculo en vivo:</span>
          <span className="text-emerald-900 font-bold">1 USDC ≈ ${exchangeRate.rate.toLocaleString('es-AR')} ARS</span>
        </div>
        <span className="text-gray-400">{exchangeRate.source}</span>
      </div>
    </header>
  );
};
