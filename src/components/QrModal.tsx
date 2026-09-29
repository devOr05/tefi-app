import React from 'react';
import { FiadoRecord } from '../types/tefi';
import { QrCode, X, Check, ShieldCheck, ExternalLink } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

interface QrModalProps {
  fiado: FiadoRecord;
  onClose: () => void;
  onAccept?: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ fiado, onClose, onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900">QR de Fiado Generado</h3>
        <p className="text-xs text-gray-400 mt-0.5">El cliente escanea este QR para aceptar la compra</p>

        {/* QR Code SVG simulado realista */}
        <div className="my-5 p-4 bg-white border-2 border-emerald-500 rounded-2xl shadow-inner inline-block">
          <svg className="w-44 h-44 mx-auto text-gray-900" viewBox="0 0 100 100" fill="currentColor">
            {/* Patrones de esquina QR estándar */}
            <rect x="5" y="5" width="25" height="25" fill="#000" rx="3" />
            <rect x="10" y="10" width="15" height="15" fill="#fff" />
            <rect x="13" y="13" width="9" height="9" fill="#000" />

            <rect x="70" y="5" width="25" height="25" fill="#000" rx="3" />
            <rect x="75" y="10" width="15" height="15" fill="#fff" />
            <rect x="78" y="13" width="9" height="9" fill="#000" />

            <rect x="5" y="70" width="25" height="25" fill="#000" rx="3" />
            <rect x="10" y="75" width="15" height="15" fill="#fff" />
            <rect x="13" y="78" width="9" height="9" fill="#000" />

            {/* Datos simulados */}
            <rect x="35" y="10" width="6" height="6" />
            <rect x="45" y="15" width="6" height="6" />
            <rect x="55" y="10" width="6" height="6" />
            <rect x="35" y="25" width="6" height="6" />
            <rect x="45" y="30" width="6" height="6" />
            <rect x="15" y="40" width="6" height="6" />
            <rect x="25" y="45" width="6" height="6" />
            <rect x="35" y="40" width="6" height="6" />
            <rect x="45" y="45" width="6" height="6" />
            <rect x="55" y="40" width="6" height="6" />
            <rect x="65" y="45" width="6" height="6" />
            <rect x="75" y="40" width="6" height="6" />
            <rect x="85" y="45" width="6" height="6" />
            <rect x="40" y="60" width="6" height="6" />
            <rect x="50" y="65" width="6" height="6" />
            <rect x="60" y="60" width="6" height="6" />
            <rect x="70" y="70" width="6" height="6" />
            <rect x="80" y="75" width="6" height="6" />
            <rect x="70" y="85" width="6" height="6" />
            <rect x="80" y="85" width="6" height="6" />

            {/* Logo de Tefi al centro */}
            <circle cx="50" cy="50" r="12" fill="#00A650" />
            <text x="50" y="55" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">T</text>
          </svg>
        </div>

        {/* Resumen del Fiado */}
        <div className="bg-gray-50 rounded-2xl p-3 text-left border border-gray-100 text-xs mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500">Monto total:</span>
            <span className="font-extrabold text-emerald-600 text-sm">{fiado.amountUsdc} USDC (${fiado.amountArs.toLocaleString('es-AR')} ARS)</span>
          </div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-gray-500">Comercio:</span>
            <span className="font-semibold text-gray-800">{fiado.merchantName}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Vence:</span>
            <span className="font-semibold text-gray-800">{new Date(fiado.dueDate).toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        {fiado.txSignature && (
          <a
            href={getSolanaExplorerUrl(fiado.txSignature)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] text-purple-700 hover:text-purple-900 font-mono mb-4 underline decoration-purple-300"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ver Tx en Solana Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl gradient-tefi text-white font-bold text-xs shadow-md active:scale-98 transition-transform"
        >
          Listo / Cerrar
        </button>
      </div>
    </div>
  );
};
