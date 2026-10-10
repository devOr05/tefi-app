import React from 'react';
import { useTefi } from '../context/TefiContext';
import { hasRoleKeypair } from '../solana/connection';
import { Store, User } from 'lucide-react';

// Primer uso en un teléfono: se elige el rol y el dispositivo queda solo con la clave de ESE rol
export const RoleChoice: React.FC = () => {
  const { chooseDeviceRole, toggleLanguage, language, tr } = useTefi();
  // Versiones anteriores de la app guardaban las claves de los dos roles en cada teléfono
  const hasKeysFromOlderVersion = hasRoleKeypair('merchant') || hasRoleKeypair('customer');

  return (
    <div className="min-h-screen bg-tefi-bg dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-5 text-center">
        <img src="/icon.svg" alt="Tefi Logo" className="w-16 h-16 mx-auto rounded-2xl bg-white border border-gray-100 p-1 shadow-xs" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Tefi</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {tr(
              'The corner store credit notebook, co-signed by store and neighbor on Solana.',
              'La libreta del fiado del almacén, co-firmada por almacenero y vecino en Solana.'
            )}
          </p>
        </div>

        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            {tr('How will you use this phone?', '¿Cómo vas a usar este teléfono?')}
          </span>

          <button
            onClick={() => chooseDeviceRole('MERCHANT')}
            className="w-full p-4 rounded-3xl gradient-tefi text-white text-left shadow-md active:scale-98 transition-transform flex items-center gap-3 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-black block">{tr("I'm the store", 'Soy el almacén')}</span>
              <span className="text-[11px] text-emerald-100">
                {tr('I record fiados and confirm repayments', 'Registro fiados y confirmo los pagos')}
              </span>
            </div>
          </button>

          <button
            onClick={() => chooseDeviceRole('CUSTOMER')}
            className="w-full p-4 rounded-3xl bg-gray-900 dark:bg-gray-800 text-white text-left shadow-md active:scale-98 transition-transform flex items-center gap-3 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-black block">{tr("I'm a neighbor", 'Soy un vecino')}</span>
              <span className="text-[11px] text-gray-300">
                {tr('I co-sign my fiados and build my credit history', 'Co-firmo mis fiados y construyo mi historial')}
              </span>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed">
          {tr(
            'A signing key for the role you choose is created and kept on this phone only. Devnet prototype: do not use it for real money.',
            'Se crea una clave de firma para el rol que elijas y queda solo en este teléfono. Prototipo en devnet: no lo uses con dinero real.'
          )}
          {hasKeysFromOlderVersion &&
            ' ' +
              tr(
                'This phone has keys from an earlier version of Tefi: it will keep only the one for the role you choose.',
                'Este teléfono tiene claves de una versión anterior de Tefi: va a conservar solo la del rol que elijas.'
              )}
        </p>

        <button
          onClick={toggleLanguage}
          className="text-[11px] font-bold text-gray-500 dark:text-gray-400 underline cursor-pointer"
        >
          {language === 'en' ? 'Ver en español' : 'View in English'}
        </button>
      </div>
    </div>
  );
};
