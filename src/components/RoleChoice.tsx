import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { UserRole } from '../types/tefi';
import { hasRoleKeypair } from '../solana/connection';
import { LanguageSwitch } from './LanguageSwitch';
import { VersionTag } from './VersionTag';
import { Store, User, ArrowLeft, ArrowRight } from 'lucide-react';

// Primer uso en un teléfono: se elige el rol (el dispositivo queda solo con la clave de ESE rol) y el nombre
// con el que el almacén o el vecino se presenta ante la otra parte
export const RoleChoice: React.FC = () => {
  const { role, needsRoleChoice, chooseDeviceRole, setRole, saveOwnName, merchant, customer, tr } = useTefi();
  // Versiones anteriores de la app guardaban las claves de los dos roles en cada teléfono
  const hasKeysFromOlderVersion = hasRoleKeypair('merchant') || hasRoleKeypair('customer');
  // Con el rol ya elegido solo falta el nombre: identidad nueva después de un reset, o el otro rol del demo en un dispositivo
  const [pickedRole, setPickedRole] = useState<UserRole | null>(needsRoleChoice ? null : role);
  const [name, setName] = useState('');

  const isStore = pickedRole === 'MERCHANT';
  // Demo en un solo dispositivo: se puede volver al rol que ya estaba configurado (tiene clave y nombre)
  const otherRole: UserRole = role === 'MERCHANT' ? 'CUSTOMER' : 'MERCHANT';
  const otherRoleIsSetUp =
    !needsRoleChoice &&
    (otherRole === 'MERCHANT' ? hasRoleKeypair('merchant') && !!merchant.name : hasRoleKeypair('customer') && !!customer.name);

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!pickedRole || !name.trim()) return;
    saveOwnName(pickedRole, name);
    if (needsRoleChoice) chooseDeviceRole(pickedRole);
  };

  const handleBack = () => {
    if (needsRoleChoice) {
      setPickedRole(null);
      setName('');
    } else {
      setRole(otherRole);
    }
  };

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

        {pickedRole === null ? (
          <>
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                {tr('How will you use this phone?', '¿Cómo vas a usar este teléfono?')}
              </span>

              <button
                onClick={() => setPickedRole('MERCHANT')}
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
                onClick={() => setPickedRole('CUSTOMER')}
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
          </>
        ) : (
          <form onSubmit={handleContinue} className="space-y-3 text-left">
            <label htmlFor="tefi-own-name" className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block text-center">
              {isStore ? tr('What is your store called?', '¿Cómo se llama tu almacén?') : tr('What is your name?', '¿Cómo te llamás?')}
            </label>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400">
                {isStore ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <input
                id="tefi-own-name"
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={40}
                autoFocus
                autoComplete={isStore ? 'organization' : 'name'}
                placeholder={isStore ? tr('e.g. Almacén Don Tito', 'Ej.: Almacén Don Tito') : tr('e.g. Matías González', 'Ej.: Matías González')}
                className="w-full pl-11 pr-3 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white placeholder:font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed text-center">
              {isStore
                ? tr(
                    'This name is public: your first fiado saves it in the on-chain profile of the store, and neighbors see it before they sign.',
                    'Este nombre es público: tu primer fiado lo guarda en el perfil on-chain del almacén, y los vecinos lo ven antes de firmar.'
                  )
                : tr(
                    'Your name stays on the phones: the stores you show your QR to see it. It is never written on-chain.',
                    'Tu nombre queda en los teléfonos: lo ven los almacenes a los que les mostrás tu QR. Nunca se escribe on-chain.'
                  )}
            </p>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-2xl gradient-tefi text-white font-black text-sm shadow-md active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{tr('Continue', 'Continuar')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {(needsRoleChoice || otherRoleIsSetUp) && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {needsRoleChoice
                    ? tr('Back', 'Volver')
                    : otherRole === 'MERCHANT'
                      ? tr('Back to the store', 'Volver al almacén')
                      : tr('Back to the neighbor', 'Volver al vecino')}
                </span>
              </button>
            )}
          </form>
        )}

        <div className="flex justify-center">
          <LanguageSwitch />
        </div>

        <div className="flex justify-center">
          <VersionTag />
        </div>
      </div>
    </div>
  );
};
