import React from 'react';
import { useTefi } from '../context/TefiContext';
import { Store, User, RefreshCw, ShieldCheck, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const { role, setRole, merchant, customer, resetDemoData } = useTefi();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-tefi flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-gray-900">tefi</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-purple-600 text-purple-600" />
                Solana
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">El fiado digital</p>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full text-xs font-semibold">
          <button
            onClick={() => setRole('MERCHANT')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
              role === 'MERCHANT'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-tefi-primary" />
            <span>Almacén</span>
          </button>
          <button
            onClick={() => setRole('CUSTOMER')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
              role === 'CUSTOMER'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Vecino</span>
          </button>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={resetDemoData}
          title="Reiniciar datos de demo"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick context info banner */}
      <div className="max-w-md mx-auto mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{role === 'MERCHANT' ? merchant.name : customer.name}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Devnet: {role === 'MERCHANT' ? merchant.walletAddress : customer.walletAddress}</span>
        </div>
      </div>
    </header>
  );
};
