import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Award, Gift, Sparkles, CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

export const LoyaltyBadge: React.FC = () => {
  const { customer, fiados } = useTefi();

  const pastFiados = fiados.filter(f => f.status === 'PAID');

  const PERKS = [
    { title: '10% OFF en Fiambrería', points: 250, unlocked: customer.loyaltyPoints >= 250 },
    { title: 'Plazo extra de 7 días', points: 500, unlocked: customer.loyaltyPoints >= 500 },
    { title: 'Sin interés de penalización', points: 750, unlocked: customer.loyaltyPoints >= 750 }
  ];

  return (
    <div className="space-y-4">
      {/* Tarjeta de Programa de Fidelidad */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 fill-amber-700/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-gray-900">Programa Fidelidad Barrial</h3>
                <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.2 rounded-full">
                  Nivel {customer.tier}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Puntos acumulados por pagar a término</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-800">{customer.loyaltyPoints} pts</span>
          </div>
        </div>

        {/* Beneficios canjeables */}
        <div className="space-y-2 mt-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block px-1">
            Beneficios por Nivel de Cumplimiento
          </span>
          {PERKS.map((perk, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                perk.unlocked
                  ? 'bg-emerald-50/50 border-emerald-200 text-gray-800 font-medium'
                  : 'bg-gray-50 border-gray-100 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gift className={`w-3.5 h-3.5 ${perk.unlocked ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>{perk.title}</span>
              </div>
              {perk.unlocked ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Canjeable
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-semibold">{perk.points} pts</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historial de Cumplimiento con Detalle de Puntos Sumados */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Historial de Cumplimiento ({pastFiados.length})
          </h3>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            20 pts por cada USDC saldado
          </span>
        </div>

        {pastFiados.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 p-6">
            <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Aún no registras fiados saldados.</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Cada compra al fiado que abones a tiempo sumará puntos canjeables aquí.</p>
          </div>
        ) : (
          pastFiados.map(f => {
            const pointsEarned = Math.round(f.amountUsdc * 20);
            return (
              <div key={f.id} className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex flex-col gap-2 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-gray-900 block">{f.merchantName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          {f.repaidAt ? new Date(f.repaidAt).toLocaleDateString('es-AR') : '23/09/2026'}
                        </span>
                        {f.paymentMethod === 'MERCADO_PAGO' && (
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md">
                            Mercado Pago
                          </span>
                        )}
                        {f.paymentMethod === 'CUENTA_DNI' && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                            Cuenta DNI
                          </span>
                        )}
                        {f.paymentMethod === 'CASH' && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md">
                            Efectivo
                          </span>
                        )}
                        {f.paymentMethod === 'ABUNDANCE_FOUNTAIN' && (
                          <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-md">
                            Fuente Abundancia
                          </span>
                        )}
                        {(!f.paymentMethod || f.paymentMethod === 'SOLANA_USDC') && (
                          <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded-md">
                            USDC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-xs text-gray-900 block">${f.amountUsdc.toFixed(2)} USDC</span>
                    {f.txSignature && (
                      <a
                        href={getSolanaExplorerUrl(f.txSignature)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5 justify-end"
                      >
                        <span>Tx Devnet</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Detalle de Puntos Sumados */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Recompensa acreditada:</span>
                  <div className="flex items-center gap-1 font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>+{pointsEarned} pts Tefi sumados</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
