import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Award, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';
import { getSolanaAccountUrl, getSolanaExplorerUrl } from '../solana/connection';
import { tierLabel } from '../i18n/translations';

// Historial de cumplimiento del vecino: fiados saldados y puntos, tal como figuran en sus cuentas on-chain
export const RepaymentHistoryView: React.FC = () => {
  const { customer, fiados, t, tr, language } = useTefi();
  const pastFiados = fiados.filter(f => f.status === 'PAID');
  const locale = language === 'en' ? 'en-US' : 'es-AR';

  return (
    <div className="space-y-4 pb-20">
      <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 fill-amber-700/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">{t('historyTitle')}</h3>
                <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.2 rounded-full">
                  {t('loyaltyTier')} {tierLabel(customer.tier, language)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-400">{t('loyaltySubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-800 dark:text-amber-300">{customer.loyaltyPoints} {t('points')}</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
          {tr(
            'Points are a counter in your on-chain profile (20 per USDC repaid). They are not redeemable yet.',
            'Los puntos son un contador de tu perfil on-chain (20 por cada USDC saldado). Todavía no son canjeables.'
          )}
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {tr('Settled fiados', 'Fiados saldados')} ({pastFiados.length})
          </h3>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
            {t('pointsEarnedBadge')}
          </span>
        </div>

        {pastFiados.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <CheckCircle2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('noPastFiados')}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t('noPastFiadosSub')}</p>
          </div>
        ) : (
          pastFiados.map(f => (
            <div
              key={f.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-800 shadow-2xs flex items-start justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white block truncate">{f.merchantName}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {f.repaidAt
                      ? new Date(f.repaidAt).toLocaleDateString(locale)
                      : tr('Settled on-chain', 'Saldado on-chain')}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-extrabold text-xs text-gray-900 dark:text-white block">${f.amountUsdc.toFixed(2)} USDC</span>
                <a
                  href={f.repayTxSignature ? getSolanaExplorerUrl(f.repayTxSignature) : getSolanaAccountUrl(f.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 justify-end"
                >
                  <span>{t('viewOnDevnet')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
