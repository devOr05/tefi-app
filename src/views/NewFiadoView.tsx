import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { CameraCapture } from '../components/CameraCapture';
import { QrModal } from '../components/QrModal';
import { FiadoRecord } from '../types/tefi';
import { ArrowLeft, Sparkles, QrCode, AlertCircle, ShoppingBag } from 'lucide-react';

export const NewFiadoView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { createFiado, customer } = useTefi();
  const [amountArs, setAmountArs] = useState<string>('');
  const [itemsDescription, setItemsDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [createdFiado, setCreatedFiado] = useState<FiadoRecord | null>(null);

  const RATE_USDC_ARS = 1300; // Tasa de conversión de referencia
  const calculatedUsdc = amountArs ? +(parseFloat(amountArs) / RATE_USDC_ARS).toFixed(2) : 0;
  const availableLimit = Math.max(0, +(customer.maxCreditLimit - customer.currentDebt).toFixed(1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amountArs || parseFloat(amountArs) <= 0) {
      setError('Por favor ingresa un monto válido.');
      return;
    }

    if (!photoUrl) {
      setError('Es necesario sacar una foto del ticket o de los productos.');
      return;
    }

    const res = createFiado({
      amountArs: parseFloat(amountArs),
      amountUsdc: calculatedUsdc,
      itemsDescription: itemsDescription || 'Compra de almacén',
      photoReceiptUrl: photoUrl
    });

    if (!res.success) {
      setError(res.error || 'Error al crear el fiado.');
      return;
    }

    if (res.fiado) {
      setCreatedFiado(res.fiado);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">Nuevo Fiado con Foto</h2>
          <p className="text-[11px] text-gray-400 font-medium">Registrar compra para {customer.name}</p>
        </div>
      </div>

      {/* Límite disponible del cliente */}
      <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-emerald-800 font-semibold block">Crédito disponible de {customer.name}</span>
          <span className="text-xs text-emerald-950 font-extrabold">{availableLimit} USDC (${(availableLimit * RATE_USDC_ARS).toLocaleString('es-AR')} ARS)</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
          Score: {customer.creditScore} pts
        </span>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        {/* Monto en Pesos y conversión a USDC */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto en Pesos ($ ARS)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
            <input
              type="number"
              placeholder="15000"
              value={amountArs}
              onChange={e => setAmountArs(e.target.value)}
              className="w-full pl-9 pr-24 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 font-extrabold text-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-lg border border-gray-100 text-xs font-bold text-purple-700 shadow-2xs">
              ≈ {calculatedUsdc} USDC
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Fijado a 1 USDC = ${RATE_USDC_ARS} ARS (protegido contra devaluación)</p>
        </div>

        {/* Descripción de artículos */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Detalle de Productos</label>
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ej: 1 Leche, 1 Yerba, 500g queso cremoso"
              value={itemsDescription}
              onChange={e => setItemsDescription(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Captura de Foto del Ticket o Mercadería */}
        <CameraCapture onCapture={setPhotoUrl} initialPhoto={photoUrl} />

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-transform flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          <span>Generar Fiado y Mostrar QR</span>
        </button>
      </form>

      {/* Modal QR al crear */}
      {createdFiado && (
        <QrModal
          fiado={createdFiado}
          onClose={() => {
            setCreatedFiado(null);
            onBack();
          }}
        />
      )}
    </div>
  );
};
