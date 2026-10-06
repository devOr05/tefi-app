import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { FiadoRecord } from '../types/tefi';
import { DollarSign, ShieldAlert, Users, Clock, AlertTriangle, CheckCircle, Image as ImageIcon, ChevronRight, Plus, Building2 } from 'lucide-react';
import { QrModal } from '../components/QrModal';
import { RepayModal } from '../components/RepayModal';
import { GoldFiarCoin } from '../components/GoldFiarCoin';
import { JoinStoreModal } from '../components/JoinStoreModal';

export const MerchantDashboard: React.FC<{ onNavigateToNew: () => void }> = ({ onNavigateToNew }) => {
  const { merchant, fiados, claimInsurance, exchangeRate, t, language } = useTefi();
  const [selectedFiadoForQr, setSelectedFiadoForQr] = useState<FiadoRecord | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [payingFiado, setPayingFiado] = useState<FiadoRecord | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const paidFiados = fiados.filter(f => f.status === 'PAID');
  const totalPendingUsdc = activeFiados.reduce((acc, f) => acc + f.amountUsdc, 0);
  const rate = exchangeRate.rate || 1615;

  const handleClaim = (fiadoId: string) => {
    const confirmMsg = language === 'en'
      ? 'Do you want to claim insurance for this credit default? The Solana guarantee pool will reimburse the funds, but your store risk premium will adjust.'
      : '¿Deseas reclamar el seguro de este fiado? El fondo de garantía de Solana te reembolsará el monto, pero tu prima de riesgo del comercio aumentará.';
    if (confirm(confirmMsg)) {
      const res = claimInsurance(fiadoId);
      if (res.success) {
        alert(language === 'en'
          ? `Insurance payout credited! $${res.payoutAmount} USDC reimbursed to your wallet from the Pool.`
          : `¡Seguro acreditado! Se indemnizaron $${res.payoutAmount} USDC a tu wallet desde el Pool.`);
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner Principal de Caja */}
      <div className="gradient-tefi text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">{t('totalPendingFiados')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold tracking-tight">${totalPendingUsdc.toFixed(2)}</span>
              <span className="text-sm font-semibold text-emerald-200">USDC</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 mt-1">
              {t('equivArs')} ${(totalPendingUsdc * rate).toLocaleString(language === 'en' ? 'en-US' : 'es-AR')} ARS
            </p>
          </div>

          <button
            onClick={onNavigateToNew}
            aria-label={t('navFiar')}
            className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
          >
            <GoldFiarCoin size="md" />
            <span className="text-[10px] font-black text-amber-200 mt-1 tracking-tight drop-shadow-xs">{t('navFiar')}</span>
          </button>
        </div>

        {/* Métricas secundarias */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-emerald-400/30 text-center">
          <div>
            <span className="text-[10px] text-emerald-200 block">{t('salesOnCredit')}</span>
            <span className="text-sm font-bold">${merchant.totalSalesUsdc}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block">{t('collected')}</span>
            <span className="text-sm font-bold text-white">{paidFiados.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block">{t('onHold')}</span>
            <span className="text-sm font-bold text-emerald-200">{activeFiados.length}</span>
          </div>
        </div>
      </div>

      {/* Indicador de Seguro y Tasa Dinámica */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              merchant.currentInsuranceFee > 5 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">
                {language === 'en' ? 'Actuarial Collection Insurance' : 'Seguro de Cobro Actuarial'}
              </h3>
              <p className="text-[10px] text-gray-400">
                {language === 'en' ? 'Default loss protection' : 'Protección contra incobrables'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block font-medium">
              {language === 'en' ? 'Premium Rate' : 'Tasa de Prima'}
            </span>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
              merchant.currentInsuranceFee > 5 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
            }`}>
              {merchant.currentInsuranceFee}%
            </span>
          </div>
        </div>

        {/* Explicación del modelo actuarial dinámico y cobrabilidad */}
        <div className="mt-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-2 border border-gray-100 dark:border-gray-700">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>{t('dynamicRiskRate')}:</strong>{' '}
            {language === 'en'
              ? `Your current premium is ${merchant.currentInsuranceFee}% (historical default: ${merchant.defaultRate}%). It varies with your store collection index: when neighbors pay on time, your rate drops to the 2.5% floor; if defaults rise, it increases progressively.`
              : `Tu prima actual es ${merchant.currentInsuranceFee}% (mora histórica: ${merchant.defaultRate}%). Varía según el índice de cobrabilidad de tu almacén: si cuidas a quién fías y cobras a término, tu tasa baja hacia el piso del 2.5%; si aumentan los incobrables, sube progresivamente.`}
          </p>
        </div>
      </div>

      {/* Botón Destacado de Adhesión para nuevos almacenes */}
      <button
        onClick={() => setIsJoinModalOpen(true)}
        className="w-full py-2.5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer touch-target-accessible shadow-2xs"
      >
        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>{t('joinNetworkBtn')}</span>
      </button>

      {/* Lista de Fiados Activos con Foto */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t('fiadosToCollect')} ({activeFiados.length})
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {language === 'en' ? 'On-chain photo proof' : 'Con foto on-chain'}
          </span>
        </div>

        {activeFiados.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('noFiadosFound')}</p>
            <button
              onClick={onNavigateToNew}
              className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {language === 'en' ? '+ Record first store credit' : '+ Registrar primer fiado'}
            </button>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Thumbnail de foto del ticket/mercaderia */}
                  <button
                    onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                    aria-label={t('viewTicketPhoto')}
                    className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-700 group cursor-pointer"
                  >
                    <img src={f.photoReceiptUrl} alt="Ticket" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{f.customerName}</h4>
                      <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded-md">DID</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[170px]">{f.itemsDescription}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{t('dueOn')}: {new Date(f.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white block">${f.amountUsdc} USDC</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">${f.amountArs.toLocaleString(language === 'en' ? 'en-US' : 'es-AR')} ARS</span>
                </div>
              </div>

              {/* Botonera de acciones */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFiadoForQr(f)}
                    className="text-gray-500 dark:text-gray-400 font-semibold hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                  >
                    {language === 'en' ? 'View QR' : 'Ver QR'}
                  </button>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-100 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{language === 'en' ? 'Live Webhook' : 'Webhook Activo'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPayingFiado(f)}
                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors text-[10px] cursor-pointer"
                    title={language === 'en' ? 'If client pays in cash' : 'Si el cliente te entrega billetes en mano'}
                  >
                    {language === 'en' ? 'Cash' : 'Efectivo'}
                  </button>

                  <button
                    onClick={() => handleClaim(f.id)}
                    className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center gap-0.5 text-[10px] cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    {language === 'en' ? 'Insurance' : 'Seguro'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Cobro / Repayment */}
      <RepayModal
        isOpen={!!payingFiado}
        onClose={() => setPayingFiado(null)}
        fiado={payingFiado}
      />

      {/* Modal QR */}
      {selectedFiadoForQr && (
        <QrModal
          fiado={selectedFiadoForQr}
          onClose={() => setSelectedFiadoForQr(null)}
        />
      )}

      {/* Modal Zoom Foto */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl p-2 border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto} alt="Comprobante ampliado" className="w-full rounded-2xl max-h-[70vh] object-contain" />
            <button
              onClick={() => setViewingPhoto(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs cursor-pointer touch-target-accessible"
            >
              {t('closeReceipt')}
            </button>
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
