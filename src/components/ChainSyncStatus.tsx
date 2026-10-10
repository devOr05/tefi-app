import React from 'react';
import { useTefi } from '../context/TefiContext';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { PROGRAM_ID_STR, getSolanaAccountUrl } from '../solana/connection';

// De dónde salen los datos de la pantalla: cuentas del programa Tefi en Solana Devnet
export const ChainSyncStatus: React.FC = () => {
  const { isSyncing, syncFailed, syncFromChain, tr } = useTefi();

  return (
    <div className="flex items-center justify-between px-1 text-[10px] text-gray-400 dark:text-gray-500">
      <a
        href={getSolanaAccountUrl(PROGRAM_ID_STR)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 min-w-0"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncFailed ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
        <span className="truncate">
          {syncFailed
            ? tr('Solana Devnet did not respond: showing the last copy', 'Solana Devnet no respondió: se muestra la última copia')
            : tr(`Read from Solana Devnet · program ${PROGRAM_ID_STR.slice(0, 4)}…${PROGRAM_ID_STR.slice(-4)}`, `Leído de Solana Devnet · programa ${PROGRAM_ID_STR.slice(0, 4)}…${PROGRAM_ID_STR.slice(-4)}`)}
        </span>
        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
      </a>
      <button
        onClick={() => syncFromChain()}
        disabled={isSyncing}
        aria-label={tr('Refresh from chain', 'Actualizar desde la cadena')}
        className="p-1 rounded-md hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer shrink-0"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
