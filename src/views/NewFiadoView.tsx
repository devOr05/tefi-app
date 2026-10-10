import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { CameraCapture } from '../components/CameraCapture';
import { QrModal } from '../components/QrModal';
import { FiadoRecord } from '../types/tefi';
import { ArrowLeft, Sparkles, QrCode, AlertCircle, ShoppingBag } from 'lucide-react';

export const NewFiadoView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { createFiado, customer, exchangeRate, language, t } = useTefi();
  const [amountArs, setAmountArs] = useState<string>('');
  const [itemsDescription, setItemsDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [createdFiado, setCreatedFiado] = useState<FiadoRecord | null>(null);

  const rate = exchangeRate.rate || 1615;
  const calculatedUsdc = amountArs ? +(parseFloat(amountArs) / rate).toFixed(2) : 0;
  const availableLimit = Math.max(0, +(customer.maxCreditLimit - customer.currentDebt).toFixed(1));

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amountArs || parseFloat(amountArs) <= 0) {
      setError(language === 'en' ? 'Please enter a valid amount.' : 'Por favor ingresa un monto válido.');
      return;
    }

    if (!photoUrl) {
      setError(language === 'en' ? 'Please take a photo of the receipt or products.' : 'Es necesario sacar una foto del ticket o de los productos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createFiado({
        amountArs: parseFloat(amountArs),
        amountUsdc: calculatedUsdc,
        itemsDescription: itemsDescription || (language === 'en' ? 'Store purchase' : 'Compra de almacén'),
        photoReceiptUrl: photoUrl
      });

      if (!res.success) {
        setError(res.error || (language === 'en' ? 'Error creating store credit.' : 'Error al crear el fiado.'));
        return;
      }

      if (res.fiado) {
        setCreatedFiado(res.fiado);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            {language === 'en' ? 'New Credit with Receipt Photo' : 'Nuevo Fiado con Foto'}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">
            {language === 'en' ? `Record credit purchase for ${customer.name}` : `Registrar compra para ${customer.name}`}
          </p>
        </div>
      </div>

      {/* Resumen del Vecino y Cupo Disponible */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block">
            {language === 'en' ? `Customer: ${customer.name}` : `Vecino: ${customer.name}`}
          </span>
          <span className="text-xs text-emerald-950 dark:text-emerald-100 font-extrabold">
            {language === 'en' ? 'Available:' : 'Cupo disponible:'} {availableLimit} USDC (${(availableLimit * rate).toLocaleString('es-AR')} ARS)
          </span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
          Score: {customer.creditScore} pts
        </span>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        {/* Monto en Pesos y conversión a USDC */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {language === 'en' ? 'Amount in Pesos ($ ARS)' : 'Monto en Pesos ($ ARS)'}
          </label>
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
          <p className="text-[10px] text-gray-400 mt-1">
            {language === 'en'
              ? `Live Oracle: 1 USDC = $${rate.toLocaleString('es-AR')} ARS (${exchangeRate.source})`
              : `Cotización en vivo: 1 USDC = $${rate.toLocaleString('es-AR')} ARS (${exchangeRate.source})`}
          </p>
        </div>

        {/* Descripción de artículos */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {language === 'en' ? 'Items Description' : 'Detalle de Productos'}
          </label>
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={language === 'en' ? 'e.g. 1 Milk, 1 Yerba, 500g cheese' : 'Ej: 1 Leche, 1 Yerba, 500g queso cremoso'}
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
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-transform flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        >
          <QrCode className="w-4 h-4" />
          <span>{isSubmitting ? (language === 'en' ? 'Issuing on Solana Devnet...' : 'Emitiendo en Solana Devnet...') : (language === 'en' ? 'Generate Credit & Show QR' : 'Generar Fiado y Mostrar QR')}</span>
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
