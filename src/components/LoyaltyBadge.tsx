import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Award, Gift, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoyaltyBadge: React.FC = () => {
  const { customer } = useTefi();

  const PERKS = [
    { title: '10% OFF en Fiambrería', points: 250, unlocked: customer.loyaltyPoints >= 250 },
    { title: 'Plazo extra de 7 días', points: 500, unlocked: customer.loyaltyPoints >= 500 },
    { title: 'Sin interés de penalización', points: 750, unlocked: customer.loyaltyPoints >= 750 }
  ];

  return (
    <div className="glass-card rounded-3xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Programa Fidelidad Barrial</h3>
            <p className="text-[10px] text-gray-400">Puntos por pagar a término</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-extrabold text-amber-700">{customer.loyaltyPoints} pts</span>
        </div>
      </div>

      {/* Beneficios canjeables */}
      <div className="space-y-2 mt-4">
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
  );
};
