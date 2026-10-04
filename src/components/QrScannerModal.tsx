import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiadoQrPayload } from '../types/tefi';
import { useTefi } from '../context/TefiContext';
import { X, Camera, AlertCircle, Upload, Sparkles, RefreshCw } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (payload: FiadoQrPayload) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const { language } = useTefi();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseScannedText = (decodedText: string): FiadoQrPayload | null => {
    try {
      // Caso 1: URL compacta (?f=...&ars=...&usdc=...)
      if (decodedText.includes('f=') || decodedText.includes('ars=') || decodedText.includes('usdc=')) {
        const url = new URL(decodedText.startsWith('http') ? decodedText : `https://tefi.app/${decodedText}`);
        const fId = url.searchParams.get('f') || `f-${Date.now().toString().slice(-4)}`;
        const ars = parseFloat(url.searchParams.get('ars') || '15000');
        const usdc = parseFloat(url.searchParams.get('usdc') || (ars / 1615).toFixed(2));
        const merchantName = url.searchParams.get('n') || 'Almacén Don Tito';
        const merchantId = url.searchParams.get('m') || 'merch-tito-01';
        const itemsDescription = url.searchParams.get('d') || 'Compra de almacén';
        return {
          protocol: 'tefi',
          version: '1.0',
          action: 'FIADO_REQUEST',
          data: {
            id: fId,
            merchantId,
            merchantName: decodeURIComponent(merchantName),
            customerId: 'cust-matias-01',
            customerName: 'Matías González',
            amountArs: ars,
            amountUsdc: usdc,
            itemsDescription: decodeURIComponent(itemsDescription),
            photoReceiptUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            nonce: 3
          }
        };
      }

      // Caso 2: Es una URL con parámetro ?fiado= o #fiado=
      if (decodedText.includes('fiado=')) {
        const url = new URL(decodedText.startsWith('http') ? decodedText : `https://tefi.app/${decodedText}`);
        const fiadoParam = url.searchParams.get('fiado') || new URLSearchParams(url.hash.replace('#', '')).get('fiado');
        if (fiadoParam) {
          const parsed = JSON.parse(decodeURIComponent(fiadoParam));
          if (parsed.protocol === 'tefi') return parsed;
          return {
            protocol: 'tefi',
            version: '1.0',
            action: 'FIADO_REQUEST',
            data: parsed.data || parsed
          };
        }
      }

      // Caso 3: Es un JSON directo
      const parsed = JSON.parse(decodedText);
      if (parsed.protocol === 'tefi') return parsed;
      if (parsed.data && parsed.data.amountUsdc) {
        return {
          protocol: 'tefi',
          version: '1.0',
          action: 'FIADO_REQUEST',
          data: parsed.data
        };
      }
      if (parsed.amountUsdc || parsed.amountArs) {
        return {
          protocol: 'tefi',
          version: '1.0',
          action: 'FIADO_REQUEST',
          data: parsed
        };
      }
    } catch (e) {
      console.warn('Error al decodificar texto QR:', e);
    }
    return null;
  };

  const handleSuccessfulScan = (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    const payload = parseScannedText(decodedText);
    if (payload) {
      stopScanner().then(() => {
        onScanSuccess(payload);
      });
    } else {
      setCameraError('El código QR no corresponde a un fiado válido de Tefi.');
      setTimeout(() => {
        setIsProcessing(false);
        setCameraError(null);
      }, 3000);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('tefi-qr-reader', {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          verbose: false
        });
      }

      // Escanear área amplia (85% del visor) para que nunca corte esquinas en pantallas
      const qrboxCalc = (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.floor(edge * 0.88);
        return { width: size, height: size };
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: qrboxCalc,
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Errores de frame ignorados
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('No se pudo iniciar la cámara:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Revisa los permisos de tu navegador o sube una foto del QR.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (e) {
      console.warn('Error al detener scanner:', e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      // Dar un tick para que el elemento del DOM exista
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Manejar subida de imagen de QR (archivo)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('tefi-qr-reader');
      }
      const decodedResult = await scannerRef.current.scanFile(file, true);
      handleSuccessfulScan(decodedResult);
    } catch (err) {
      setCameraError('No se encontró un código QR válido en la imagen subida.');
    }
  };

  // Cargar Fiado de Demostración Instantáneo
  const handleLoadDemoFiado = () => {
    const demoPayload: FiadoQrPayload = {
      protocol: 'tefi',
      version: '1.0',
      action: 'FIADO_REQUEST',
      data: {
        id: `f-${Date.now().toString().slice(-4)}`,
        merchantId: 'merch-tito-01',
        merchantName: 'Almacén Don Tito',
        customerId: 'cust-matias-01',
        customerName: 'Matías González',
        amountArs: 15000,
        amountUsdc: 9.28,
        itemsDescription: '1kg Yerba Playadito + 500g Queso Mar del Plata + 1 Pan',
        photoReceiptUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        nonce: 3
      }
    };
    stopScanner().then(() => {
      onScanSuccess(demoPayload);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 my-auto">
        <button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-100 transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-gray-900">
          {language === 'en' ? "Scan Don Tito's QR" : 'Escanear QR de Don Tito'}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {language === 'en'
            ? "Point your camera at the merchant's screen to receive the credit"
            : 'Apunta tu cámara a la pantalla del almacenero para recibir el fiado'}
        </p>

        {/* Viewport de Cámara */}
        <div className="my-3.5 relative rounded-2xl overflow-hidden bg-gray-950 aspect-square border-2 border-emerald-500/80 shadow-inner flex items-center justify-center">
          <div id="tefi-qr-reader" className="w-full h-full" />

          {/* Guía visual de escaneo */}
          <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-emerald-400/70 rounded-2xl animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded-full">
              {language === 'en' ? 'Center QR code' : 'Centrar código QR'}
            </span>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 p-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-bold">{language === 'en' ? 'QR Detected!' : '¡QR Detectado!'}</p>
              <p className="text-[10px] text-gray-300">
                {language === 'en' ? 'Decoding on-chain credit...' : 'Decodificando fiado on-chain...'}
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="text-[11px] leading-tight">{cameraError}</span>
          </div>
        )}

        {/* Opciones de Respaldo: Archivo o Demo */}
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] bg-gray-50 hover:bg-white active:scale-95 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span>{language === 'en' ? 'Upload QR Photo' : 'Subir Foto QR'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={handleLoadDemoFiado}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-[11px] active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{language === 'en' ? 'Simulate Don Tito' : 'Simular Don Tito'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};
