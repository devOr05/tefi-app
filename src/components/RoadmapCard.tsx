import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Map } from 'lucide-react';

// Lo que todavía NO está construido. La app solo muestra como función lo que hoy corre on-chain.
export const RoadmapCard: React.FC = () => {
  const { tr } = useTefi();

  const items = [
    tr(
      'Solana Attestation Service: a standard attestation per on-time repayment, readable by any lender.',
      'Solana Attestation Service: una atestación estándar por cada repago a término, legible por cualquier prestamista.'
    ),
    tr(
      'Embedded wallets: keys out of the browser storage before any pilot with real neighbors.',
      'Wallets embebidas: sacar las claves del almacenamiento del navegador antes de un piloto con vecinos reales.'
    ),
    tr(
      'Repayment links over WhatsApp (Solana Actions & Blinks).',
      'Links de repago por WhatsApp (Solana Actions & Blinks).'
    ),
    tr(
      'Mutual guarantee fund for stores, only with a regulated partner.',
      'Fondo mutual de garantía para almacenes, solo con un socio regulado.'
    )
  ];

  return (
    <div className="rounded-3xl p-4 border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-2">
      <div className="flex items-center gap-2">
        <Map className="w-4 h-4 text-gray-400" />
        <h4 className="font-bold text-gray-700 dark:text-gray-300">{tr('Roadmap · not built yet', 'Roadmap · todavía no construido')}</h4>
      </div>
      <ul className="list-disc pl-4 space-y-1 text-[11px] leading-snug">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};
