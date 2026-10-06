import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldOff, 
  TrendingUp, 
  Info, 
  Activity, 
  Lock, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Check, 
  Sparkles, 
  Award,
  Zap,
  Building2
} from 'lucide-react';
import { INSURANCE_VAULT_PDA, getSolanaExplorerUrl } from '../solana/connection';
import { JoinStoreModal } from '../components/JoinStoreModal';

type InsurancePlan = 'FREE' | 'STANDAR' | 'ORO';

export const InsurancePoolView: React.FC = () => {
  const { insurancePool, merchant, language, t } = useTefi();
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan>('ORO');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [justChangedPlan, setJustChangedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: InsurancePlan) => {
    setSelectedPlan(plan);
    setJustChangedPlan(plan);
    setTimeout(() => setJustChangedPlan(null), 3000);
    setIsSubscriptionModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header del Pool */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
            {language === 'en' ? 'Roadmap · Decentralized Mutual Fund' : 'Roadmap · Fondo Mutual Descentralizado'}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('insuranceStatusOk')}</span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-xs text-purple-200">{t('insuranceVaultTitle')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold tracking-tight">${insurancePool.totalBalanceUsdc.toLocaleString('es-AR')}</span>
            <span className="text-sm font-semibold text-purple-300">USDC</span>
          </div>
        </div>

        {/* Banner de Póliza Activa y Botón Ver Suscripciones */}
        <div className="mt-3.5 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-inner ${
              selectedPlan === 'ORO' 
                ? 'bg-amber-500/25 border border-amber-400/30 text-amber-300' 
                : selectedPlan === 'STANDAR'
                ? 'bg-blue-500/25 border border-blue-400/30 text-blue-300'
                : 'bg-gray-500/25 border border-gray-400/30 text-gray-300'
            }`}>
              {selectedPlan === 'ORO' ? (
                <Award className="w-4 h-4 text-amber-300" />
              ) : selectedPlan === 'STANDAR' ? (
                <ShieldCheck className="w-4 h-4 text-blue-300" />
              ) : (
                <ShieldOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedPlan === 'ORO' && (language === 'en' ? 'Gold Option (Full Coverage)' : 'Opción Oro (Cobertura Completa)')}
                {selectedPlan === 'STANDAR' && (language === 'en' ? 'Standard Option (Minimum)' : 'Opción Estándar (Mínimo)')}
                {selectedPlan === 'FREE' && (language === 'en' ? 'Free Version (No Insurance)' : 'Versión Free (Sin Seguro)')}
              </span>
              <span className="text-[10px] text-purple-200">
                {selectedPlan === 'ORO' && (language === 'en' ? '100% of credits insured against default' : '100% de fiados asegurados ante impagos')}
                {selectedPlan === 'STANDAR' && (language === 'en' ? '60% risk coverage on Solana' : '60% de cobertura de riesgo en Solana')}
                {selectedPlan === 'FREE' && (language === 'en' ? 'No coverage. You assume 100% of the risk' : 'Sin cobertura. Asumes el 100% del riesgo')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="text-[10px] font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
          >
            <span>{t('viewInsurancesBtn')}</span>
            <ChevronRight className="w-3 h-3 text-purple-200" />
          </button>
        </div>

        {justChangedPlan && (
          <div className="mt-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 rounded-lg px-2 py-1 text-center animate-in fade-in">
            ✓ {language === 'en' ? 'Insurance successfully updated to' : 'Seguro actualizado con éxito a'} {justChangedPlan}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-purple-800/60 text-xs">
          <div>
            <span className="text-[10px] text-purple-300 block">
              {language === 'en' ? 'Claims Paid' : 'Siniestros Pagados'}
            </span>
            <span className="font-bold text-emerald-300">${insurancePool.totalClaimsPaidUsdc} USDC</span>
          </div>
          <div>
            <span className="text-[10px] text-purple-300 block">
              {language === 'en' ? 'Insured Stores' : 'Comercios Asegurados'}
            </span>
            <span className="font-bold text-white">
              {insurancePool.totalActivePolicies} {language === 'en' ? 'stores' : 'locales'}
            </span>
          </div>
        </div>
      </div>

      {/* Sumá tu Almacén a la Red Solana (Adhesión Free) */}
      <div className="bg-emerald-50/90 dark:bg-emerald-950/40 rounded-3xl p-4 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
              {language === 'en' ? 'Free Store Onboarding' : 'Adhesión Gratuita de Comercios'}
            </h4>
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300">
              {language === 'en' ? 'Join the Solana network at 0% fee with our Free Plan.' : 'Sumá tu comercio a Solana al 0% de costo con el Plan Free.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsJoinModalOpen(true)}
          className="text-[10.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-all"
        >
          {language === 'en' ? 'Join Free' : 'Sumarse Free'}
        </button>
      </div>

      {/* Explicación del Modelo de Riesgo Dinámico */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800">{t('solanaActuarialTitle')}</h3>
            <p className="text-[10px] text-gray-400">
              {language === 'en' ? 'Actuarial risk management model' : 'Modelo actuarial de gestión de riesgo'}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          {language === 'en'
            ? 'For the fund to remain sustainable, each store pays a premium proportional to its historical credit performance:'
            : 'Para que el fondo sea sustentable, cada comercio paga una prima proporcional a su comportamiento crediticio histórico:'}
        </p>

        {/* Tarjeta de Tasa Actual */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">
              {language === 'en' ? 'Protocol Base Rate:' : 'Tasa Base del Protocolo:'}
            </span>
            <span className="font-bold text-gray-800">{merchant.baseInsuranceFee}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">
              {language === 'en' ? 'Historical store default rate:' : 'Mora histórica de tu comercio:'}
            </span>
            <span className={`font-bold ${merchant.defaultRate > 5 ? 'text-rose-600' : 'text-gray-800'}`}>
              {merchant.defaultRate}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-800">
              {language === 'en' ? 'Your Current Insurance Premium:' : 'Tu Prima de Seguro Actual:'}
            </span>
            <span className="text-sm font-extrabold text-purple-700">{merchant.currentInsuranceFee}%</span>
          </div>
        </div>

        <div className="p-3 bg-purple-50/80 rounded-2xl text-[11px] text-purple-900 border border-purple-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {language === 'en' ? (
              <><strong>Aligned Incentive:</strong> If a merchant credits irresponsible customers and claims insurance repeatedly, their premium automatically increases up to 12%. If they manage credit prudently, their rate stays at 2.5%.</>
            ) : (
              <><strong>Incentivo Alineado:</strong> Si un comerciante fía a clientes irresponsables y ejecuta el seguro repetidamente, su prima sube automáticamente hasta un 12%. Si cuida a quién fía, su tasa se mantiene en 2.5%.</>
            )}
          </p>
        </div>
      </div>

      {/* Datos del Smart Contract on Solana */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-gray-700 font-bold">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>{language === 'en' ? 'On-Chain Vault on Solana' : 'Bóveda On-Chain en Solana'}</span>
        </div>
        <p className="text-[11px] text-gray-400">
          {language === 'en'
            ? 'Funds are locked in a PDA with no human custody. Withdrawals are only authorized when a credit exceeds 30 days past due.'
            : 'Los fondos están bloqueados en una PDA sin custodia humana. Los retiros solo se autorizan cuando un fiado supera los 30 días de mora.'}
        </p>
        <div className="p-2.5 bg-gray-50 rounded-xl font-mono text-[10px] text-gray-500 break-all border border-gray-100 flex items-center justify-between">
          <span>PDA: {INSURANCE_VAULT_PDA}</span>
        </div>
      </div>

      {/* Modal de Opciones de Seguro y Suscripciones */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Insurance Options' : 'Opciones de Seguro'}
                  </h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'en'
                    ? 'Insurance rates dynamically adapt based on your store collection rate and historical track record.'
                    : 'El valor de los seguros se adapta dinámicamente según el índice de cobrabilidad y comportamiento histórico de tu almacén.'}
                </p>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ficha Actuarial en Vivo del Comercio */}
            <div className="p-3.5 bg-purple-50/90 rounded-2xl border border-purple-100 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-purple-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  {language === 'en' ? 'Dynamic Actuarial Model (Your Store)' : 'Modelo Actuarial Dinámico (Tu Comercio)'}
                </span>
                <span className="text-[10px] bg-purple-200/70 text-purple-800 px-2 py-0.5 rounded-full font-extrabold">
                  {language === 'en' ? 'Live' : 'En Vivo'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-purple-100/70 shadow-2xs">
                  <span className="text-[9px] text-gray-400 block font-medium uppercase">
                    {language === 'en' ? 'Base Rate' : 'Tasa Base'}
                  </span>
                  <span className="font-extrabold text-xs text-gray-800">{merchant.baseInsuranceFee}%</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100/70 shadow-2xs">
                  <span className="text-[9px] text-gray-400 block font-medium uppercase">
                    {language === 'en' ? 'Historical Default' : 'Mora Histórica'}
                  </span>
                  <span className="font-extrabold text-xs text-rose-600">{merchant.defaultRate}%</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100/70 shadow-2xs">
                  <span className="text-[9px] text-purple-600 block font-bold uppercase">
                    {language === 'en' ? 'Current Premium' : 'Prima Actual'}
                  </span>
                  <span className="font-extrabold text-xs text-purple-700">{merchant.currentInsuranceFee}%</span>
                </div>
              </div>

              <p className="text-[10px] text-purple-800/90 leading-relaxed pt-0.5">
                💡 <strong>{language === 'en' ? 'Adaptive Rate:' : 'Tarifa Adaptativa:'}</strong>{' '}
                {language === 'en'
                  ? `Insurance is not an arbitrary fixed fee. It rewards good neighborhood management: if you maintain high collection rates, your premium decreases toward the ${merchant.baseInsuranceFee}% floor. If defaults rise, it increases to protect the mutual PDA vault.`
                  : `El seguro no es un costo fijo arbitrario. Premia la buena gestión barrial: si cuidas a quién fías y mantienes alta cobrabilidad, tu prima baja hacia el piso del ${merchant.baseInsuranceFee}%. Si aumentan los incobrables, sube para proteger el fondo común PDA.`}
              </p>
            </div>

            {/* Listado de los 3 Planes */}
            <div className="space-y-3 pt-1">
              {/* PLAN 3: OPCIÓN ORO (COMPLETA) */}
              <div 
                onClick={() => handleSelectPlan('ORO')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedPlan === 'ORO'
                    ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-500/20'
                    : 'border-gray-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-xl shadow-2xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-white" />
                  {language === 'en' ? 'Most Popular • 100% Coverage' : 'Más Elegida • Cobertura 100%'}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 flex items-center justify-center shadow-xs shrink-0">
                    <Award className="w-5 h-5 fill-amber-700/30" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900">
                        {language === 'en' ? 'Gold Option (Full)' : 'Opción Oro (Completa)'}
                      </h4>
                      {selectedPlan === 'ORO' && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                          {language === 'en' ? 'ACTIVE' : 'ACTIVO'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-extrabold text-amber-700 mt-0.5">
                      {language === 'en'
                        ? `Adaptive premium: ${merchant.currentInsuranceFee}% per credit `
                        : `Prima adaptativa: ${merchant.currentInsuranceFee}% por fiado `}
                      <span className="text-[10px] font-normal text-gray-500">
                        {language === 'en' ? '(Decreases to 2.5% with high collection)' : '(Baja al 2.5% con alta cobrabilidad)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>
                      {language === 'en'
                        ? '100% capital guaranteed against customer defaults'
                        : '100% del capital garantizado ante morosidad barrial'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>
                      {language === 'en'
                        ? 'Automatic claims settlement via Smart Contract PDA'
                        : 'Liquidación automática de siniestros vía Smart Contract PDA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>
                      {language === 'en'
                        ? 'On-chain neighborhood credit scoring included'
                        : 'Scoring predictivo barrial on-chain incluido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PLAN 2: OPCIÓN ESTÁNDAR (MÍNIMO) */}
              <div 
                onClick={() => handleSelectPlan('STANDAR')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedPlan === 'STANDAR'
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900">
                        {language === 'en' ? 'Standard Option (Minimum)' : 'Opción Estándar (Mínimo)'}
                      </h4>
                      {selectedPlan === 'STANDAR' && (
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.2 rounded-full">
                          {language === 'en' ? 'ACTIVE' : 'ACTIVO'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-extrabold text-blue-700 mt-0.5">
                      {language === 'en'
                        ? `Reduced premium: ${(merchant.currentInsuranceFee * 0.6).toFixed(1)}% per credit `
                        : `Prima reducida: ${(merchant.currentInsuranceFee * 0.6).toFixed(1)}% por fiado `}
                      <span className="text-[10px] font-normal text-gray-500">
                        {language === 'en' ? '(60% of your actuarial rate)' : '(60% de tu tasa actuarial)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px]">
                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span>
                      {language === 'en'
                        ? '60% capital coverage against client default'
                        : '60% de cobertura de capital ante mora de clientes'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span>
                      {language === 'en'
                        ? 'Access to contingency PDA vault'
                        : 'Acceso al fondo común de contingencia PDA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span>
                      {language === 'en'
                        ? 'Ideal for stores with low credit volume'
                        : 'Ideal para almacenes con muy baja tasa de fiados'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PLAN 1: VERSIÓN FREE (SIN SEGURO) */}
              <div 
                onClick={() => handleSelectPlan('FREE')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedPlan === 'FREE'
                    ? 'border-gray-500 bg-gray-50/80 shadow-sm ring-1 ring-gray-400'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <ShieldOff className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900">
                        {language === 'en' ? 'Free Version (No Insurance)' : 'Versión Free (Sin Seguro)'}
                      </h4>
                      {selectedPlan === 'FREE' && (
                        <span className="text-[10px] font-black text-gray-700 bg-gray-200 px-2 py-0.2 rounded-full">
                          {language === 'en' ? 'ACTIVE' : 'ACTIVO'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-extrabold text-gray-600 mt-0.5">
                      {language === 'en' ? '0% premium ' : '0% de prima '}
                      <span className="text-[10px] font-normal text-gray-400">
                        {language === 'en' ? '(No monthly or settlement cost)' : '(Sin costo mensual ni por liquidación)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
                    <X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                    <span>
                      {language === 'en'
                        ? '0% coverage: You assume 100% of default risk'
                        : '0% de cobertura: Asumes el 100% del riesgo de impago'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                    <span>
                      {language === 'en'
                        ? 'No rescue or payout from PDA vault'
                        : 'Sin rescate ni liquidación del fondo PDA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />
                    <span>
                      {language === 'en'
                        ? 'Digital passbook, receipts and basic reminders'
                        : 'Libreta digital, tickets y recordatorios básicos'}
                    </span>
                  </div>

                  {/* Botón Adhesión Gratuita a la Red */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsJoinModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Register Store on Solana (Free Plan)' : 'Sumá tu Almacén a la Red Solana (Plan Free)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
              >
                {language === 'en' ? 'Confirm and Close' : 'Confirmar y Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adhesión de Comercio */}
      <JoinStoreModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
};
