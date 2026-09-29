import React from 'react';
import { useTefi } from '../context/TefiContext';
import { ShieldCheck, ShieldAlert, TrendingUp, Info, Activity, Lock, ExternalLink } from 'lucide-react';
import { INSURANCE_VAULT_PDA, getSolanaExplorerUrl } from '../solana/connection';

export const InsurancePoolView: React.FC = () => {
  const { insurancePool, merchant } = useTefi();

  return (
    <div className="space-y-4 pb-20">
      {/* Header del Pool */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-purple-200">
            Smart Contract PDA en Solana
          </span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Reserva Activa</span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-xs text-purple-200">Fondo Común de Garantía (Insurance Vault)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold tracking-tight">${insurancePool.totalBalanceUsdc.toLocaleString('es-AR')}</span>
            <span className="text-sm font-semibold text-purple-300">USDC</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-purple-800/60 text-xs">
          <div>
            <span className="text-[10px] text-purple-300 block">Siniestros Pagados</span>
            <span className="font-bold text-emerald-300">${insurancePool.totalClaimsPaidUsdc} USDC</span>
          </div>
          <div>
            <span className="text-[10px] text-purple-300 block">Comercios Asegurados</span>
            <span className="font-bold text-white">{insurancePool.totalActivePolicies} locales</span>
          </div>
        </div>
      </div>

      {/* Explicación del Modelo de Riesgo Dinámico */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Modelo Actuarial Dinámico</h3>
            <p className="text-[10px] text-gray-400">Diseñado para evitar fraude y selección adversa</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Para que el fondo sea sustentable, cada comercio paga una prima proporcional a su comportamiento crediticio histórico:
        </p>

        {/* Tarjeta de Tasa Actual */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Tasa Base del Protocolo:</span>
            <span className="font-bold text-gray-800">{merchant.baseInsuranceFee}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Mora histórica de tu comercio:</span>
            <span className={`font-bold ${merchant.defaultRate > 5 ? 'text-rose-600' : 'text-gray-800'}`}>
              {merchant.defaultRate}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-800">Tu Prima de Seguro Actual:</span>
            <span className="text-sm font-extrabold text-purple-700">{merchant.currentInsuranceFee}%</span>
          </div>
        </div>

        <div className="p-3 bg-purple-50/80 rounded-2xl text-[11px] text-purple-900 border border-purple-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Incentivo Alineado:</strong> Si un comerciante fía a clientes irresponsables y ejecuta el seguro repetidamente, su prima sube automáticamente hasta un 12%. Si cuida a quién fía, su tasa se mantiene en 2.5%.
          </p>
        </div>
      </div>

      {/* Datos del Smart Contract on Solana */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-gray-700 font-bold">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Bóveda On-Chain en Solana</span>
        </div>
        <p className="text-[11px] text-gray-400">
          Los fondos están bloqueados en una PDA sin custodia humana. Los retiros solo se autorizan cuando un fiado supera los 30 días de mora.
        </p>
        <div className="p-2.5 bg-gray-50 rounded-xl font-mono text-[10px] text-gray-500 break-all border border-gray-100 flex items-center justify-between">
          <span>PDA: {INSURANCE_VAULT_PDA}</span>
        </div>
      </div>
    </div>
  );
};
