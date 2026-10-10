import React, { useEffect, useRef, useState } from 'react';
import { PendingCosign } from '../types/tefi';
import { useTefi } from '../context/TefiContext';
import { QrImage } from './QrImage';
import { QrCode, X, ShieldCheck, ExternalLink, Copy, Check, Share2, Loader2, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

interface CosignQrModalProps {
  request: PendingCosign;
  onClose: () => void;
}

const STATUS_POLL_MS = 3000;

// Teléfono del almacén: muestra la transacción ya firmada por el almacén y espera la firma del vecino
export const CosignQrModal: React.FC<CosignQrModalProps> = ({ request, onClose }) => {
  const { language, tr, isSingleDeviceDemo, customer, refreshCosignRequest, checkCosignRequest, handOffCosignToNeighbor } = useTefi();
  const [current, setCurrent] = useState<PendingCosign>(request);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000)));
  const [confirmedSignature, setConfirmedSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Los temporizadores leen siempre el último pedido generado
  const currentRef = useRef(current);
  currentRef.current = current;
  const settledRef = useRef(false);
  const refreshingRef = useRef(false);
  const checkingRef = useRef(false);

  const isIssue = current.kind === 'issue';
  const locale = language === 'en' ? 'en-US' : 'es-AR';

  // El almacén conoce el id de la transacción (su propia firma): consulta si el vecino ya la envió
  useEffect(() => {
    const poll = setInterval(async () => {
      // Si la consulta anterior sigue esperando al nodo no se lanza otra encima
      if (settledRef.current || checkingRef.current) return;
      checkingRef.current = true;
      const status = await checkCosignRequest(currentRef.current).finally(() => {
        checkingRef.current = false;
      });
      if (status.state === 'pending' || settledRef.current) return;
      settledRef.current = true;
      if (status.state === 'confirmed') {
        setConfirmedSignature(status.signature);
      } else {
        setError(status.error);
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(poll);
  }, []);

  // El blockhash vence: antes de que pase, el almacén vuelve a firmar con uno nuevo y el QR se actualiza solo
  useEffect(() => {
    const tick = setInterval(async () => {
      if (settledRef.current) return;
      const remaining = Math.ceil((currentRef.current.expiresAt - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
      if (remaining > 0 || refreshingRef.current) return;

      refreshingRef.current = true;
      const res = await refreshCosignRequest(currentRef.current);
      refreshingRef.current = false;
      if (settledRef.current) return;
      if (res.success) {
        setCurrent(res.request);
        setError(null);
      } else {
        // Sin red no se puede volver a firmar: se reintenta en unos segundos en lugar de insistir cada segundo
        setCurrent(prev => ({ ...prev, expiresAt: Date.now() + 5000 }));
        setError(res.error);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(current.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    const text = isIssue
      ? tr(
          `${current.neighbor.name}: review and co-sign your fiado of $${current.amountArs.toLocaleString('en-US')} ARS on Tefi`,
          `${current.neighbor.name}: revisá y co-firmá tu fiado de $${current.amountArs.toLocaleString('es-AR')} ARS en Tefi`
        )
      : tr(
          `${current.neighbor.name}: co-sign the repayment of your fiado on Tefi`,
          `${current.neighbor.name}: co-firmá el repago de tu fiado en Tefi`
        );
    if (navigator.share) {
      navigator.share({ text, url: current.url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${current.url}`)}`, '_blank', 'noreferrer');
    }
  };

  const isThisDeviceNeighbor = isSingleDeviceDemo && current.neighbor.address === customer.walletAddress;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 dark:border-gray-800 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer"
          aria-label={tr('Close', 'Cerrar')}
        >
          <X className="w-4 h-4" />
        </button>

        {confirmedSignature ? (
          <div className="py-2 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {tr('Co-signed on Solana Devnet', 'Co-firmado en Solana Devnet')}
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mt-2">
                {isIssue ? tr('Fiado recorded on-chain', 'Fiado asentado on-chain') : tr('Repayment recorded on-chain', 'Repago asentado on-chain')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {tr(
                  `${current.neighbor.name} signed from their phone. The transaction carries two signatures: store and neighbor.`,
                  `${current.neighbor.name} firmó desde su teléfono. La transacción lleva dos firmas: almacén y vecino.`
                )}
              </p>
            </div>

            <a
              href={getSolanaExplorerUrl(confirmedSignature)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{tr('View transaction on Solana Explorer', 'Ver transacción en Solana Explorer')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-[10px] text-gray-400 font-mono break-all">{confirmedSignature}</p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl gradient-tefi text-white font-black text-xs shadow-md active:scale-98 transition-transform cursor-pointer"
            >
              {tr('Done', 'Listo')}
            </button>
          </div>
        ) : (
          <>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-gray-900 dark:text-white">
              {isIssue ? tr('Fiado signed by the store', 'Fiado firmado por el almacén') : tr('Repayment signed by the store', 'Repago firmado por el almacén')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {tr(
                `${current.neighbor.name} scans this QR with their own phone to add the second signature`,
                `${current.neighbor.name} escanea este QR con su propio teléfono para agregar la segunda firma`
              )}
            </p>

            {/* QR con la transacción parcialmente firmada */}
            <div className="my-3 p-3 bg-white border-2 border-emerald-500/80 rounded-2xl shadow-inner">
              <QrImage value={current.url} alt={tr('Tefi co-sign QR', 'QR de co-firma Tefi')} />

              <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>
                  {secondsLeft > 0
                    ? tr(`Waiting for the neighbor's signature · QR renews in ${secondsLeft}s`, `Esperando la firma del vecino · el QR se renueva en ${secondsLeft}s`)
                    : tr('Renewing QR...', 'Renovando QR...')}
                </span>
              </div>
            </div>

            {/* Resumen de lo que el almacén firmó */}
            <div className="bg-gray-50 rounded-2xl p-3 text-left border border-gray-100 text-xs mb-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{isIssue ? tr('Amount:', 'Monto:') : tr('Settles:', 'Salda:')}</span>
                <span className="font-black text-emerald-700 text-sm">
                  ${current.amountArs.toLocaleString(locale)} ARS
                  <span className="text-xs font-bold text-gray-500 ml-1">({current.amountUsdc.toFixed(2)} USDC)</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">{tr('Neighbor:', 'Vecino:')}</span>
                <span className="font-semibold text-gray-800">{current.neighbor.name}</span>
              </div>
              {current.itemsDescription && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">{tr('Items:', 'Detalle:')}</span>
                  <span className="font-semibold text-gray-700 truncate max-w-[180px]">{current.itemsDescription}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">{tr('Due date:', 'Vence:')}</span>
                <span className="font-semibold text-gray-800">{new Date(current.dueDate).toLocaleDateString(locale)}</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-gray-50 border border-gray-200/60 text-[10px] text-gray-500 text-left leading-relaxed mb-3 space-y-1">
              <p>
                <span className="font-bold text-gray-700">{tr('Two signatures, two phones: ', 'Dos firmas, dos teléfonos: ')}</span>
                {tr(
                  'the store already signed and pays the network fee. Nothing is recorded until the neighbor signs with the key on their own phone.',
                  'el almacén ya firmó y paga la comisión de red. No se asienta nada hasta que el vecino firme con la clave de su propio teléfono.'
                )}
              </p>
              {current.includesProfileSetup && (
                <p>
                  {tr(
                    'First fiado for this neighbor: the same transaction creates their on-chain credit profile, paid by the store.',
                    'Primer fiado de este vecino: la misma transacción crea su perfil crediticio on-chain, a cargo del almacén.'
                  )}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">{tr('Copied!', '¡Copiado!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>{tr('Copy Link', 'Copiar Enlace')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{tr('Send link', 'Enviar link')}</span>
              </button>
            </div>

            {isThisDeviceNeighbor && (
              <button
                onClick={() => handOffCosignToNeighbor(current.url)}
                className="w-full mb-3 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{tr('Single-device demo: open as the neighbor on this device', 'Demo en un solo dispositivo: abrir como el vecino en este dispositivo')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors cursor-pointer"
            >
              {tr('Close', 'Cerrar')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
