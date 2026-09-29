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

const MainContent: React.FC = () => {
  const { role } = useTefi();
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
    <div className="min-h-screen bg-tefi-bg text-gray-900 flex flex-col">
      <Header />

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
                <div className="glass-card rounded-3xl p-5 border border-gray-100 text-xs text-gray-600 space-y-2">
                  <h4 className="font-bold text-gray-900">¿Cómo funciona tu Score Tefi?</h4>
                  <p>
                    A diferencia del Veraz bancario que solo castiga, Tefi premia tu lealtad barrial. Cada vez que compras al fiado y pagas dentro del plazo:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-500">
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
