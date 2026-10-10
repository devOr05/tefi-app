import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';

// El almacén paga comisiones y rent de cada fiado (~0.002 SOL): sin SOL de devnet no puede firmar
const MIN_STORE_BALANCE_SOL = 0.01;

export const StoreFundingNotice: React.FC = () => {
  const { merchant, solanaBalance, hasSynced, requestAirdrop, isAirdropLoading, tr } = useTefi();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hasta no conocer el saldo real no se avisa nada
  if (!hasSynced || solanaBalance >= MIN_STORE_BALANCE_SOL) return null;

  const handleAirdrop = async () => {
    setFeedback(null);
    const res = await requestAirdrop();
    setFeedback(res.success ? tr('+1 SOL credited on Devnet.', '+1 SOL acreditado en Devnet.') : res.error || null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(merchant.walletAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-snug">
          <strong>{tr('The store wallet has no devnet SOL. ', 'La billetera del almacén no tiene SOL de devnet. ')}</strong>
          {tr(
            'The store pays the network fee and the account rent of every fiado (about 0.002 SOL), so neighbors never need SOL.',
            'El almacén paga la comisión de red y el rent de cada fiado (unos 0,002 SOL), así los vecinos nunca necesitan SOL.'
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleAirdrop}
          disabled={isAirdropLoading}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold disabled:opacity-60 cursor-pointer"
        >
          {isAirdropLoading ? tr('Requesting...', 'Solicitando...') : tr('Request 1 devnet SOL', 'Pedir 1 SOL de devnet')}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{tr('Copy store address', 'Copiar dirección del almacén')}</span>
        </button>
        <a
          href="https://faucet.solana.com/"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline flex items-center gap-1"
        >
          <span>faucet.solana.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {feedback && <p className="font-semibold">{feedback}</p>}
    </div>
  );
};
