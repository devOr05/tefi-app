import React, { useState, useEffect } from 'react';
import { IncomingCosign, useTefi } from '../context/TefiContext';
import { QrScannerModal } from '../components/QrScannerModal';
import { CosignConfirmModal } from '../components/CosignConfirmModal';
import { NeighborIdModal } from '../components/NeighborIdModal';
import { ChainSyncStatus } from '../components/ChainSyncStatus';
import { Calendar, CheckCircle2, Camera, QrCode, Info, ExternalLink, AlertCircle, HandCoins, IdCard, Loader2 } from 'lucide-react';
import { getSolanaAccountUrl, getSolanaExplorerUrl } from '../solana/connection';

export const CustomerLibretaView: React.FC = () => {
  const { customer, fiados, exchangeRate, pendingCosignUrl, clearPendingCosignUrl, openCosign, t, tr, language } = useTefi();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIdOpen, setIsIdOpen] = useState(false);
  const [incoming, setIncoming] = useState<IncomingCosign | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isOpeningLink, setIsOpeningLink] = useState(false);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const rate = exchangeRate.rate || 1615;
  const locale = language === 'en' ? 'en-US' : 'es-AR';

  // Si la app se abrió desde el link de un QR de co-firma, pasar directo a revisar ese pedido
  useEffect(() => {
    if (!pendingCosignUrl) return;
    const url = pendingCosignUrl;
    clearPendingCosignUrl();
    setLinkError(null);
    setIsOpeningLink(true);
    openCosign(url).then(res => {
      setIsOpeningLink(false);
      if (res.success) {
        setIncoming(res.incoming);
      } else {
        setLinkError(res.error);
      }
    });
  }, [pendingCosignUrl]);

  return (
    <div className="space-y-4 pb-20">
      {/* Botón Principal: Escanear el QR que muestra el almacén */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 border border-white/25">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{t('inStoreBanner')}</h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                {t('inStoreScanDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            aria-label={t('scanQrBtn')}
            className="px-4 py-3 rounded-2xl bg-white text-emerald-900 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>{t('scanQrBtn')}</span>
          </button>
        </div>

        <button
          onClick={() => setIsIdOpen(true)}
          className="relative z-10 mt-3 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <IdCard className="w-3.5 h-3.5" />
          <span>{tr('My Tefi QR · show it to a store the first time', 'Mi QR Tefi · mostralo al almacén la primera vez')}</span>
        </button>
      </div>

      {isOpeningLink && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{tr('Reading and verifying the request...', 'Leyendo y verificando el pedido...')}</span>
        </div>
      )}

      {linkError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{linkError}</span>
        </div>
      )}

      {/* Banner de Consumos Totales */}
      <div className="bg-gradient-to-r from-gray-950 via-[#18112c] to-gray-900 text-white rounded-3xl p-5 shadow-sm border border-purple-900/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[11px] font-semibold text-purple-200/80 uppercase tracking-wider relative z-10">{t('totalConsumptions')}</span>
        <div className="flex items-baseline gap-2 mt-1 relative z-10">
          <span className="text-3xl font-extrabold tracking-tight text-white">${customer.currentDebt.toFixed(2)}</span>
          <span className="text-sm font-semibold text-emerald-400">USDC</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 relative z-10">
          {tr(
            `Approx. $${Math.round(customer.currentDebt * rate).toLocaleString(locale)} ARS in ${activeFiados.length} active fiados (${exchangeRate.source})`,
            `Aprox. $${Math.round(customer.currentDebt * rate).toLocaleString(locale)} ARS en ${activeFiados.length} fiados activos (${exchangeRate.source})`
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-[10px] text-purple-200/90 relative z-10">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t('feeNotice')}</span>
        </div>
      </div>

      <ChainSyncStatus />

      {/* Fiados Pendientes */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
          {t('activeFiadosTitle')} ({activeFiados.length})
        </h3>

        {activeFiados.length === 0 ? (
          <div className="text-center py-6 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {customer.hasOnChainProfile ? t('allSettled') : tr('Your passbook is empty', 'Tu libreta está vacía')}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              {customer.hasOnChainProfile
                ? t('noActiveFiados')
                : tr(
                    'Show "My Tefi QR" to the store once. Then scan the QR of each fiado and sign it with this phone.',
                    'Mostrale "Mi QR Tefi" al almacén una vez. Después escaneá el QR de cada fiado y firmalo con este teléfono.'
                  )}
            </p>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{f.merchantName}</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium line-clamp-1">
                    {f.itemsDescription || tr('Details kept on the phone that signed it', 'Detalle guardado en el teléfono que lo firmó')}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t('dueOn')} {new Date(f.dueDate).toLocaleDateString(locale)}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right min-w-[100px]">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white block">${f.amountUsdc.toFixed(2)} USDC</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-400 block">${Math.round(f.amountArs).toLocaleString(locale)} ARS</span>
                  <a
                    href={f.txSignature ? getSolanaExplorerUrl(f.txSignature) : getSolanaAccountUrl(f.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 whitespace-nowrap hover:underline"
                  >
                    <span>Devnet On-Chain</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* El repago lo inicia el almacén cuando cobra; el vecino lo co-firma escaneando su QR */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 leading-snug">
                  {tr('Pay the store, then scan the repayment QR it shows you.', 'Pagale al almacén y escaneá el QR de repago que te muestra.')}
                </p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 rounded-xl gradient-tefi text-white font-bold text-xs shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer touch-target-accessible shrink-0"
                >
                  <HandCoins className="w-3.5 h-3.5" />
                  <span>{t('payNow')}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lector QR con cámara: fiados y repagos llegan por el mismo canal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={tr("Scan the store's QR", 'Escanear el QR del almacén')}
        subtitle={tr('You will review the fiado or repayment before signing', 'Vas a revisar el fiado o el repago antes de firmar')}
        onScan={async text => {
          const res = await openCosign(text);
          if (!res.success) return res.error;
          setLinkError(null);
          setIncoming(res.incoming);
          setIsScannerOpen(false);
          return null;
        }}
      />

      {/* Revisión y firma del vecino */}
      {incoming && <CosignConfirmModal incoming={incoming} onClose={() => setIncoming(null)} />}

      <NeighborIdModal isOpen={isIdOpen} onClose={() => setIsIdOpen(false)} />
    </div>
  );
};
