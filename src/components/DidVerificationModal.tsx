import React, { useState, useRef } from 'react';
import { useTefi } from '../context/TefiContext';
import { Camera, CheckCircle2, ShieldCheck, X, ScanFace, Lock, Sparkles, Globe2 } from 'lucide-react';

interface DidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DidVerificationModal: React.FC<DidModalProps> = ({ isOpen, onClose }) => {
  const { customer, setCustomer } = useTefi() as any;
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'capturing' | 'success'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      setScanStep('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn('Cámara selfie no disponible, simulando escaneo biométrico', e);
      simulateBiometricScan();
    }
  };

  const simulateBiometricScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      completeVerification();
    }, 2200);
  };

  const takeBiometricSnapshot = () => {
    setIsScanning(true);
    setTimeout(() => {
      stopCamera();
      completeVerification();
    }, 1800);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const completeVerification = () => {
    setIsScanning(false);
    setScanStep('success');

    const did = `did:sol:devnet:${customer.walletAddress}`;
    const bioHash = 'bio_' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setCustomer((prev: any) => ({
      ...prev,
      isDidVerified: true,
      didUri: did,
      biometricHash: bioHash
    }));
  };

  const handleClose = () => {
    stopCamera();
    setScanStep('idle');
    setIsScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {scanStep === 'idle' && (
          <div className="space-y-4 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
              <ScanFace className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">Identidad Digital Única (DID)</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Vincula tu rostro biométrico a tu billetera de Solana. <br />
                <strong className="text-gray-800">1 Persona = 1 Cuenta Única.</strong>
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs space-y-2 text-gray-600">
              <div className="flex items-start gap-2">
                <Globe2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Portabilidad Nacional:</strong> Tu score de crédito es válido en cualquier comercio del país, aunque no te conozcan.</span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Anti-Fraude:</strong> Nadie puede duplicar cuentas para eludir compromisos. Tu reputación es inmutable.</span>
              </div>
            </div>

            <button
              onClick={startCamera}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 active:scale-98 transition-transform flex items-center justify-center gap-2"
            >
              <ScanFace className="w-4 h-4" />
              <span>Escanear Rostro y Validar DID</span>
            </button>
          </div>
        )}

        {scanStep === 'capturing' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-purple-500 shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              
              {/* Óvalo guía para el rostro */}
              <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-full pointer-events-none flex items-center justify-center">
                {isScanning && (
                  <div className="w-full h-1 bg-purple-400 shadow-[0_0_15px_#a855f7] animate-bounce" />
                )}
              </div>

              {isScanning && (
                <div className="absolute bottom-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Analizando biometría y generando hash criptográfico...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={takeBiometricSnapshot}
                disabled={isScanning}
                className="flex-1 py-3 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capturar y Validar</span>
              </button>
              <button
                onClick={simulateBiometricScan}
                disabled={isScanning}
                className="px-3 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
                title="Simulación rápida"
              >
                Auto
              </button>
            </div>
          </div>
        )}

        {scanStep === 'success' && (
          <div className="space-y-4 pt-1 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">¡Identidad DID Verificada!</h3>
              <p className="text-xs text-gray-500 mt-0.5">Rostro biométrico enlazado a Solana Devnet</p>
            </div>

            <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100 text-left font-mono text-[10px] text-purple-900 break-all space-y-1">
              <div className="flex justify-between font-sans text-purple-700 font-bold">
                <span>DID Protocol:</span>
                <span className="text-emerald-700">ACTIVO</span>
              </div>
              <div>did:sol:devnet:{customer.walletAddress?.slice(0, 16)}...</div>
              <div className="text-gray-400 text-[9px] font-sans">Hash Facial: {customer.biometricHash || 'bio_9f82d1c'}</div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tu score de <strong>{customer.creditScore} pts</strong> ahora es universal: puedes fiar en cualquier comercio de la red nacional.</span>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl gradient-tefi text-white font-extrabold text-xs shadow-md active:scale-98 transition-transform"
            >
              Listo / Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
