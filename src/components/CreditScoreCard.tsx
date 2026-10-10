import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { useTefi } from '../context/TefiContext';
import { TrendingUp, Fingerprint, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { getSolanaAccountUrl } from '../solana/connection';
import { getCustomerProfilePda } from '../solana/program';

export const CreditScoreCard: React.FC = () => {
  const { customer, language, tr } = useTefi();

  const availableLimit = Math.max(0, +(customer.maxCreditLimit - customer.currentDebt).toFixed(1));
  const debtPercentage = Math.min(100, Math.round((customer.currentDebt / (customer.maxCreditLimit || 1)) * 100));
  // La cuenta que lee un prestamista: el CustomerProfile PDA derivado de la clave pública del vecino
  const profilePda = customer.walletAddress ? getCustomerProfilePda(new PublicKey(customer.walletAddress)).toBase58() : '';

  // Color del score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: language === 'en' ? 'Excellent' : 'Excelente', bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (score >= 60) return { label: language === 'en' ? 'Good' : 'Bueno', bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    if (score >= 40) return { label: language === 'en' ? 'Fair' : 'Regular', bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    return { label: language === 'en' ? 'Risky' : 'Riesgoso', bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
  };

  const badge = getScoreBadge(customer.creditScore);

  return (
    <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {language === 'en' ? 'On-Chain Credit Score' : 'Score Crediticio On-Chain'}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(customer.creditScore)}`}>
              {customer.creditScore}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">/ 100 pts</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            {language === 'en' ? 'Category' : 'Categoría'}
          </span>
          <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300 bg-gradient-to-r from-amber-100 dark:from-amber-950/80 via-amber-50 dark:via-amber-900/40 to-amber-100 dark:to-amber-950/80 border border-amber-300/80 dark:border-amber-700/60 px-2.5 py-0.5 rounded-full mt-0.5 flex items-center gap-1 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {language === 'en' ? 'Tier' : 'Nivel'} {customer.tier}
          </span>
        </div>
      </div>

      {/* Cuenta on-chain que respalda el score */}
      <div className="mt-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl p-3 border border-purple-100/90 dark:border-purple-800/40 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-purple-600 text-white shadow-xs">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 leading-tight">
                  CustomerProfile PDA · Solana Devnet
                </span>
                {customer.hasOnChainProfile && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-mono truncate">
                {profilePda}
              </p>
            </div>
          </div>

          <a
            href={getSolanaAccountUrl(profilePda)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-[10px] text-purple-800/80 dark:text-purple-300/80 border-t border-purple-100/80 dark:border-purple-800/40 pt-1.5 leading-snug">
          {customer.hasOnChainProfile ? (
            <>
              🔒 <strong>{tr('Portable history:', 'Historial portable:')}</strong>{' '}
              {tr(
                'score, limit and repayments on this screen are read from this account. Any lender can read the same account without asking Tefi.',
                'el score, el límite y los repagos de esta pantalla se leen de esta cuenta. Cualquier prestamista puede leer la misma cuenta sin pedirle nada a Tefi.'
              )}
            </>
          ) : (
            tr(
              'This account does not exist yet. It is created with your first fiado (rent paid by the store) with the starting values shown here: score 65 and a 50 USDC limit.',
              'Esta cuenta todavía no existe. Se crea con tu primer fiado (rent a cargo del almacén) con los valores iniciales que ves acá: score 65 y límite de 50 USDC.'
            )
          )}
        </p>
      </div>

      {/* Límite de Crédito y Consumos Activos */}
      <div className="mt-3.5 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
          <span>{language === 'en' ? 'Available Credit Limit' : 'Límite de Fiado Disponible'}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{availableLimit} USDC</span>
        </div>

        {/* Barra de progreso de consumo */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              debtPercentage > 80 ? 'bg-rose-500' : debtPercentage > 50 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${debtPercentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400 dark:text-gray-500">
          <span>{language === 'en' ? 'Used:' : 'Consumido:'} ${customer.currentDebt.toFixed(2)} USDC</span>
          <span>{language === 'en' ? 'Total approved limit:' : 'Límite total:'} ${customer.maxCreditLimit.toFixed(2)} USDC</span>
        </div>
      </div>

      {/* Totales acumulados en el perfil on-chain */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/60 dark:bg-gray-800/40">
          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
              {language === 'en' ? 'Repaid to date' : 'Saldado histórico'}
            </span>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">${customer.totalRepaid.toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/60 dark:bg-gray-800/40">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
              {tr('Loyalty points', 'Puntos de lealtad')}
            </span>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{customer.loyaltyPoints} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
