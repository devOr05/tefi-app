import React, { useState, useEffect } from 'react';
import { useTefi } from '../context/TefiContext';
import { CreditScoreCard } from '../components/CreditScoreCard';
import { AbundanceFountainCard } from '../components/AbundanceFountainCard';
import { RepayModal } from '../components/RepayModal';
import { LinkedAccountsModal } from '../components/LinkedAccountsModal';
import { QrScannerModal } from '../components/QrScannerModal';
import { FiadoConfirmationModal } from '../components/FiadoConfirmationModal';
import { FiadoRecord, FiadoQrPayload } from '../types/tefi';
import { BookOpen, Calendar, CheckCircle2, DollarSign, Image as ImageIcon, ExternalLink, Sparkles, Link2, Camera, QrCode, ArrowDownRight } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

export const CustomerLibretaView: React.FC = () => {
  const { customer, fiados, repayFiado, exchangeRate, pendingFiadoFromUrl, clearPendingFiadoFromUrl } = useTefi();
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [justPaidId, setJustPaidId] = useState<string | null>(null);
  const [justAcceptedFiado, setJustAcceptedFiado] = useState<FiadoRecord | null>(null);
  const [payingFiado, setPayingFiado] = useState<FiadoRecord | null>(null);
  const [isLinkedAccountsModalOpen, setIsLinkedAccountsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingScannedFiado, setPendingScannedFiado] = useState<FiadoQrPayload | null>(null);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const pastFiados = fiados.filter(f => f.status === 'PAID');
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  P2P Sin Base de Datos
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">¿En el Almacén?</h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                Escaneá el QR de Don Tito para recibir y firmar tu fiado
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-3 rounded-2xl bg-white text-emerald-900 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Escanear QR</span>
          </button>
        </div>
      </div>

      {/* Alerta de Fiado Aceptado */}
      {justAcceptedFiado && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-600/25 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
            <span>
              ¡Fiado de ${justAcceptedFiado.amountArs.toLocaleString('es-AR')} ARS ({justAcceptedFiado.amountUsdc} USDC) registrado en tu libreta!
            </span>
          </div>
          <button
            onClick={() => setJustAcceptedFiado(null)}
            className="text-white/80 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Score Card del Cliente */}
      <CreditScoreCard />

      {/* Fuente de la Abundancia (Micro-Ahorro, Rendimiento y Educación Financiera) */}
      <AbundanceFountainCard />

      {/* Tarjeta de Medios de Pago y Billeteras Vinculadas (Cuenta DNI / Mercado Pago) */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Billeteras & Cuentas Vinculadas</h4>
              <p className="text-[10px] text-gray-400">Rampas de pago para tus fiados</p>
            </div>
          </div>
          <button
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
          >
            Vincular / Editar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Cuenta DNI */}
          <div
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cuenta DNI
              </span>
              <span className="text-[9px] text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded-md">
                {customer.cuentaDniLinked !== false ? 'Vinculada' : 'Off'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-emerald-950 font-bold truncate mt-1">
              {customer.cuentaDniAlias || 'matias.gonzalez.bapro'}
            </p>
          </div>

          {/* Mercado Pago */}
          <div
            onClick={() => setIsLinkedAccountsModalOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Mercado Pago
              </span>
              <span className="text-[9px] text-blue-800 font-extrabold bg-blue-100 px-1.5 py-0.2 rounded-md">
                {customer.mercadoPagoLinked !== false ? 'Vinculada' : 'Off'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-blue-950 font-bold truncate mt-1">
              {customer.mercadoPagoAlias || 'matias.mp.tefi'}
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Deuda Total */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-3xl p-5 shadow-sm">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tu Deuda Total en la Libreta</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold tracking-tight">${customer.currentDebt.toFixed(2)}</span>
          <span className="text-sm font-semibold text-emerald-400">USDC</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Aprox. ${(customer.currentDebt * rate).toLocaleString('es-AR')} ARS en {activeFiados.length} comercios ({exchangeRate.source})
        </p>
      </div>

      {justPaidId && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>¡Pago confirmado! +5 pts de score y +150 puntos Tefi ganados.</span>
          </div>
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Fiados Pendientes (con Foto del Ticket) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
          Compras al Fiado Activas ({activeFiados.length})
        </h3>

        {activeFiados.length === 0 ? (
          <div className="text-center py-6 glass-card rounded-3xl border border-gray-100 p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">¡Estás al día!</p>
            <p className="text-[11px] text-gray-400 mt-0.5">No tienes deudas pendientes en tu libreta.</p>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Foto del comprobante */}
                  <button
                    onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                    className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group"
                  >
                    <img src={f.photoReceiptUrl} alt="Comprobante" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{f.merchantName}</h4>
                    <p className="text-[11px] text-gray-600 font-medium line-clamp-1 max-w-[170px]">{f.itemsDescription}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-600 font-semibold">
                      <Calendar className="w-3 h-3" />
                      <span>Vence el {new Date(f.dueDate).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-gray-900 block">${f.amountUsdc} USDC</span>
                  <span className="text-[10px] text-gray-400">${f.amountArs.toLocaleString('es-AR')} ARS</span>
                </div>
              </div>

              {/* Botón Pagar en 1-click */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <button
                  onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                  className="text-[11px] text-gray-500 font-medium hover:text-gray-800 flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>Ver foto del ticket</span>
                </button>

                <button
                  onClick={() => setPayingFiado(f)}
                  className="px-4 py-2 rounded-xl gradient-tefi text-white font-bold text-xs shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Pagar Ahora</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historial de Pagos Anteriores */}
      {pastFiados.length > 0 && (
        <div className="space-y-2 mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
            Historial de Cumplimiento ({pastFiados.length})
          </h3>

          {pastFiados.map(f => (
            <div key={f.id} className="p-3 rounded-2xl bg-white/60 border border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold text-gray-800 block">{f.merchantName}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {f.repaidAt ? new Date(f.repaidAt).toLocaleDateString('es-AR') : '23/09/2026'}
                    </span>
                    {f.paymentMethod === 'MERCADO_PAGO' && (
                      <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md">
                        Mercado Pago
                      </span>
                    )}
                    {f.paymentMethod === 'CUENTA_DNI' && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Cuenta DNI
                      </span>
                    )}
                    {f.paymentMethod === 'CASH' && (
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md">
                        Efectivo
                      </span>
                    )}
                    {(!f.paymentMethod || f.paymentMethod === 'SOLANA_USDC') && (
                      <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-md">
                        USDC
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-gray-900 block">${f.amountUsdc} USDC</span>
                {f.txSignature && (
                  <a
                    href={getSolanaExplorerUrl(f.txSignature)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5 justify-end"
                  >
                    <span>Tx Devnet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Zoom Foto */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto} alt="Comprobante ampliado" className="w-full rounded-2xl max-h-[70vh] object-contain" />
            <button
              onClick={() => setViewingPhoto(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
            >
              Cerrar Comprobante
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
