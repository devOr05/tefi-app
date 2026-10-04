import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { FiadoRecord } from '../types/tefi';
import { DollarSign, ShieldAlert, Users, Clock, AlertTriangle, CheckCircle, Image as ImageIcon, ChevronRight, Plus } from 'lucide-react';
import { QrModal } from '../components/QrModal';
import { RepayModal } from '../components/RepayModal';
import { GoldFiarCoin } from '../components/GoldFiarCoin';

export const MerchantDashboard: React.FC<{ onNavigateToNew: () => void }> = ({ onNavigateToNew }) => {
  const { merchant, fiados, claimInsurance, exchangeRate } = useTefi();
  const [selectedFiadoForQr, setSelectedFiadoForQr] = useState<FiadoRecord | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [payingFiado, setPayingFiado] = useState<FiadoRecord | null>(null);

  const activeFiados = fiados.filter(f => f.status === 'ACTIVE');
  const paidFiados = fiados.filter(f => f.status === 'PAID');
  const totalPendingUsdc = activeFiados.reduce((acc, f) => acc + f.amountUsdc, 0);
  const rate = exchangeRate.rate || 1615;

  const handleClaim = (fiadoId: string) => {
    if (confirm('¿Deseas reclamar el seguro de este fiado? El fondo de garantía de Solana te reembolsará el monto, pero tu prima de riesgo del comercio aumentará.')) {
      const res = claimInsurance(fiadoId);
      if (res.success) {
        alert(`¡Seguro acreditado! Se indemnizaron $${res.payoutAmount} USDC a tu wallet desde el Pool.`);
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner Principal de Caja */}
      <div className="gradient-tefi text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">Total por Cobrar (Fiados)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold tracking-tight">${totalPendingUsdc.toFixed(2)}</span>
              <span className="text-sm font-semibold text-emerald-200">USDC</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 mt-1">
              Equiv. aprox: ${(totalPendingUsdc * rate).toLocaleString('es-AR')} ARS
            </p>
          </div>

          <button
            onClick={onNavigateToNew}
            className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
          >
            <GoldFiarCoin size="md" />
            <span className="text-[10px] font-black text-amber-200 mt-1 tracking-tight drop-shadow-xs">Fiar</span>
          </button>
        </div>

        {/* Métricas secundarias */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-emerald-400/30 text-center">
          <div>
            <span className="text-[10px] text-emerald-200 block">Ventas Fiadas</span>
            <span className="text-sm font-bold">${merchant.totalSalesUsdc}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block">Cobrados</span>
            <span className="text-sm font-bold text-white">{paidFiados.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block">En Espera</span>
            <span className="text-sm font-bold text-emerald-200">{activeFiados.length}</span>
          </div>
        </div>
      </div>

      {/* Indicador de Seguro y Tasa Dinámica */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              merchant.currentInsuranceFee > 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Seguro de Cobro Actuarial</h3>
              <p className="text-[10px] text-gray-400">Protección contra incobrables</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block font-medium">Tasa de Prima</span>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
              merchant.currentInsuranceFee > 5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {merchant.currentInsuranceFee}%
            </span>
          </div>
        </div>

        {/* Explicación del modelo actuarial dinámico y cobrabilidad */}
        <div className="mt-3 bg-gray-50 rounded-xl p-2.5 text-[11px] text-gray-600 flex items-start gap-2 border border-gray-100">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Modelo Actuarial Dinámico:</strong> Tu prima actual es <strong>{merchant.currentInsuranceFee}%</strong> (mora histórica: {merchant.defaultRate}%). Varía según el índice de cobrabilidad de tu almacén: si cuidas a quién fías y cobras a término, tu tasa baja hacia el piso del 2.5%; si aumentan los incobrables, sube progresivamente.
          </p>
        </div>
      </div>

      {/* Lista de Fiados Activos con Foto */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Fiados Pendientes ({activeFiados.length})</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">Con foto on-chain</span>
        </div>

        {activeFiados.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 p-6">
            <p className="text-xs text-gray-500 font-medium">No tienes fiados pendientes en este momento.</p>
            <button
              onClick={onNavigateToNew}
              className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
            >
              + Registrar primer fiado
            </button>
          </div>
        ) : (
          activeFiados.map(f => (
            <div key={f.id} className="glass-card rounded-2xl p-3.5 border border-gray-100 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Thumbnail de foto del ticket/mercaderia */}
                  <button
                    onClick={() => setViewingPhoto(f.photoReceiptUrl)}
                    className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group"
                  >
                    <img src={f.photoReceiptUrl} alt="Ticket" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900">{f.customerName}</h4>
                      <span className="text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.2 rounded-md">DID</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-1 max-w-[170px]">{f.itemsDescription}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Vence: {new Date(f.dueDate).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-gray-900 block">${f.amountUsdc}</span>
                  <span className="text-[10px] text-gray-400">${f.amountArs.toLocaleString('es-AR')} ARS</span>
                </div>
              </div>

              {/* Botonera de acciones */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFiadoForQr(f)}
                    className="text-gray-500 font-semibold hover:text-gray-800 flex items-center gap-1"
                  >
                    Ver QR
                  </button>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Webhook Activo</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPayingFiado(f)}
                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors text-[10px]"
                    title="Si el cliente te entrega billetes en mano"
                  >
                    Efectivo
                  </button>

                  <button
                    onClick={() => handleClaim(f.id)}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors flex items-center gap-0.5 text-[10px]"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Seguro
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Cobro / Repayment (Mercado Pago, Cuenta DNI, Efectivo, Solana) */}
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
          <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto} alt="Comprobante ampliado" className="w-full rounded-2xl max-h-[70vh] object-contain" />
            <button
              onClick={() => setViewingPhoto(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
