import React, { useState } from 'react';
import { FiadoRecord, PaymentMethod } from '../types/tefi';
import { useTefi } from '../context/TefiContext';
import { X, Check, Copy, ArrowRight, ShieldCheck, Zap, Sparkles, Building, Banknote, Wallet, ExternalLink, Droplets, Info } from 'lucide-react';

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiado: FiadoRecord | null;
  onRepaySuccess?: () => void;
}

export const RepayModal: React.FC<RepayModalProps> = ({ isOpen, onClose, fiado, onRepaySuccess }) => {
  const { customer, repayFiado, exchangeRate, language, t } = useTefi();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ABUNDANCE_FOUNTAIN');
  const [copied, setCopied] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  if (!isOpen || !fiado) return null;

  const rate = exchangeRate.rate || 1615;
  const baseUsdc = fiado.amountUsdc;
  const baseArs = fiado.amountArs || Math.round(baseUsdc * rate);

  // Comisión mínima pautada (1%): incluye costo de red Solana ($0.00025 on-chain) + mantenimiento de la app
  const feeRate = 0.01;
  const feeUsdc = +(baseUsdc * feeRate).toFixed(2);
  const feeArs = Math.round(baseArs * feeRate);

  const totalFinalUsdc = +(baseUsdc + feeUsdc).toFixed(2);
  const totalFinalArs = baseArs + feeArs;
  const calculatedArs = totalFinalArs;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);

    if (selectedMethod === 'ABUNDANCE_FOUNTAIN') {
      setProcessStep(language === 'en' ? '1/3: 💧 Verifying collateral in Fountain...' : '1/3: 💧 Verificando fondos retenidos en la Fuente...');
      setTimeout(() => {
        setProcessStep(language === 'en' ? '2/3: ⚡ Liquidating collateral to settle credit...' : '2/3: ⚡ Liquidando colateral para saldar fiado...');
        setTimeout(() => {
          setProcessStep(language === 'en' ? '3/3: 🛡️ Credit settled on Solana and funds unlocked...' : '3/3: 🛡️ Fiado saldado en Solana y saldo liberado...');
          setTimeout(() => {
            const res = repayFiado(fiado.id, selectedMethod);
            setIsProcessing(false);
            setProcessStep('');

            if (res.success) {
              setIsSuccess(true);
              if (res.signature) setTxSignature(res.signature);
              if (onRepaySuccess) onRepaySuccess();
            }
          }, 700);
        }, 700);
      }, 700);
      return;
    }

    setProcessStep(language === 'en' ? '1/3: Sending bank transfer...' : '1/3: Enviando transferencia bancaria...');
    setTimeout(() => {
      setProcessStep(language === 'en' ? '2/3: 🔔 Bank webhook received (Coelsa/API)...' : '2/3: 🔔 Webhook bancario recibido (Coelsa/API)...');
      setTimeout(() => {
        setProcessStep(language === 'en' ? '3/3: ⚡ Automatically reconciling on Solana...' : '3/3: ⚡ Conciliando automáticamente en Solana...');
        setTimeout(() => {
          const res = repayFiado(fiado.id, selectedMethod);
          setIsProcessing(false);
          setProcessStep('');

          if (res.success) {
            setIsSuccess(true);
            if (res.signature) setTxSignature(res.signature);
            if (onRepaySuccess) onRepaySuccess();
          }
        }, 700);
      }, 700);
    }, 700);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setTxSignature(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-6 text-left shadow-2xl relative border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/60">
                {language === 'en' ? 'Multichannel Settlement' : 'Liquidación Multicanal'}
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                {language === 'en' ? 'Pay Store Credit' : 'Pagar Fiado'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'en' ? 'Store:' : 'Comercio:'} <strong className="text-gray-800 dark:text-gray-200">{fiado.merchantName}</strong>
              </p>
            </div>

            {/* Monto Card Desglosado con Comisión Mínima */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex justify-between items-baseline border-b border-gray-700/60 pb-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {language === 'en' ? 'Products Subtotal' : 'Subtotal Productos'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-gray-200">${baseUsdc.toFixed(2)} USDC</span>
                    <span className="text-[10px] text-gray-400">(${baseArs.toLocaleString('es-AR')} ARS)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {language === 'en' ? 'Network + App Fee (1%)' : 'Comisión Red + App (1%)'}
                  </span>
                  <p className="text-xs font-bold text-emerald-300 mt-0.5">
                    +${feeUsdc.toFixed(2)} USDC <span className="text-[10px] text-emerald-400/80">(+${feeArs.toLocaleString('es-AR')} ARS)</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-0.5">
                <div>
                  <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'Final Amount Due' : 'Monto Final a Abonar'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black tracking-tight text-white">${totalFinalUsdc.toFixed(2)}</span>
                    <span className="text-xs font-extrabold text-emerald-400">USDC</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {language === 'en' ? 'Total in Pesos' : 'Total en Pesos'}
                  </span>
                  <p className="text-base font-black text-emerald-300 mt-0.5">
                    ${totalFinalArs.toLocaleString('es-AR')} <span className="text-xs text-gray-300">ARS</span>
                  </p>
                </div>
              </div>

              <div className="pt-1.5 border-t border-gray-700/50 flex items-start gap-1.5 text-[10px] text-gray-400 leading-snug">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>{language === 'en' ? 'Agreed minimum fee (1%):' : 'Comisión mínima pautada (1%):'}</strong>{' '}
                  {language === 'en'
                    ? 'Covers Solana network transaction costs and app maintenance. Already calculated in the final amount.'
                    : 'Cubre el costo de transacción de la red Solana y el mantenimiento de la app. Ya se encuentra calculada en el monto final.'}
                </p>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                {language === 'en' ? 'Select how you want to pay:' : 'Selecciona cómo deseas pagar:'}
              </label>

              <div className="space-y-2">
                {/* 0. Fuente de la Abundancia (Usar tus fondos retenidos en Solana) */}
                <div
                  onClick={() => setSelectedMethod('ABUNDANCE_FOUNTAIN')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedMethod === 'ABUNDANCE_FOUNTAIN'
                      ? 'border-purple-500 bg-purple-50/60 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/icon.svg"
                        alt="Fuente de la Abundancia"
                        className="w-8 h-8 rounded-xl shadow-xs border border-purple-200/60 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">{t('abundanceTitle')}</span>
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-md">
                            {language === 'en' ? 'Retained Funds' : 'Fondos Retenidos'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {language === 'en'
                            ? `Pay with your savings (You have $${(customer.abundanceSavingsUsdc || 0).toFixed(2)} USDC)`
                            : `Paga con tus fondos de ahorro (Tenés $${(customer.abundanceSavingsUsdc || 0).toFixed(2)} USDC)`}
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMethod === 'ABUNDANCE_FOUNTAIN' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                    }`}>
                      {selectedMethod === 'ABUNDANCE_FOUNTAIN' && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </div>
                  </div>

                  {selectedMethod === 'ABUNDANCE_FOUNTAIN' && (
                    <div className="pt-2 border-t border-purple-100 text-xs bg-white/80 p-2.5 rounded-xl mt-1 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">{language === 'en' ? 'Current balance in Fountain:' : 'Saldo actual en la Fuente:'}</span>
                        <strong className="text-gray-900">${(customer.abundanceSavingsUsdc || 0).toFixed(2)} USDC</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">{language === 'en' ? 'Will debit for this credit:' : 'Se debitará para este fiado:'}</span>
                        <strong className="text-purple-700">-${fiado.amountUsdc.toFixed(2)} USDC</strong>
                      </div>
                      <div className="flex justify-between text-[11px] pt-0.5 border-t border-gray-100 font-bold">
                        <span className="text-emerald-700">{language === 'en' ? 'Unlocked balance after payment:' : 'Saldo liberado tras el pago:'}</span>
                        <span className="text-emerald-700">
                          ${Math.max(0, +((customer.abundanceSavingsUsdc || 0) - fiado.amountUsdc).toFixed(2))} USDC
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-700 font-medium pt-1">
                        {language === 'en'
                          ? '✨ By paying with your locked funds, you settle the credit instantly and unlock the rest for free withdrawal.'
                          : '✨ Al pagar con tus fondos bloqueados, cancelás el fiado al instante y liberás el resto para retiro libre.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 1. Mercado Pago */}
                <div
                  onClick={() => setSelectedMethod('MERCADO_PAGO')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedMethod === 'MERCADO_PAGO'
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#009EE3] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        MP
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">Mercado Pago</span>
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded-md">
                            Transferencia 3.0
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {language === 'en' ? 'Pay with account balance via CVU / Alias' : 'Paga con dinero en cuenta vía CVU / Alias'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMethod === 'MERCADO_PAGO' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                    }`}>
                      {selectedMethod === 'MERCADO_PAGO' && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </div>
                  </div>

                  {selectedMethod === 'MERCADO_PAGO' && (
                    <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs bg-white/70 p-2 rounded-xl mt-1">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {language === 'en' ? 'Payment alias:' : 'Alias de pago:'}
                        </span>
                        <code className="text-xs font-mono font-bold text-blue-900">tefi.mercadopago.fiado</code>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('tefi.mercadopago.fiado', 'mp');
                        }}
                        className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      >
                        {copied === 'mp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>
                          {copied === 'mp'
                            ? (language === 'en' ? 'Copied' : 'Copiado')
                            : (language === 'en' ? 'Copy' : 'Copiar')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Cuenta DNI */}
                <div
                  onClick={() => setSelectedMethod('CUENTA_DNI')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedMethod === 'CUENTA_DNI'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#008752] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        DNI
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">Cuenta DNI / BNA+</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">
                            Banco Provincia
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {language === 'en' ? 'Enjoy neighborhood discounts and cashbacks' : 'Aprovecha descuentos y reintegros barriales'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMethod === 'CUENTA_DNI' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                    }`}>
                      {selectedMethod === 'CUENTA_DNI' && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </div>
                  </div>

                  {selectedMethod === 'CUENTA_DNI' && (
                    <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs bg-white/70 p-2 rounded-xl mt-1">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {language === 'en' ? 'Payment alias:' : 'Alias de pago:'}
                        </span>
                        <code className="text-xs font-mono font-bold text-emerald-900">almacen.dontito.cuentadni</code>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('almacen.dontito.cuentadni', 'dni');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      >
                        {copied === 'dni' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>
                          {copied === 'dni'
                            ? (language === 'en' ? 'Copied' : 'Copiado')
                            : (language === 'en' ? 'Copy' : 'Copiar')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Efectivo en Mostrador */}
                <div
                  onClick={() => setSelectedMethod('CASH')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'CASH'
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        {language === 'en' ? 'Cash in Hand' : 'Efectivo en Mano'}
                      </span>
                      <p className="text-[10px] text-gray-500">
                        {language === 'en' ? 'Hand banknotes at the store counter' : 'Entrega billetes en el mostrador del almacén'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === 'CASH' ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'CASH' && <Check className="w-2.5 h-2.5 stroke-3" />}
                  </div>
                </div>

                {/* 4. Solana USDC Nativo */}
                <div
                  onClick={() => setSelectedMethod('SOLANA_USDC')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'SOLANA_USDC'
                      ? 'border-purple-500 bg-purple-50/50 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900">Solana USDC</span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-md">
                          {language === 'en' ? 'Native Web3' : 'Web3 Nativo'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {language === 'en' ? 'On-chain signature with your Ed25519 key' : 'Firma on-chain con tu clave Ed25519'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedMethod === 'SOLANA_USDC' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'SOLANA_USDC' && <Check className="w-2.5 h-2.5 stroke-3" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Confirmación */}
            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl gradient-tefi text-white font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">{processStep}</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedMethod === 'MERCADO_PAGO' && (language === 'en' ? 'Confirm Mercado Pago Transfer' : 'Confirmar Transferencia Mercado Pago')}
                    {selectedMethod === 'CUENTA_DNI' && (language === 'en' ? 'Confirm Cuenta DNI Payment' : 'Confirmar Pago con Cuenta DNI')}
                    {selectedMethod === 'CASH' && (language === 'en' ? 'Confirm Cash Payment' : 'Confirmar Pago en Efectivo')}
                    {selectedMethod === 'SOLANA_USDC' && (language === 'en' ? 'Sign & Pay in Solana USDC' : 'Firmar y Pagar en Solana USDC')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-400">
              🔒 {language === 'en' ? 'Tefi on-ramp automatically settles on Solana and updates your Credit Score (+5 pts).' : 'La rampa de Tefi liquida automáticamente en Solana y actualiza tu Score Crediticio (+5 pts).'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
              <Check className="w-8 h-8 stroke-3" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {language === 'en' ? 'Payment Settled On-Chain!' : '¡Pago Asentado On-Chain!'}
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-2">
                {language === 'en' ? 'Credit Repaid Successfully' : 'Fiado Cancelado con Éxito'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' ? (
                  <>You paid <strong>${totalFinalArs.toLocaleString('es-AR')} ARS</strong> (${totalFinalUsdc.toFixed(2)} USDC, with Solana network and app fees included) via{' '}</>
                ) : (
                  <>Abonaste <strong>${totalFinalArs.toLocaleString('es-AR')} ARS</strong> (${totalFinalUsdc.toFixed(2)} USDC, con costo de red Solana y app incluidos) vía{' '}</>
                )}
                <strong className="text-gray-800">
                  {selectedMethod === 'MERCADO_PAGO' && 'Mercado Pago'}
                  {selectedMethod === 'CUENTA_DNI' && 'Cuenta DNI'}
                  {selectedMethod === 'CASH' && (language === 'en' ? 'Cash at Counter' : 'Efectivo en Mostrador')}
                  {selectedMethod === 'SOLANA_USDC' && 'Solana USDC'}
                </strong>.
              </p>
            </div>

            {/* Recompensas */}
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{language === 'en' ? 'Benefits of paying on time:' : 'Beneficios de tu pago a término:'}</span>
              </div>
              <ul className="text-[11px] text-emerald-800 space-y-0.5 pl-5 list-disc">
                <li><strong>+5 {language === 'en' ? 'points' : 'puntos'}</strong> {language === 'en' ? 'in your On-Chain Credit Score.' : 'en tu Score Crediticio On-Chain.'}</li>
                <li><strong>+$5.00 USDC</strong> {language === 'en' ? 'increase in your credit limit.' : 'de aumento en tu límite de crédito.'}</li>
                <li><strong>+{Math.round(fiado.amountUsdc * 20)} {language === 'en' ? 'points' : 'puntos'}</strong> {language === 'en' ? 'Tefi points to redeem in partner stores.' : 'Tefi para canjear en comercios.'}</li>
              </ul>
            </div>

            {txSignature && (
              <p className="text-[10px] text-gray-400 font-mono truncate">
                Tx: {txSignature.slice(0, 24)}...
              </p>
            )}

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Back to My Passbook' : 'Volver a Mi Libreta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
