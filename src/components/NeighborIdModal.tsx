import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { QrImage } from './QrImage';
import { X, IdCard, Copy, Check } from 'lucide-react';

interface NeighborIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// QR con la clave PÚBLICA del vecino: lo único que el almacén necesita para armarle un fiado
export const NeighborIdModal: React.FC<NeighborIdModalProps> = ({ isOpen, onClose }) => {
  const { customer, neighborIdUrl, tr } = useTefi();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(neighborIdUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 dark:border-gray-800 my-auto">
        <button
          onClick={onClose}
          aria-label={tr('Close', 'Cerrar')}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2">
          <IdCard className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white">{tr('My Tefi QR', 'Mi QR Tefi')}</h3>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {tr('The store scans it once to add you to its neighbor list', 'El almacén lo escanea una vez para agendarte como vecino')}
        </p>

        <div className="my-3 p-3 bg-white border-2 border-emerald-500/80 rounded-2xl shadow-inner">
          <QrImage value={neighborIdUrl} alt={tr('My Tefi QR', 'Mi QR Tefi')} />
        </div>

        <p className="text-[10px] font-mono text-gray-500 break-all bg-gray-50 border border-gray-100 rounded-xl p-2">
          {customer.walletAddress}
        </p>
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          {tr(
            'It carries only your public key and name. Your private key never leaves this phone.',
            'Lleva solo tu clave pública y tu nombre. Tu clave privada nunca sale de este teléfono.'
          )}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] bg-white hover:bg-gray-50 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            <span>{copied ? tr('Copied!', '¡Copiado!') : tr('Copy link', 'Copiar link')}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl gradient-tefi text-white font-bold text-[11px] cursor-pointer"
          >
            {tr('Done', 'Listo')}
          </button>
        </div>
      </div>
    </div>
  );
};
