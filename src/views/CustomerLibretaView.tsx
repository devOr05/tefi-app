import React, { useState, useEffect } from 'react';
import { useTefi } from '../context/TefiContext';
import { RepayModal } from '../components/RepayModal';
import { LinkedAccountsModal } from '../components/LinkedAccountsModal';
import { QrScannerModal } from '../components/QrScannerModal';
import { FiadoConfirmationModal } from '../components/FiadoConfirmationModal';
import { FiadoRecord, FiadoQrPayload } from '../types/tefi';
import { BookOpen, Calendar, CheckCircle2, DollarSign, Image as ImageIcon, Sparkles, Link2, Camera, QrCode, ArrowDownRight, Info } from 'lucide-react';

export const CustomerLibretaView: React.FC = () => {
  const { customer, fiados, repayFiado, exchangeRate, pendingFiadoFromUrl, clearPendingFiadoFromUrl, t, language } = useTefi();
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [justPaidId, setJustPaidId] = useState<string | null>(null);
  const [justAcceptedFiado, setJustAcceptedFiado] = useState<FiadoRecord | null>(null);
  const [payingFiado, setPayingFiado] = useState<FiadoRecord | null>(null);
  const [isLinkedAccountsModalOpen, setIsLinkedAccountsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingScannedFiado, setPendingScannedFiado] = useState<FiadoQrPayload | null>(null);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const rate = exchangeRate.rate || 1615;

  // Si se abrió la app con un enlace de fiado (?fiado=...), abrir el modal de confirmación
  useEffect(() => {
    if (pendingFiadoFromUrl) {
      setPendingScannedFiado(pendingFiadoFromUrl);
      clearPendingFiadoFromUrl();
    }
  }, [pendingFiadoFromUrl, clearPendingFiadoFromUrl]);

  const handlePay = (fiadoId: string) => {
    const res = repayFiado(fiadoId);
    if (res.success) {
      setJustPaidId(fiadoId);
      setTimeout(() => setJustPaidId(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Botón Principal: Escanear QR de Fiado de Don Tito (P2P Óptico entre Celulares) */}
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
      </div>

      {/* Alerta de Fiado Aceptado */}
      {justAcceptedFiado && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-600/25 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
            <span>
              {language === 'en'
                ? `Store credit of $${justAcceptedFiado.amountArs.toLocaleString('en-US')} ARS (${justAcceptedFiado.amountUsdc} USDC) recorded in your passbook!`
                : `¡Fiado de $${justAcceptedFiado.amountArs.toLocaleString('es-AR')} ARS (${justAcceptedFiado.amountUsdc} USDC) registrado en tu libreta!`}
            </span>
          </div>
          <button
            onClick={() => setJustAcceptedFiado(null)}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}


      {/* Tarjeta de Medios de Pago y Billeteras Vinculadas (Cuenta DNI / Mercado Pago) */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{t('linkedAccountsTitle')}</h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-400">{t('linkedAccountsSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer border border-emerald-200/50 dark:border-emerald-800"
          >
            {t('linkEditBtn')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Cuenta DNI */}
          <div
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cuenta DNI
              </span>
              <span className="text-[9px] text-emerald-800 dark:text-emerald-300 font-extrabold bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded-md">
                {customer.cuentaDniLinked !== false ? t('linkedBadge') : t('offBadge')}
              </span>
            </div>
            <p className="text-[10px] font-mono text-emerald-950 dark:text-emerald-300 font-bold truncate mt-1">
              {customer.cuentaDniAlias || 'matias.gonzalez.bapro'}
            </p>
          </div>

          {/* Mercado Pago */}
          <div
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Mercado Pago
              </span>
              <span className="text-[9px] text-blue-800 dark:text-blue-300 font-extrabold bg-blue-100 dark:bg-blue-950/70 px-1.5 py-0.2 rounded-md">
                {customer.mercadoPagoLinked !== false ? t('linkedBadge') : t('offBadge')}
              </span>
            </div>
            <p className="text-[10px] font-mono text-blue-950 dark:text-blue-300 font-bold truncate mt-1">
              {customer.mercadoPagoAlias || 'matias.mp.tefi'}
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Consumos Totales */}
      <div className="bg-gradient-to-r from-gray-950 via-[#18112c] to-gray-900 text-white rounded-3xl p-5 shadow-sm border border-purple-900/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[11px] font-semibold text-purple-200/80 uppercase tracking-wider relative z-10">{t('totalConsumptions')}</span>
        <div className="flex items-baseline gap-2 mt-1 relative z-10">
          <span className="text-3xl font-extrabold tracking-tight text-white">${customer.currentDebt.toFixed(2)}</span>
          <span className="text-sm font-semibold text-emerald-400">USDC</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 relative z-10">
          {language === 'en'
            ? `Approx. $${(customer.currentDebt * rate).toLocaleString('en-US')} ARS across ${activeFiados.length} stores (${exchangeRate.source})`
            : `Aprox. $${(customer.currentDebt * rate).toLocaleString('es-AR')} ARS en ${activeFiados.length} comercios (${exchangeRate.source})`}
        </p>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-[10px] text-purple-200/90 relative z-10">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t('feeNotice')}</span>
        </div>
      </div>

      {justPaidId && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>{t('paymentConfirmedAlert')}</span>
          </div>
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Fiados Pendientes (con Foto del Ticket) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
          {t('activeFiadosTitle')} ({activeFiados.length})
        </h3>

        {activeFiados.length === 0 ? (
          <div className="text-center py-6 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{t('allSettled')}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t('noActiveFiados')}</p>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Foto del comprobante */}
                  <button
                    onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                    aria-label={t('viewTicketPhoto')}
                    className="relative w-13 h-13 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-700 group cursor-pointer"
                  >
                    <img src={f.photoReceiptUrl} alt="Comprobante" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{f.merchantName}</h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium line-clamp-1">{f.itemsDescription}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('dueOn')} {new Date(f.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right min-w-[100px]">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white block">${(f.amountUsdc * 1.01).toFixed(2)} USDC</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-400 block">${Math.round(f.amountArs * 1.01).toLocaleString(language === 'en' ? 'en-US' : 'es-AR')} ARS</span>
                  <span
                    className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 px-1.5 py-0.5 rounded-md inline-block mt-0.5 whitespace-nowrap shadow-2xs"
                    title={language === 'en' ? 'Final amount including 1% Solana network & app fee' : 'Monto final con comisión de red Solana (1%) y mantenimiento de app'}
                  >
                    {t('finalFeeBadge')}
                  </span>
                </div>
              </div>

              {/* Botón Pagar en 1-click */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                <button
                  onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                  className="text-[11px] text-gray-500 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('viewTicketPhoto')}</span>
                </button>

                <button
                  onClick={() => setPayingFiado(f)}
                  className="px-4 py-2 rounded-xl gradient-tefi text-white font-bold text-xs shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer touch-target-accessible"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{t('payNow')}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>


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

      {/* Modal de Pago Multicanal */}
      <RepayModal
        isOpen={!!payingFiado}
        onClose={() => setPayingFiado(null)}
        fiado={payingFiado}
        onRepaySuccess={() => {
          if (payingFiado) {
            setJustPaidId(payingFiado.id);
            setTimeout(() => setJustPaidId(null), 3500);
          }
        }}
      />

      {/* Modal de Vinculación de Billeteras (Cuenta DNI / Mercado Pago) */}
      <LinkedAccountsModal
        isOpen={isLinkedAccountsModalOpen}
        onClose={() => setIsLinkedAccountsModalOpen(false)}
      />

      {/* Modal Lector QR con Cámara Real */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(payload) => {
          setIsScannerOpen(false);
          setPendingScannedFiado(payload);
        }}
      />

      {/* Modal de Confirmación y Firma On-Chain del Fiado */}
      {pendingScannedFiado && (
        <FiadoConfirmationModal
          payload={pendingScannedFiado}
          onClose={() => setPendingScannedFiado(null)}
          onConfirmed={(newFiado) => {
            setPendingScannedFiado(null);
            setJustAcceptedFiado(newFiado);
            setTimeout(() => setJustAcceptedFiado(null), 6000);
          }}
        />
      )}
    </div>
  );
};
