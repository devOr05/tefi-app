import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { X, Check, Copy, ShieldCheck, Wallet, ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface LinkedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedAccountsModal: React.FC<LinkedAccountsModalProps> = ({ isOpen, onClose }) => {
  const { customer, updateLinkedAccounts, language } = useTefi();

  const [cuentaDniAlias, setCuentaDniAlias] = useState(customer.cuentaDniAlias || 'matias.gonzalez.bapro');
  const [cuentaDniLinked, setCuentaDniLinked] = useState(customer.cuentaDniLinked !== false);

  const [mercadoPagoAlias, setMercadoPagoAlias] = useState(customer.mercadoPagoAlias || 'matias.mp.tefi');
  const [mercadoPagoLinked, setMercadoPagoLinked] = useState(customer.mercadoPagoLinked !== false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLinkedAccounts({
      cuentaDniAlias,
      cuentaDniLinked,
      mercadoPagoAlias,
      mercadoPagoLinked
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-6 text-left shadow-2xl relative border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800">
            {language === 'en' ? 'Roadmap · Mock Fiat Rails' : 'Roadmap · Rieles Fiat Simulados'}
          </span>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
            {language === 'en' ? 'Linked Accounts & Wallets' : 'Cuentas & Billeteras Vinculadas'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {language === 'en'
              ? 'Associated with your Unique Digital Identity (DID) on Solana.'
              : 'Asociadas a tu Identidad Digital Única (DID) en Solana.'}
          </p>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
              <Check className="w-7 h-7 stroke-3" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-900">
              {language === 'en' ? 'Accounts Updated!' : '¡Cuentas Actualizadas!'}
            </h4>
            <p className="text-xs text-gray-500">
              {language === 'en'
                ? 'Your payment methods are now synchronized with your on-chain identity.'
                : 'Tus medios de pago quedaron sincronizados con tu identidad on-chain.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Cuenta DNI */}
            <div className={`p-4 rounded-2xl border transition-all ${
              cuentaDniLinked ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#008752] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    DNI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Cuenta DNI</h4>
                    <span className="text-[10px] text-gray-500">Banco Provincia / MODO</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cuentaDniLinked}
                    onChange={(e) => setCuentaDniLinked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {cuentaDniLinked ? (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    {language === 'en' ? 'Your Cuenta DNI Alias:' : 'Tu Alias de Cuenta DNI:'}
                  </label>
                  <input
                    type="text"
                    value={cuentaDniAlias}
                    onChange={(e) => setCuentaDniAlias(e.target.value)}
                    placeholder="tu.alias.bapro"
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-950 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-emerald-800">
                    {language === 'en'
                      ? '✅ Enabled for neighborhood cashbacks and instant debit.'
                      : '✅ Habilitado para reintegros barriales y débito inmediato.'}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">
                  {language === 'en' ? 'Unlinked' : 'Desvinculada'}
                </p>
              )}
            </div>

            {/* Mercado Pago */}
            <div className={`p-4 rounded-2xl border transition-all ${
              mercadoPagoLinked ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#009EE3] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    MP
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Mercado Pago</h4>
                    <span className="text-[10px] text-gray-500">CVU / Transferencias 3.0</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mercadoPagoLinked}
                    onChange={(e) => setMercadoPagoLinked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {mercadoPagoLinked ? (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    {language === 'en' ? 'Your Mercado Pago Alias:' : 'Tu Alias de Mercado Pago:'}
                  </label>
                  <input
                    type="text"
                    value={mercadoPagoAlias}
                    onChange={(e) => setMercadoPagoAlias(e.target.value)}
                    placeholder="tu.alias.mp"
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-950 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-blue-800">
                    {language === 'en'
                      ? '✅ Synchronized to settle payments in 1-click via webhook.'
                      : '✅ Sincronizado para liquidar pagos en 1-click vía webhook.'}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">
                  {language === 'en' ? 'Unlinked' : 'Desvinculada'}
                </p>
              )}
            </div>

            {/* Billetera Solana (Base) */}
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-purple-950 text-[11px] block">
                    {language === 'en' ? 'Base Solana Wallet' : 'Billetera Base Solana'}
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 truncate max-w-[170px] block">
                    {customer.walletAddress.slice(0, 14)}...
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                On-Chain
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'en' ? 'Save Linked Accounts' : 'Guardar Cuentas Vinculadas'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
