import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { FiadoRecord, PendingCosign } from '../types/tefi';
import { Clock, CheckCircle2, Image as ImageIcon, ExternalLink, Loader2, AlertCircle, HandCoins, Receipt } from 'lucide-react';
import { CosignQrModal } from '../components/CosignQrModal';
import { GoldFiarCoin } from '../components/GoldFiarCoin';
import { StoreFundingNotice } from '../components/StoreFundingNotice';
import { ChainSyncStatus } from '../components/ChainSyncStatus';
import { calculateTotalActiveDebt } from '../services/financialLedger';
import { getSolanaAccountUrl, getSolanaExplorerUrl } from '../solana/connection';

export const MerchantDashboard: React.FC<{ onNavigateToNew: () => void }> = ({ onNavigateToNew }) => {
  const { merchant, fiados, createRepayRequest, exchangeRate, t, tr, language } = useTefi();
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [repayRequest, setRepayRequest] = useState<PendingCosign | null>(null);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const paidFiados = fiados.filter(f => f.status === 'PAID');
  const totalPendingUsdc = calculateTotalActiveDebt(fiados);
  const rate = exchangeRate.rate || 1615;
  const locale = language === 'en' ? 'en-US' : 'es-AR';

  // El almacén confirma que cobró: firma su parte del repay_fiado y el vecino la completa desde su teléfono
  const handleRegisterPayment = async (fiado: FiadoRecord) => {
    setError(null);
    setPreparingId(fiado.id);
    const res = await createRepayRequest(fiado);
    setPreparingId(null);
    if (res.success) {
      setRepayRequest(res.request);
    } else {
      setError(res.error);
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
              {t('equivArs')} ${Math.round(totalPendingUsdc * rate).toLocaleString(locale)} ARS
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
            <span className="text-sm font-bold">${merchant.totalSalesUsdc.toFixed(2)}</span>
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

      <StoreFundingNotice />
      <ChainSyncStatus />

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Fiados Activos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t('fiadosToCollect')} ({activeFiados.length})
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {tr('Co-signed on-chain', 'Co-firmados on-chain')}
          </span>
        </div>

        {activeFiados.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('noFiadosFound')}</p>
            <button
              onClick={onNavigateToNew}
              className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {tr('+ Record a fiado', '+ Registrar un fiado')}
            </button>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Foto del ticket: existe solo en este teléfono */}
                  {f.photoReceiptUrl ? (
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
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{f.customerName}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                      {f.itemsDescription || tr('Details kept on the phone that recorded it', 'Detalle guardado en el teléfono que lo registró')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{t('dueOn')}: {new Date(f.dueDate).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white block">${f.amountUsdc.toFixed(2)} USDC</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">${Math.round(f.amountArs).toLocaleString(locale)} ARS</span>
                </div>
              </div>

              {/* Botonera de acciones */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800 text-[11px]">
                <a
                  href={f.txSignature ? getSolanaExplorerUrl(f.txSignature) : getSolanaAccountUrl(f.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Solana Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleRegisterPayment(f)}
                  disabled={preparingId !== null}
                  className="px-3 py-1.5 rounded-xl gradient-tefi text-white font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 text-[11px] disabled:opacity-60 cursor-pointer"
                  title={tr('The neighbor paid you: co-sign the repayment', 'El vecino te pagó: co-firmar el repago')}
                >
                  {preparingId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HandCoins className="w-3.5 h-3.5" />}
                  <span>{tr('Register payment', 'Registrar pago')}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fiados ya cobrados (repay_fiado co-firmado) */}
      {paidFiados.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
            {t('filterPaid')} ({paidFiados.length})
          </h3>
          {paidFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-gray-900 dark:text-white block truncate">{f.customerName}</span>
                  <a
                    href={f.repayTxSignature ? getSolanaExplorerUrl(f.repayTxSignature) : getSolanaAccountUrl(f.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>Solana Explorer</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <span className="font-extrabold text-gray-900 dark:text-white shrink-0">${f.amountUsdc.toFixed(2)} USDC</span>
            </div>
          ))}
        </div>
      )}

      {/* QR de co-firma del repago */}
      {repayRequest && <CosignQrModal request={repayRequest} onClose={() => setRepayRequest(null)} />}

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
    </div>
  );
};
