import React, { useState } from 'react';
import { FiadoRecord, PaymentMethod } from '../types/tefi';
import { useTefi } from '../context/TefiContext';
import { X, Check, Copy, ArrowRight, ShieldCheck, Zap, Sparkles, Building, Banknote, Wallet, ExternalLink } from 'lucide-react';

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiado: FiadoRecord | null;
  onRepaySuccess?: () => void;
}

export const RepayModal: React.FC<RepayModalProps> = ({ isOpen, onClose, fiado, onRepaySuccess }) => {
  const { repayFiado, exchangeRate } = useTefi();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [copied, setCopied] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  if (!isOpen || !fiado) return null;

  const rate = exchangeRate.rate || 1615;
  const calculatedArs = Math.round(fiado.amountUsdc * rate);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setProcessStep('1/3: Enviando transferencia bancaria...');

    setTimeout(() => {
      setProcessStep('2/3: 🔔 Webhook bancario recibido (Coelsa/API)...');
      setTimeout(() => {
        setProcessStep('3/3: ⚡ Conciliando automáticamente en Solana...');
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
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-left shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Liquidación Multicanal
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 mt-1">Pagar Fiado</h3>
              <p className="text-xs text-gray-500">
                Comercio: <strong className="text-gray-800">{fiado.merchantName}</strong>
              </p>
            </div>

            {/* Monto Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[11px] text-gray-400 font-medium">Monto a abonar</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold tracking-tight">${fiado.amountUsdc.toFixed(2)}</span>
                    <span className="text-xs font-bold text-emerald-400">USDC</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 font-medium">En pesos (Oráculo)</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    ${calculatedArs.toLocaleString('es-AR')} <span className="text-xs text-gray-400">ARS</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Selecciona cómo deseas pagar:
              </label>

              <div className="space-y-2">
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
                        <p className="text-[10px] text-gray-500">Paga con dinero en cuenta vía CVU / Alias</p>
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
                        <span className="text-[10px] text-gray-400 block font-medium">Alias de pago:</span>
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
                        <span>{copied === 'mp' ? 'Copiado' : 'Copiar'}</span>
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
                        <p className="text-[10px] text-gray-500">Aprovecha descuentos y reintegros barriales</p>
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
                        <span className="text-[10px] text-gray-400 block font-medium">Alias de pago:</span>
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
                        <span>{copied === 'dni' ? 'Copiado' : 'Copiar'}</span>
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
                      <span className="text-xs font-bold text-gray-900 block">Efectivo en Mano</span>
                      <p className="text-[10px] text-gray-500">Entrega billetes en el mostrador del almacén</p>
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
                          Web3 Nativo
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Firma on-chain con tu clave Ed25519</p>
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
                    {selectedMethod === 'MERCADO_PAGO' && 'Confirmar Transferencia Mercado Pago'}
                    {selectedMethod === 'CUENTA_DNI' && 'Confirmar Pago con Cuenta DNI'}
                    {selectedMethod === 'CASH' && 'Confirmar Pago en Efectivo'}
                    {selectedMethod === 'SOLANA_USDC' && 'Firmar y Pagar en Solana USDC'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-400">
              🔒 La rampa de Tefi liquida automáticamente en Solana y actualiza tu Score Crediticio (+5 pts).
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
              <Check className="w-8 h-8 stroke-3" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                ¡Pago Asentado On-Chain!
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-2">Deuda Cancelada con Éxito</h3>
              <p className="text-xs text-gray-500 mt-1">
                Abonaste <strong>${calculatedArs.toLocaleString('es-AR')} ARS</strong> ({fiado.amountUsdc} USDC) vía{' '}
                <strong className="text-gray-800">
                  {selectedMethod === 'MERCADO_PAGO' && 'Mercado Pago'}
                  {selectedMethod === 'CUENTA_DNI' && 'Cuenta DNI'}
                  {selectedMethod === 'CASH' && 'Efectivo en Mostrador'}
                  {selectedMethod === 'SOLANA_USDC' && 'Solana USDC'}
                </strong>.
              </p>
            </div>

            {/* Recompensas */}
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Beneficios de tu pago a término:</span>
              </div>
              <ul className="text-[11px] text-emerald-800 space-y-0.5 pl-5 list-disc">
                <li><strong>+5 puntos</strong> en tu Score Crediticio On-Chain.</li>
                <li><strong>+$5.00 USDC</strong> de aumento en tu límite de crédito.</li>
                <li><strong>+{Math.round(fiado.amountUsdc * 20)} puntos</strong> Tefi para canjear en comercios.</li>
              </ul>
            </div>

            {txSignature && (
              <p className="text-[10px] text-gray-400 font-mono truncate">
                Tx: {txSignature.slice(0, 24)}...
              </p>
            )}

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors"
            >
              Volver a Mi Libreta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
