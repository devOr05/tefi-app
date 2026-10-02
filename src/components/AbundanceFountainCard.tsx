import React, { useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { PaymentMethod } from '../types/tefi';
import { Sparkles, TrendingUp, Droplets, ArrowUpRight, ArrowDownLeft, X, Check, ShieldCheck, HelpCircle, Coins, ChevronDown, ChevronUp } from 'lucide-react';

export const AbundanceFountainCard: React.FC = () => {
  const { customer, exchangeRate, depositToAbundanceFountain, withdrawFromAbundanceFountain } = useTefi();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amountArs, setAmountArs] = useState<string>('3000');
  const [withdrawUsdc, setWithdrawUsdc] = useState<string>('10');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CUENTA_DNI');
  const [showEdu, setShowEdu] = useState(false);

  const rate = exchangeRate.rate || 1615;
  const savingsUsdc = customer.abundanceSavingsUsdc ?? 22.50;
  const savingsSol = customer.abundanceSavingsSol ?? 0.145;
  const yieldEarned = customer.abundanceYieldEarnedUsdc ?? 1.85;
  const savingsArs = Math.round(savingsUsdc * rate);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountArs);
    if (!val || val <= 0) return;
    depositToAbundanceFountain(val, selectedMethod);
    setIsDepositOpen(false);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawUsdc);
    if (!val || val <= 0 || val > savingsUsdc) return;
    withdrawFromAbundanceFountain(val);
    setIsWithdrawOpen(false);
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-emerald-100/90 shadow-sm relative overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-sm">
            <Droplets className="w-5 h-5 fill-white/80" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Fuente de la Abundancia</h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Micro-ahorro barrial con rendimiento en Solana</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          ~7.4% APY
        </span>
      </div>

      {/* Saldo de la Fuente */}
      <div className="mt-4 bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-gray-100 shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Tu Reserva Acumulada</span>
        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-gray-900 tracking-tight">${savingsUsdc.toFixed(2)}</span>
              <span className="text-xs font-bold text-emerald-600">USDC</span>
            </div>
            <span className="text-xs font-semibold text-gray-500 block">
              ≈ {savingsSol.toFixed(3)} SOL (${savingsArs.toLocaleString('es-AR')} ARS)
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block font-medium">Rendimiento Ganado</span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg inline-flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +${yieldEarned.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Impacto en el Score */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Respaldo de Solvencia:
          </span>
          <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            +10 pts al Score On-Chain
          </span>
        </div>
      </div>

      {/* Botones de Aporte y Retiro */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => setIsDepositOpen(true)}
          className="py-2.5 px-3 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Aportar a la Fuente</span>
        </button>

        <button
          onClick={() => setIsWithdrawOpen(true)}
          className="py-2.5 px-3 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4 text-gray-500" />
          <span>Retirar a mi Banco</span>
        </button>
      </div>

      {/* Píldora Educativa Desplegable */}
      <div className="mt-3 pt-2 border-t border-emerald-100/60">
        <button
          onClick={() => setShowEdu(!showEdu)}
          className="w-full flex items-center justify-between text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            ¿Por qué tu dinero crece en la Fuente?
          </span>
          {showEdu ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showEdu && (
          <div className="mt-2 text-[11px] text-gray-600 bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1.5 animate-in fade-in">
            <p>
              💡 <strong>De Deudor a Inversor:</strong> Mientras el plazo fijo bancario pierde contra la inflación del peso, en la Fuente tus fondos se indexan a <strong>Solana y USDC</strong> rindiendo intereses diarios (~7.4% anual) a través del consenso de la red.
            </p>
            <p>
              🔒 <strong>Ahorro que abre puertas:</strong> Cada peso ahorrado funciona como garantía silenciosa: el almacenero te fía más y tu Score sube porque demostrás conducta financiera responsable.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE APORTE */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-left shadow-2xl relative border border-gray-100" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsDepositOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Droplets className="w-4 h-4 fill-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-gray-900">Aportar a tu Fuente</h4>
                <p className="text-[10px] text-gray-400">Micro-ahorro con rendimiento en Solana</p>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Monto en Pesos ($ ARS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    value={amountArs}
                    onChange={e => setAmountArs(e.target.value)}
                    className="w-full pl-7 pr-24 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-extrabold text-base focus:outline-none focus:border-emerald-500"
                    placeholder="3000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    ≈ {+(parseFloat(amountArs || '0') / rate).toFixed(2)} USDC
                  </span>
                </div>

                {/* Botones de monto rápido */}
                <div className="flex gap-1.5 mt-2">
                  {['1500', '3000', '5000', '10000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountArs(val)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                        amountArs === val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      ${parseInt(val).toLocaleString('es-AR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canal de aporte */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Debitar desde:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedMethod('CUENTA_DNI')}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                      selectedMethod === 'CUENTA_DNI' ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Cuenta DNI</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedMethod('MERCADO_PAGO')}
                    className={`p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                      selectedMethod === 'MERCADO_PAGO' ? 'border-blue-500 bg-blue-50 text-blue-950' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Mercado Pago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl text-[10px] text-emerald-900 border border-emerald-100 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Beneficio Inmediato:</strong> Este aporte suma <strong>+2 puntos</strong> a tu score crediticio y comienza a generar intereses desde hoy.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-tefi text-white font-extrabold text-xs shadow-md active:scale-98 transition-all"
              >
                Confirmar y Verter en la Fuente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RETIRO */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-left shadow-2xl relative border border-gray-100" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-gray-900">Retirar de tu Fuente</h4>
                <p className="text-[10px] text-gray-400">Transferencia instantánea a tu cuenta</p>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Monto a retirar (USDC)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    value={withdrawUsdc}
                    onChange={e => setWithdrawUsdc(e.target.value)}
                    max={savingsUsdc}
                    className="w-full pl-7 pr-20 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-extrabold text-base focus:outline-none focus:border-emerald-500"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700">
                    USDC
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Disponible: ${savingsUsdc.toFixed(2)} USDC</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawUsdc(savingsUsdc.toString())}
                    className="font-bold text-emerald-600 hover:underline"
                  >
                    Retirar Todo
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl text-[10px] text-gray-600 border border-gray-200">
                Se enviarán aprox. <strong>${Math.round(parseFloat(withdrawUsdc || '0') * rate).toLocaleString('es-AR')} ARS</strong> a tu cuenta vinculada de {customer.cuentaDniAlias ? 'Cuenta DNI' : 'Mercado Pago'} vía Coelsa.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all hover:bg-gray-800"
              >
                Confirmar Retiro Inmediato
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
