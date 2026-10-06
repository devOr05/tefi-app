import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import {
  Award,
  Gift,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Store,
  Tag,
  MapPin,
  PlusCircle,
  X,
  Send,
  Building2,
  BadgeCheck,
  ChevronRight
} from 'lucide-react';
import { getSolanaExplorerUrl } from '../solana/connection';

interface PartnerStore {
  id: string;
  name: string;
  category: string;
  categoryEn: string;
  address: string;
  discountPromo: string;
  discountPromoEn: string;
  verified: boolean;
  image: string;
}

const INITIAL_PARTNER_STORES: PartnerStore[] = [
  {
    id: 'store-1',
    name: 'Almacén Don Tito',
    category: 'Almacén & Bebidas',
    categoryEn: 'Groceries & Drinks',
    address: 'Av. San Martín 1420',
    discountPromo: '10% OFF en lácteos con libreta al día',
    discountPromoEn: '10% OFF on dairy with active passbook',
    verified: true,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'store-2',
    name: 'Fiambrería Los Dos Hermanos',
    category: 'Fiambrería & Quesos',
    categoryEn: 'Deli & Cheeses',
    address: 'Calle Belgrano 580',
    discountPromo: '15% OFF en quesos seleccionados',
    discountPromoEn: '15% OFF on selected cheeses',
    verified: true,
    image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'store-3',
    name: 'Panadería La Espiga Dorada',
    category: 'Panadería & Facturas',
    categoryEn: 'Bakery & Pastries',
    address: 'Rivadavia 2105',
    discountPromo: '6 medialunas de regalo con compra mayor a $10 USDC',
    discountPromoEn: 'Free 6 croissants on purchases over $10 USDC',
    verified: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'store-4',
    name: 'Verdulería San Cayetano',
    category: 'Frutas & Verduras de Estación',
    categoryEn: 'Fresh Produce & Fruits',
    address: 'Mitre 892',
    discountPromo: '2x1 en frutas de estación saldando a término',
    discountPromoEn: '2x1 on seasonal fruits settling on time',
    verified: true,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&auto=format&fit=crop&q=80'
  }
];

export const LoyaltyBadge: React.FC = () => {
  const { customer, fiados, t, language } = useTefi();
  const [partnerStores, setPartnerStores] = useState<PartnerStore[]>(INITIAL_PARTNER_STORES);
  const pastFiados = fiados.filter(f => f.status === 'PAID');

  const PERKS = [
    { title: language === 'en' ? '10% OFF on Deli' : '10% OFF en Fiambrería', points: 250, unlocked: customer.loyaltyPoints >= 250 },
    { title: language === 'en' ? 'Extra 7 days repayment grace' : 'Plazo extra de 7 días', points: 500, unlocked: customer.loyaltyPoints >= 500 },
    { title: language === 'en' ? 'Zero late penalty fee' : 'Sin interés de penalización', points: 750, unlocked: customer.loyaltyPoints >= 750 }
  ];

  return (
    <div className="space-y-4">
      {/* 1. Tarjeta de Programa de Fidelidad */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 fill-amber-700/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">{t('loyaltyTitle')}</h3>
                <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.2 rounded-full">
                  {t('loyaltyTier')} {customer.tier}
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

        {/* Beneficios canjeables */}
        <div className="space-y-2 mt-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 block px-1">
            {t('loyaltyPerksTitle')}
          </span>
          {PERKS.map((perk, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                perk.unlocked
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-gray-800 dark:text-gray-200 font-medium'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gift className={`w-3.5 h-3.5 ${perk.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'}`} />
                <span>{perk.title}</span>
              </div>
              {perk.unlocked ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('redeemable')}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{perk.points} {t('points')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Espacio de Publicidades de Lugares Adheridos / Productos (Carrusel y Vitrina Barrial) */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">{t('promosTitle')}</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-400">{t('promosSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Banners Destacados de Productos & Promos de Almacenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {partnerStores.slice(0, 2).map(store => (
            <div
              key={`banner-${store.id}`}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white p-3.5 flex items-center gap-3 border border-purple-800/40 shadow-sm"
            >
              <img
                src={store.image}
                alt={store.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md border border-emerald-400/30">
                    Promo Tefi
                  </span>
                  <BadgeCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">{store.name}</h4>
                <p className="text-[11px] text-purple-200 font-medium line-clamp-1">
                  {language === 'en' ? store.discountPromoEn : store.discountPromo}
                </p>
                <span className="text-[9px] text-gray-400 block mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> {store.address}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Lista de Almacenes Adheridos a la Red Tefi */}
      <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">{t('partnerStoresTitle')}</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-400">{t('partnerStoresSubtitle')}</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {partnerStores.length} {language === 'en' ? 'stores' : 'adheridos'}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {partnerStores.map(store => (
            <div key={store.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-gray-700"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{store.name}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
                    <span>{language === 'en' ? store.categoryEn : store.category}</span>
                    <span>•</span>
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{store.address}</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold line-clamp-1 mt-0.5">
                    🏷️ {language === 'en' ? store.discountPromoEn : store.discountPromo}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-[9px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md inline-block">
                  {t('activeInTefi')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Historial de Cumplimiento con Detalle de Puntos Sumados */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t('historyTitle')} ({pastFiados.length})
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
          pastFiados.map(f => {
            const pointsEarned = Math.round(f.amountUsdc * 20);
            return (
              <div
                key={f.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col gap-2 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-gray-900 dark:text-white block">{f.merchantName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {f.repaidAt ? new Date(f.repaidAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR') : '23/09/2026'}
                        </span>
                        {f.paymentMethod === 'MERCADO_PAGO' && (
                          <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-md">
                            Mercado Pago
                          </span>
                        )}
                        {f.paymentMethod === 'CUENTA_DNI' && (
                          <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-md">
                            Cuenta DNI
                          </span>
                        )}
                        {f.paymentMethod === 'CASH' && (
                          <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-md">
                            {language === 'en' ? 'Cash' : 'Efectivo'}
                          </span>
                        )}
                        {f.paymentMethod === 'ABUNDANCE_FOUNTAIN' && (
                          <span className="text-[9px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-1.5 py-0.2 rounded-md">
                            {language === 'en' ? 'Abundance Fountain' : 'Fuente Abundancia'}
                          </span>
                        )}
                        {(!f.paymentMethod || f.paymentMethod === 'SOLANA_USDC') && (
                          <span className="text-[9px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-1.5 py-0.2 rounded-md">
                            USDC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-xs text-gray-900 dark:text-white block">${f.amountUsdc.toFixed(2)} USDC</span>
                    {f.txSignature && (
                      <a
                        href={getSolanaExplorerUrl(f.txSignature)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 justify-end"
                      >
                        <span>{t('viewOnDevnet')}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Detalle de Puntos Sumados */}
                <div className="pt-2 border-t border-gray-50 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {language === 'en' ? 'Reward credited:' : 'Recompensa acreditada:'}
                  </span>
                  <div className="flex items-center gap-1 font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 px-2 py-0.5 rounded-lg shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>+{pointsEarned} {t('points')} Tefi</span>
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
