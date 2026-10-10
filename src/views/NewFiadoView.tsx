import React, { useEffect, useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { CameraCapture } from '../components/CameraCapture';
import { CosignQrModal } from '../components/CosignQrModal';
import { QrScannerModal } from '../components/QrScannerModal';
import { StoreFundingNotice } from '../components/StoreFundingNotice';
import { NeighborContact, PendingCosign } from '../types/tefi';
import { BASE_CREDIT_LIMIT_USDC, BASE_CREDIT_SCORE, OnChainCustomerProfile } from '../solana/program';
import { shortAddress } from '../services/libreta';
import { ArrowLeft, QrCode, AlertCircle, ShoppingBag, UserPlus, Loader2 } from 'lucide-react';

export const NewFiadoView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { createFiadoRequest, neighbors, addNeighbor, fetchNeighborProfile, exchangeRate, language, tr } = useTefi();
  const [selected, setSelected] = useState<NeighborContact | null>(neighbors[0] ?? null);
  // undefined = consultando; null = el vecino todavía no tiene perfil on-chain
  const [profile, setProfile] = useState<OnChainCustomerProfile | null | undefined>(undefined);
  const [amountArs, setAmountArs] = useState<string>('');
  const [itemsDescription, setItemsDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [request, setRequest] = useState<PendingCosign | null>(null);

  const rate = exchangeRate.rate || 1615;
  const calculatedUsdc = amountArs ? +(parseFloat(amountArs) / rate).toFixed(2) : 0;
  const locale = language === 'en' ? 'en-US' : 'es-AR';

  // Al agendarse el primer vecino queda elegido
  useEffect(() => {
    if (!selected && neighbors.length > 0) setSelected(neighbors[0]);
  }, [neighbors, selected]);

  // El almacén lee score y límite del vecino de su PDA, sin pedirle nada a Tefi
  useEffect(() => {
    if (!selected) return;
    let isCurrent = true;
    setProfile(undefined);
    fetchNeighborProfile(selected.address)
      .then(result => {
        if (isCurrent) setProfile(result);
      })
      .catch(() => {
        if (isCurrent) setProfile(null);
      });
    return () => {
      isCurrent = false;
    };
  }, [selected, fetchNeighborProfile]);

  const availableLimit = profile ? Math.max(0, +(profile.creditLimitUsdc - profile.activeDebtUsdc).toFixed(2)) : BASE_CREDIT_LIMIT_USDC;
  const score = profile ? profile.creditScore : BASE_CREDIT_SCORE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selected) {
      setError(tr("Scan the neighbor's Tefi QR first.", 'Primero escaneá el QR Tefi del vecino.'));
      return;
    }

    if (!amountArs || parseFloat(amountArs) <= 0) {
      setError(tr('Please enter a valid amount.', 'Por favor ingresa un monto válido.'));
      return;
    }

    if (!photoUrl) {
      setError(tr('Please take a photo of the receipt or products.', 'Es necesario sacar una foto del ticket o de los productos.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createFiadoRequest({
        neighbor: selected,
        amountArs: parseFloat(amountArs),
        amountUsdc: calculatedUsdc,
        itemsDescription,
        photoReceiptUrl: photoUrl
      });

      if (res.success) {
        setRequest(res.request);
      } else {
        setError(res.error);
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
          aria-label={tr('Back', 'Volver')}
          className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">{tr('New Fiado', 'Nuevo Fiado')}</h2>
          <p className="text-[11px] text-gray-400 font-medium">
            {tr('You sign first; the neighbor co-signs on their phone', 'Firmás vos primero; el vecino co-firma en su teléfono')}
          </p>
        </div>
      </div>

      <StoreFundingNotice />

      {/* Vecino al que se le fía */}
      <div className="glass-card rounded-3xl p-4 border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">{tr('Neighbor', 'Vecino')}</span>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{tr("Scan neighbor's QR", 'Escanear QR del vecino')}</span>
          </button>
        </div>

        {neighbors.length === 0 ? (
          <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
            {tr(
              'No neighbors yet. Ask the neighbor to open Tefi on their phone and show "My Tefi QR": it only shares their public key.',
              'Todavía no agendaste vecinos. Pedile al vecino que abra Tefi en su teléfono y muestre "Mi QR Tefi": solo comparte su clave pública.'
            )}
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {neighbors.map(n => (
              <button
                key={n.address}
                type="button"
                onClick={() => setSelected(n)}
                className={`shrink-0 px-3 py-2 rounded-2xl border text-left transition-all cursor-pointer ${
                  selected?.address === n.address
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 block">{n.name}</span>
                <span className="text-[10px] font-mono text-gray-400">{shortAddress(n.address)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Perfil crediticio del vecino leído de su cuenta on-chain */}
        {selected && (
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-3 flex items-center justify-between text-xs gap-2">
            {profile === undefined ? (
              <span className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {tr('Reading on-chain profile...', 'Leyendo perfil on-chain...')}
              </span>
            ) : (
              <>
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block">
                    {profile
                      ? tr('On-chain profile (CustomerProfile PDA)', 'Perfil on-chain (CustomerProfile PDA)')
                      : tr('No on-chain history yet: created with this first fiado', 'Sin historial on-chain: se crea con este primer fiado')}
                  </span>
                  <span className="text-xs text-emerald-950 dark:text-emerald-100 font-extrabold">
                    {tr('Available:', 'Cupo disponible:')} {availableLimit} USDC (${Math.round(availableLimit * rate).toLocaleString(locale)} ARS)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 shrink-0">
                  Score: {score} pts
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        {/* Monto en Pesos y conversión a USDC */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {tr('Amount in Pesos ($ ARS)', 'Monto en Pesos ($ ARS)')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
            <input
              type="number"
              placeholder="1500"
              value={amountArs}
              onChange={e => setAmountArs(e.target.value)}
              className="w-full pl-9 pr-24 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 font-extrabold text-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-lg border border-gray-100 text-xs font-bold text-purple-700 shadow-2xs">
              ≈ {calculatedUsdc} USDC
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {tr(
              `Exchange rate: 1 USDC = $${rate.toLocaleString(locale)} ARS (${exchangeRate.source})`,
              `Cotización: 1 USDC = $${rate.toLocaleString(locale)} ARS (${exchangeRate.source})`
            )}
          </p>
        </div>

        {/* Descripción de artículos */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {tr('Items Description', 'Detalle de Productos')}
          </label>
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              maxLength={80}
              placeholder={tr('e.g. 1 Milk, 1 Yerba, 500g cheese', 'Ej: 1 Leche, 1 Yerba, 500g queso cremoso')}
              value={itemsDescription}
              onChange={e => setItemsDescription(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {tr(
              'Stays on the two phones. Only a SHA-256 hash of the receipt is written on-chain.',
              'Queda en los dos teléfonos. On-chain solo se escribe un hash SHA-256 del ticket.'
            )}
          </p>
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
          <span>
            {isSubmitting
              ? tr('Signing as the store...', 'Firmando como almacén...')
              : tr('Sign & Show QR to the Neighbor', 'Firmar y Mostrar QR al Vecino')}
          </span>
        </button>
      </form>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={tr("Scan the neighbor's Tefi QR", 'Escanear el QR Tefi del vecino')}
        subtitle={tr('The neighbor shows it from "My Tefi QR" on their phone', 'El vecino lo muestra desde "Mi QR Tefi" en su teléfono')}
        onScan={async text => {
          const res = addNeighbor(text);
          if (!res.success) return res.error;
          setSelected(res.neighbor);
          setIsScannerOpen(false);
          return null;
        }}
      />

      {/* QR con la transacción firmada por el almacén, a la espera del vecino */}
      {request && (
        <CosignQrModal
          request={request}
          onClose={() => {
            setRequest(null);
            onBack();
          }}
        />
      )}
    </div>
  );
};
