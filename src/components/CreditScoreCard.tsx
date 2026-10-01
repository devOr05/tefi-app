import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { ShieldCheck, TrendingUp, Fingerprint, CheckCircle2, AlertCircle } from 'lucide-react';
import { DidVerificationModal } from './DidVerificationModal';

export const CreditScoreCard: React.FC = () => {
  const { customer } = useTefi();
  const [isDidModalOpen, setIsDidModalOpen] = useState(false);

  const availableLimit = Math.max(0, +(customer.maxCreditLimit - customer.currentDebt).toFixed(1));
  const debtPercentage = Math.min(100, Math.round((customer.currentDebt / (customer.maxCreditLimit || 1)) * 100));

  // Color del score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 60) return { label: 'Bueno', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 40) return { label: 'Regular', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Riesgoso', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const badge = getScoreBadge(customer.creditScore);

  return (
    <div className="glass-card rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Score Crediticio On-Chain</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(customer.creditScore)}`}>
              {customer.creditScore}
            </span>
            <span className="text-xs text-gray-400 font-semibold">/ 100 pts</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] text-gray-400 font-medium">Categoría</span>
          <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full mt-0.5">
            Nivel {customer.tier}
          </span>
        </div>
      </div>

      {/* Identidad Digital DID & Reputación Portable */}
      <div className="mt-4 bg-purple-50/70 rounded-2xl p-3 border border-purple-100/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${customer.isDidVerified ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-950">Identidad Única (DID)</span>
                {customer.isDidVerified ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 1 Persona = 1 Cuenta
                  </span>
                ) : (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </div>
              <p className="text-[10px] text-purple-700/90 font-mono truncate max-w-[170px]">
                {customer.isDidVerified ? (customer.didUri || `did:sol:devnet:${customer.walletAddress}`) : 'Sin validar biométricamente'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDidModalOpen(true)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors shrink-0"
          >
            {customer.isDidVerified ? 'Re-escanear' : 'Verificar'}
          </button>
        </div>

        <p className="text-[10px] text-purple-800/80 mt-2 border-t border-purple-100/80 pt-1.5">
          🔒 <strong>Portabilidad Nacional:</strong> Tu historial te acompaña a cualquier almacén del país. No se puede falsificar ni evadir deudas.
        </p>
      </div>

      {/* Límite de Crédito y Deuda Activa */}
      <div className="mt-3.5 bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
          <span>Límite de Fiado Disponible</span>
          <span className="text-emerald-600 font-bold">{availableLimit} USDC</span>
        </div>

        {/* Barra de progreso de deuda */}
        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              debtPercentage > 80 ? 'bg-rose-500' : debtPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${debtPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 font-medium">
          <span>Deuda activa: <strong className="text-gray-700">${customer.currentDebt} USDC</strong></span>
          <span>Límite total: <strong className="text-gray-700">${customer.maxCreditLimit} USDC</strong></span>
        </div>
      </div>

      {/* Dynamic Rule Banner */}
      <div className="mt-3.5 flex items-start gap-2 bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100/80 text-[11px] text-emerald-800">
        <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong>Regla de Confianza:</strong> Cada pago a término aumenta tu score <strong>+5 pts</strong> y expande tu límite de fiado <strong>+$5 USDC</strong>.
        </p>
      </div>

      <DidVerificationModal isOpen={isDidModalOpen} onClose={() => setIsDidModalOpen(false)} />
    </div>
  );
};
