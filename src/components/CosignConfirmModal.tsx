import React, { useState } from 'react';
import { IncomingCosign, useTefi } from '../context/TefiContext';
import { CheckCircle2, AlertTriangle, ShieldCheck, X, Store, Calendar, ArrowRight, Loader2, ExternalLink, PenLine } from 'lucide-react';
import { getSolanaAccountUrl, getSolanaExplorerUrl } from '../solana/connection';
import { shortAddress } from '../services/libreta';

interface CosignConfirmModalProps {
  incoming: IncomingCosign;
  onClose: () => void;
}

// Teléfono del vecino: revisa lo que firmó el almacén y agrega su propia firma
export const CosignConfirmModal: React.FC<CosignConfirmModalProps> = ({ incoming, onClose }) => {
  const { customer, approveCosign, language, tr } = useTefi();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const isIssue = incoming.kind === 'issue';
  const locale = language === 'en' ? 'en-US' : 'es-AR';
  const newDebt = Math.max(0, +(customer.currentDebt + (isIssue ? incoming.amountUsdc : -incoming.amountUsdc)).toFixed(2));
  const isOnTime = Date.now() <= new Date(incoming.dueDate).getTime();

  const handleConfirm = async () => {
    setError(null);
    setIsSigning(true);
    const res = await approveCosign(incoming);
    setIsSigning(false);
    if (res.success) {
      setSignature(res.signature);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 dark:border-gray-800 my-auto">
        <button
          onClick={onClose}
          disabled={isSigning}
          aria-label={tr('Close', 'Cerrar')}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {signature ? (
          <div className="py-2 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {tr('Co-signed on Solana Devnet', 'Co-firmado en Solana Devnet')}
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mt-2">
                {isIssue ? tr('Fiado added to your passbook', 'Fiado asentado en tu libreta') : tr('Fiado settled', 'Fiado saldado')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isIssue
                  ? tr(
                      `$${incoming.amountUsdc.toFixed(2)} USDC with ${incoming.storeName}, signed by both of you.`,
                      `$${incoming.amountUsdc.toFixed(2)} USDC con ${incoming.storeName}, firmado por los dos.`
                    )
                  : tr(
                      `${incoming.storeName} confirmed your payment of $${incoming.amountUsdc.toFixed(2)} USDC. Your score and limit were updated on-chain.`,
                      `${incoming.storeName} confirmó tu pago de $${incoming.amountUsdc.toFixed(2)} USDC. Tu score y tu límite se actualizaron on-chain.`
                    )}
              </p>
            </div>

            <a
              href={getSolanaExplorerUrl(signature)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{tr('View transaction on Solana Explorer', 'Ver transacción en Solana Explorer')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-[10px] text-gray-400 font-mono break-all">{signature}</p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl gradient-tefi text-white font-black text-xs shadow-md active:scale-98 transition-transform cursor-pointer"
            >
              {tr('Back to my passbook', 'Volver a mi libreta')}
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Store className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800">
              {tr('Signed by the store · verified', 'Firmado por el almacén · verificado')}
            </span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
              {isIssue ? tr('Accept this fiado?', '¿Aceptar este fiado?') : tr('Confirm this repayment?', '¿Confirmar este repago?')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {isIssue
                ? tr('Review it and add your signature to record it in your passbook', 'Revisalo y agregá tu firma para asentarlo en tu libreta')
                : tr('The store confirms it received your payment. Add your signature to settle the fiado.', 'El almacén confirma que recibió tu pago. Agregá tu firma para saldar el fiado.')}
            </p>

            {/* Lo que dice la transacción que firmó el almacén */}
            <div className="mt-3.5 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700 text-left space-y-2.5">
              <div className="flex items-start justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-2 gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{tr('Store', 'Almacén')}</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{incoming.storeName}</h4>
                  <a
                    href={getSolanaAccountUrl(incoming.storeAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {shortAddress(incoming.storeAddress)}
                  </a>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {isIssue ? tr('Amount', 'Monto') : tr('Amount settled', 'Monto saldado')}
                  </span>
                  <p className="text-base font-black text-emerald-700 leading-tight">
                    ${Math.round(incoming.amountArs).toLocaleString(locale)} ARS
                  </p>
                  <span className="text-[10px] font-extrabold text-gray-500 font-mono">{incoming.amountUsdc.toFixed(2)} USDC</span>
                </div>
              </div>

              {incoming.itemsDescription && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{tr('Items:', 'Productos:')}</span>
                  <p className="text-xs font-medium text-gray-800 bg-white p-2 rounded-xl border border-gray-100 mt-0.5">
                    {incoming.itemsDescription}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{tr('Payment due date:', 'Fecha límite de pago:')}</span>
                </span>
                <span className="font-bold text-gray-900">{new Date(incoming.dueDate).toLocaleDateString(locale)}</span>
              </div>
            </div>

            {/* Impacto en la libreta */}
            <div className="mt-3 p-3 bg-purple-50/70 rounded-2xl border border-purple-100 text-left text-[11px] space-y-1.5">
              <div className="flex items-center justify-between font-bold text-purple-900">
                <span>{tr('Your passbook balance:', 'Tus consumos en libreta:')}</span>
                <span className="flex items-center gap-1">
                  <span>${customer.currentDebt.toFixed(2)}</span>
                  <ArrowRight className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">${newDebt.toFixed(2)} USDC</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 font-semibold pt-1 border-t border-purple-100">
                <span>{isIssue ? tr('If you pay on time:', 'Si pagás a término:') : tr('On-chain result:', 'Resultado on-chain:')}</span>
                <span className="font-extrabold text-emerald-600">
                  {isIssue || isOnTime
                    ? tr('+5 score · +$5 USDC limit', '+5 de score · +$5 USDC de límite')
                    : tr('Settled after the due date: no score bonus', 'Saldado fuera de término: sin bono de score')}
                </span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 text-[10px] text-gray-500 dark:text-gray-400 text-left leading-relaxed space-y-1">
              <p>
                <span className="font-bold text-gray-700 dark:text-gray-300">{tr('What you sign: ', 'Qué firmás: ')}</span>
                {tr(
                  `a Solana transaction for the Tefi program (${isIssue ? 'issue_fiado' : 'repay_fiado'}). You sign with the key stored on this phone; the store pays the network fee, so you need no SOL.`,
                  `una transacción de Solana del programa Tefi (${isIssue ? 'issue_fiado' : 'repay_fiado'}). Firmás con la clave guardada en este teléfono; el almacén paga la comisión de red, así que no necesitás SOL.`
                )}
              </p>
              {isIssue && (
                <p>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{tr('⚖️ Legal consent: ', '⚖️ Consentimiento legal: ')}</span>
                  {tr(
                    'by signing you consent to this store debt (Consumer Protection Law 24.240) and to recording your repayment history on-chain under a pseudonymous key (Data Protection Law 25.326). Purchase details stay on the phones; only their hash goes on-chain.',
                    'al firmar prestás conformidad a esta deuda de almacén (Ley 24.240 de Defensa del Consumidor) y al registro on-chain de tu historial de pagos bajo una clave seudónima (Ley 25.326). El detalle de la compra queda en los teléfonos; on-chain solo va su hash.'
                  )}
                </p>
              )}
              {incoming.includesProfileSetup && (
                <p>
                  {tr(
                    'This is your first fiado: the transaction also creates your on-chain credit profile, paid by the store.',
                    'Es tu primer fiado: la transacción también crea tu perfil crediticio on-chain, a cargo del almacén.'
                  )}
                </p>
              )}
            </div>

            {error && (
              <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-3 space-y-2">
              <button
                onClick={handleConfirm}
                disabled={isSigning}
                className="w-full py-3.5 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tr('Signing and sending to Solana Devnet...', 'Firmando y enviando a Solana Devnet...')}</span>
                  </>
                ) : (
                  <>
                    <PenLine className="w-4 h-4" />
                    <span>{isIssue ? tr('Sign & accept fiado', 'Firmar y aceptar fiado') : tr('Sign & settle fiado', 'Firmar y saldar fiado')}</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={isSigning}
                className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition-colors cursor-pointer"
              >
                {tr('Reject', 'Rechazar')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
