import React, { useState } from 'react';
import { TefiProvider, useTefi } from './context/TefiContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { RoleChoice } from './components/RoleChoice';
import { MerchantDashboard } from './views/MerchantDashboard';
import { NewFiadoView } from './views/NewFiadoView';
import { NeighborsView } from './views/NeighborsView';
import { CustomerLibretaView } from './views/CustomerLibretaView';
import { RepaymentHistoryView } from './views/RepaymentHistoryView';
import { CreditScoreCard } from './components/CreditScoreCard';
import { RoadmapCard } from './components/RoadmapCard';
import { BellRing, X, Smartphone } from 'lucide-react';

const MERCHANT_TABS = ['dashboard', 'new-fiado', 'neighbors'];
const CUSTOMER_TABS = ['libreta', 'credit', 'history'];

const MainContent: React.FC = () => {
  const { role, needsRoleChoice, isSingleDeviceDemo, chooseDeviceRole, notification, dismissNotification, t, tr } = useTefi();
  const [currentTab, setCurrentTab] = useState<string>(role === 'MERCHANT' ? 'dashboard' : 'libreta');

  // Volver a un teléfono de un solo rol: se quita de este dispositivo la clave del otro rol
  const handleKeepOnlyCurrentRole = () => {
    const message =
      role === 'MERCHANT'
        ? tr(
            'Remove the neighbor key from this device? Its on-chain history stays on-chain, but this device will no longer sign as that neighbor.',
            '¿Quitar de este dispositivo la clave del vecino? Su historial on-chain sigue on-chain, pero este dispositivo ya no va a poder firmar como ese vecino.'
          )
        : tr(
            'Remove the store key from this device? Its on-chain history stays on-chain, but this device will no longer sign as that store, and its devnet SOL is left behind.',
            '¿Quitar de este dispositivo la clave del almacén? Su historial on-chain sigue on-chain, pero este dispositivo ya no va a poder firmar como ese almacén, y su SOL de devnet queda atrás.'
          );
    if (confirm(message)) chooseDeviceRole(role);
  };

  // Ajustar tab al cambiar de rol
  React.useEffect(() => {
    if (role === 'MERCHANT' && !MERCHANT_TABS.includes(currentTab)) {
      setCurrentTab('dashboard');
    } else if (role === 'CUSTOMER' && !CUSTOMER_TABS.includes(currentTab)) {
      setCurrentTab('libreta');
    }
  }, [role]);

  if (needsRoleChoice) {
    return <RoleChoice />;
  }

  return (
    <div className="min-h-screen bg-tefi-bg dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 flex flex-col relative transition-colors duration-200">
      <Header />

      {/* Rótulo permanente cuando las dos claves viven en este mismo navegador */}
      {isSingleDeviceDemo && (
        <div className="bg-amber-100 dark:bg-amber-950/70 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-3 py-1.5">
          <p className="max-w-md mx-auto text-[10px] leading-snug flex items-start gap-1.5">
            <Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>{tr('Single-device demo: both keys are on this device. ', 'Demo en un solo dispositivo: las dos claves están en este dispositivo. ')}</strong>
              {tr(
                'Each fiado is still a real two-signature transaction on devnet. With two phones, each one holds only its own key.',
                'Cada fiado sigue siendo una transacción real de dos firmas en devnet. Con dos teléfonos, cada uno tiene solo su propia clave.'
              )}{' '}
              <button onClick={handleKeepOnlyCurrentRole} className="underline font-bold cursor-pointer">
                {role === 'MERCHANT'
                  ? tr('Use this device as the store only', 'Usar este dispositivo solo como almacén')
                  : tr('Use this device as a neighbor only', 'Usar este dispositivo solo como vecino')}
              </button>
            </span>
          </p>
        </div>
      )}

      {/* Notificación flotante de operaciones confirmadas */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                <BellRing className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    {notification.title}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {notification.timestamp}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-100 mt-0.5 leading-snug">
                  {notification.message}
                </p>
              </div>
            </div>
            <button
              onClick={dismissNotification}
              aria-label={tr('Dismiss', 'Cerrar')}
              className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800 cursor-pointer"
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
            {currentTab === 'neighbors' && <NeighborsView />}
          </>
        ) : (
          <>
            {currentTab === 'libreta' && <CustomerLibretaView />}
            {currentTab === 'credit' && (
              <div className="space-y-4 pb-20">
                <CreditScoreCard />
                <div className="glass-card rounded-3xl p-5 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">{t('howScoreWorks')}</h4>
                  <p>{t('howScoreWorksDesc')}</p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
                    <li>{t('howScoreLi1')}</li>
                    <li>{t('howScoreLi2')}</li>
                    <li>{t('howScoreLi3')}</li>
                  </ul>
                </div>
                <RoadmapCard />
              </div>
            )}
            {currentTab === 'history' && <RepaymentHistoryView />}
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
