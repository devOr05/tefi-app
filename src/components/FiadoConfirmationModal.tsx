import React, { useState } from 'react';
import { FiadoQrPayload, FiadoRecord } from '../types/tefi';
import { useTefi } from '../context/TefiContext';
import { CheckCircle2, AlertTriangle, ShieldCheck, X, Store, Calendar, ArrowRight, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

interface FiadoConfirmationModalProps {
  payload: FiadoQrPayload;
  onClose: () => void;
  onConfirmed: (fiado: FiadoRecord) => void;
}

export const FiadoConfirmationModal: React.FC<FiadoConfirmationModalProps> = ({
  payload,
  onClose,
  onConfirmed
}) => {
  const { customer, acceptScannedFiado, exchangeRate } = useTefi();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = payload.data;
  const rate = exchangeRate.rate || 1615;
  const availableLimit = customer.maxCreditLimit - customer.currentDebt;
  const newDebt = +(customer.currentDebt + data.amountUsdc).toFixed(2);
  const remainingLimit = +(customer.maxCreditLimit - newDebt).toFixed(2);
  const isOverLimit = data.amountUsdc > availableLimit;

  const handleConfirm = async () => {
    setError(null);
    setIsSigning(true);

    try {
      // Breve simulación de firma de clave privada Solana
      await new Promise(r => setTimeout(r, 600));

      const res = acceptScannedFiado(payload);
      if (!res.success) {
        setError(res.error || 'No se pudo registrar el fiado.');
        setIsSigning(false);
        return;
      }

      if (res.fiado) {
        onConfirmed(res.fiado);
      }
    } catch (e: any) {
      setError(e.message || 'Error inesperado al firmar el fiado.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 my-auto">
        <button
          onClick={onClose}
          disabled={isSigning}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <Store className="w-6 h-6" />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Fiado P2P Detectado
        </span>
        <h3 className="text-lg font-black text-gray-900 mt-1">¿Aceptar este Fiado?</h3>
        <p className="text-[11px] text-gray-500">
          Revisa el comprobante y confirma el registro en tu Libreta Tefi
        </p>

        {/* Tarjeta del Comercio & Monto */}
        <div className="mt-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-left space-y-2.5">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Comercio</span>
              <h4 className="text-xs font-bold text-gray-900">{data.merchantName || 'Almacén Don Tito'}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Monto Final a Abonar</span>
              <p className="text-base font-black text-emerald-700 leading-tight">
                ${Math.round(data.amountArs * 1.01).toLocaleString('es-AR')} ARS
              </p>
              <span className="text-[10px] font-extrabold text-gray-500 font-mono">
                ≈ {(data.amountUsdc * 1.01).toFixed(2)} USDC
              </span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/70 px-1 py-0.2 rounded block mt-0.5">
                Incluye 1% red & app
              </span>
            </div>
          </div>

          <div className="p-2 bg-emerald-50/80 border border-emerald-100/90 rounded-xl text-[10px] text-emerald-900 leading-snug flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Comisión Mínima Pautada (1%):</strong> Cubre el costo de red Solana ($0.00025) y el mantenimiento de la app. El monto final ya la incluye calculada.
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Artículos incluidos:</span>
            <p className="text-xs font-medium text-gray-800 bg-white p-2 rounded-xl border border-gray-100 mt-0.5">
              {data.itemsDescription || 'Compra general de almacén'}
            </p>
          </div>

          {/* Foto del comprobante si existe */}
          {data.photoReceiptUrl && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                <ImageIcon className="w-3 h-3" />
                <span>Foto de mercadería / ticket:</span>
              </span>
              <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={data.photoReceiptUrl}
                  alt="Mercadería fiada"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Fecha límite de pago:</span>
            </span>
            <span className="font-bold text-gray-900">
              {new Date(data.dueDate).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Simulación de Impacto en Crédito */}
        <div className="mt-3 p-3 bg-purple-50/70 rounded-2xl border border-purple-100 text-left text-[11px] space-y-1.5">
          <div className="flex items-center justify-between font-bold text-purple-900">
            <span>Tus Consumos en Libreta:</span>
            <span className="flex items-center gap-1">
              <span>${customer.currentDebt.toFixed(2)}</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span className="text-purple-700">${newDebt} USDC</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Cupo disponible restante:</span>
            <span className="font-bold text-gray-800">${remainingLimit} USDC</span>
          </div>
          <div className="flex items-center justify-between text-emerald-800 font-semibold pt-1 border-t border-purple-100">
            <span>Recompensa al pagar a término:</span>
            <span className="font-extrabold text-emerald-600">+5 pts Score & +150 Tefi</span>
          </div>
        </div>

        {isOverLimit && (
          <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Supera tu límite crediticio disponible (${availableLimit.toFixed(1)} USDC).</span>
          </div>
        )}

        {error && (
          <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isSigning || isOverLimit}
            className="w-full py-3.5 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Firmando con clave privada Solana...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar y Registrar en mi Libreta</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isSigning}
            className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors"
          >
            Rechazar / Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
