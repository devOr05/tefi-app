import React, { useEffect, useState } from 'react';
import { FiadoRecord, FiadoQrPayload } from '../types/tefi';
import { QrCode, X, ShieldCheck, ExternalLink, Copy, Check, Share2, Loader2, Sparkles } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';
import QRCode from 'qrcode';

interface QrModalProps {
  fiado: FiadoRecord;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ fiado, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // IMPORTANTE: Nunca incluir imágenes base64 pesadas (50KB+) dentro del código QR,
  // ya que el estándar QR colapsa con más de 2.5KB. Para el QR usamos una URL ligera
  // y la foto real se preserva en la memoria local del comercio.
  const sanitizedPhotoUrl =
    fiado.photoReceiptUrl && !fiado.photoReceiptUrl.startsWith('data:')
      ? fiado.photoReceiptUrl
      : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';

  const qrPayload: FiadoQrPayload = {
    protocol: 'tefi',
    version: '1.0',
    action: 'FIADO_REQUEST',
    data: {
      id: fiado.id,
      merchantId: fiado.merchantId,
      merchantName: fiado.merchantName,
      customerId: fiado.customerId,
      customerName: fiado.customerName,
      amountArs: fiado.amountArs,
      amountUsdc: fiado.amountUsdc,
      itemsDescription: fiado.itemsDescription || 'Compra de almacén',
      photoReceiptUrl: sanitizedPhotoUrl,
      createdAt: fiado.createdAt,
      dueDate: fiado.dueDate,
      nonce: fiado.nonce,
      txSignature: fiado.txSignature
    }
  };

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://tefi-app-virid.vercel.app';
  const fiadoUrl = `${baseUrl}/?fiado=${encodeURIComponent(JSON.stringify(qrPayload))}`;

  useEffect(() => {
    let isMounted = true;

    // Generar imagen PNG del código QR usando toDataURL (100% declarativo y compatible móvil)
    QRCode.toDataURL(fiadoUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setQrError(null);
        }
      })
      .catch((err) => {
        console.error('Error al generar código QR:', err);
        if (isMounted) {
          setQrError('No se pudo generar el código QR.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fiadoUrl]);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(fiadoUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  const shareText = `Hola! Don Tito te generó un fiado en Tefi por $${fiado.amountArs.toLocaleString('es-AR')} ARS (${fiado.amountUsdc} USDC) para: "${fiado.itemsDescription}". Confírmalo acá: ${fiadoUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-base font-black text-gray-900">QR de Fiado Generado</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          El cliente escanea este QR desde su Tefi o con la cámara de su celular
        </p>

        {/* Contenedor del QR Real */}
        <div className="my-3 p-3 bg-white border-2 border-emerald-500/80 rounded-2xl shadow-inner inline-flex flex-col items-center justify-center min-w-[230px] min-h-[230px] relative">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Código QR Fiado Tefi"
              className="w-52 h-52 object-contain rounded-xl block animate-in fade-in duration-200"
            />
          ) : qrError ? (
            <div className="p-4 text-center text-rose-500 text-xs">
              <p>{qrError}</p>
              <button
                onClick={() => setQrDataUrl(null)}
                className="mt-2 text-[11px] text-emerald-600 underline font-bold"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs font-semibold">Generando QR On-Chain...</span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>QR P2P Directo • Sin Intermediarios</span>
          </div>
        </div>

        {/* Resumen del Fiado */}
        <div className="bg-gray-50 rounded-2xl p-3 text-left border border-gray-100 text-xs mb-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Monto total:</span>
            <span className="font-black text-emerald-700 text-sm">
              ${fiado.amountArs.toLocaleString('es-AR')} ARS
              <span className="text-xs font-bold text-gray-500 ml-1">({fiado.amountUsdc} USDC)</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Comercio:</span>
            <span className="font-semibold text-gray-800">{fiado.merchantName}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Detalle:</span>
            <span className="font-semibold text-gray-700 truncate max-w-[180px]">
              {fiado.itemsDescription || 'Compra de almacén'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Vence:</span>
            <span className="font-semibold text-gray-800">
              {new Date(fiado.dueDate).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Botones de Compartir Alternativos */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-extrabold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Por WhatsApp</span>
          </a>
        </div>

        {fiado.txSignature && (
          <a
            href={getSolanaExplorerUrl(fiado.txSignature)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] text-purple-700 hover:text-purple-900 font-mono mb-3 underline decoration-purple-300"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ver Tx Inicial en Solana Devnet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl gradient-tefi text-white font-black text-xs shadow-md active:scale-98 transition-transform cursor-pointer"
        >
          Listo / Volver al Panel
        </button>
      </div>
    </div>
  );
};
