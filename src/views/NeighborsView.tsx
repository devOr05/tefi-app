import React, { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useTefi } from '../context/TefiContext';
import { QrScannerModal } from '../components/QrScannerModal';
import { RoadmapCard } from '../components/RoadmapCard';
import { OnChainCustomerProfile, getCustomerProfilePda } from '../solana/program';
import { getSolanaAccountUrl } from '../solana/connection';
import { shortAddress } from '../services/libreta';
import { UserPlus, Users, ExternalLink, Loader2 } from 'lucide-react';

// Libreta de vecinos del almacén: de cada uno guarda solo la clave pública; el resto se lee de la cadena
export const NeighborsView: React.FC = () => {
  const { neighbors, addNeighbor, fetchNeighborProfile, fiados, tr } = useTefi();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // undefined = consultando; null = sin perfil on-chain todavía
  const [profiles, setProfiles] = useState<Record<string, OnChainCustomerProfile | null | undefined>>({});

  // Se vuelve a leer cuando cambia la libreta (un fiado o un repago nuevo mueve score y límite)
  useEffect(() => {
    let isCurrent = true;
    neighbors.forEach(n => {
      fetchNeighborProfile(n.address)
        .then(profile => {
          if (isCurrent) setProfiles(prev => ({ ...prev, [n.address]: profile }));
        })
        .catch(() => {});
    });
    return () => {
      isCurrent = false;
    };
  }, [neighbors, fiados, fetchNeighborProfile]);

  return (
    <div className="space-y-4 pb-20">
      <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{tr('My Neighbors', 'Mis Vecinos')}</h3>
              <p className="text-[10px] text-gray-400">
                {tr('Score and limit are read from each on-chain profile', 'Score y límite se leen del perfil on-chain de cada uno')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-tefi text-white font-bold text-[11px] shadow-xs active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{tr('Add', 'Agregar')}</span>
          </button>
        </div>
      </div>

      {neighbors.length === 0 ? (
        <div className="text-center py-8 glass-card rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {tr('No neighbors yet.', 'Todavía no agendaste vecinos.')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            {tr(
              'The neighbor opens Tefi on their own phone, taps "My Tefi QR" and you scan it. It only shares their public key.',
              'El vecino abre Tefi en su propio teléfono, toca "Mi QR Tefi" y vos lo escaneás. Solo comparte su clave pública.'
            )}
          </p>
        </div>
      ) : (
        neighbors.map(n => {
          const profile = profiles[n.address];
          return (
            <div key={n.address} className="glass-card rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{n.name}</h4>
                  <a
                    href={getSolanaAccountUrl(getCustomerProfilePda(new PublicKey(n.address)).toBase58())}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{shortAddress(n.address)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {profile === undefined ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-300 shrink-0" />
                ) : profile === null ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                    {tr('No on-chain history yet', 'Sin historial on-chain')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 shrink-0">
                    Score: {profile.creditScore} pts
                  </span>
                )}
              </div>

              {profile && (
                <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-800 text-center">
                  <div>
                    <span className="text-[10px] text-gray-400 block">{tr('Limit', 'Límite')}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">${profile.creditLimitUsdc.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">{tr('Owes', 'Debe')}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">${profile.activeDebtUsdc.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">{tr('Repaid', 'Saldó')}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">${profile.totalRepaidUsdc.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <RoadmapCard />

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={tr("Scan the neighbor's Tefi QR", 'Escanear el QR Tefi del vecino')}
        subtitle={tr('The neighbor shows it from "My Tefi QR" on their phone', 'El vecino lo muestra desde "Mi QR Tefi" en su teléfono')}
        onScan={async text => {
          const res = addNeighbor(text);
          if (!res.success) return res.error;
          setIsScannerOpen(false);
          return null;
        }}
      />
    </div>
  );
};
