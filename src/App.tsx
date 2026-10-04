import React, { useState } from 'react';
import { TefiProvider, useTefi } from './context/TefiContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MerchantDashboard } from './views/MerchantDashboard';
import { NewFiadoView } from './views/NewFiadoView';
import { CustomerLibretaView } from './views/CustomerLibretaView';
import { InsurancePoolView } from './views/InsurancePoolView';
import { LoyaltyBadge } from './components/LoyaltyBadge';
import { CreditScoreCard } from './components/CreditScoreCard';
import { AbundanceFountainCard } from './components/AbundanceFountainCard';
import { BellRing, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, webhookNotification, dismissWebhookNotification } = useTefi();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Ajustar tab al cambiar de rol
  React.useEffect(() => {
    if (role === 'MERCHANT' && (currentTab === 'libreta' || currentTab === 'credit' || currentTab === 'loyalty')) {
      setCurrentTab('dashboard');
    } else if (role === 'CUSTOMER' && (currentTab === 'dashboard' || currentTab === 'new-fiado' || currentTab === 'insurance')) {
      setCurrentTab('libreta');
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-tefi-bg dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 flex flex-col relative transition-colors duration-200">
      <Header />

      {/* Notificación Flotante de Webhook Automático en Tiempo Real */}
      {webhookNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                <BellRing className="w-4 h-4 animate-bounce text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    {webhookNotification.title}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {webhookNotification.timestamp}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-100 mt-0.5 leading-snug">
                  {webhookNotification.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-mono">
                  <span className="text-emerald-400 font-bold">✓ Conciliado automático</span>
                  <span>•</span>
                  <span>Solana Devnet</span>
                </div>
              </div>
            </div>
            <button
              onClick={dismissWebhookNotification}
              className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md w-full mx-auto p-4 pt-3">
        {role === 'MERCHANT' ? (
          <>
            {currentTab === 'dashboard' && (
              <MerchantDashboard onNavigateToNew={() => setCurrentTab('new-fiado')} />
            )}
            {currentTab === 'new-fiado' && (
              <NewFiadoView onBack={() => setCurrentTab('dashboard')} />
            )}
            {currentTab === 'insurance' && <InsurancePoolView />}
          </>
        ) : (
          <>
            {currentTab === 'libreta' && <CustomerLibretaView />}
            {currentTab === 'credit' && (
              <div className="space-y-4 pb-20">
                <CreditScoreCard />
                <AbundanceFountainCard />
                <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">¿Cómo funciona tu Score Tefi?</h4>
                  <p>
                    A diferencia del Veraz bancario que solo castiga, Tefi premia tu lealtad barrial. Cada vez que compras al fiado y pagas dentro del plazo:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
                    <li>Ganas +5 puntos en tu score de reputación on-chain.</li>
                    <li>Tu límite de crédito disponible se expande automáticamente en +$5 USDC.</li>
                    <li>Acumulas puntos canjeables por descuentos en todos los almacenes de la red.</li>
                  </ul>
                </div>
              </div>
            )}
            {currentTab === 'loyalty' && (
              <div className="space-y-4 pb-20">
                <LoyaltyBadge />
              </div>
            )}
          </>
        )}
      </main>

      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export function App() {
  return (
    <TefiProvider>
      <MainContent />
    </TefiProvider>
  );
}

export default App;
