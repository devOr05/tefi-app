import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTefi } from '../context/TefiContext';
import { X, Camera, AlertCircle, Upload, RefreshCw, ClipboardPaste } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  // Recibe el texto leído; devuelve un mensaje de error si no sirve o null si fue aceptado
  onScan: (text: string) => Promise<string | null>;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, title, subtitle, onScan }) => {
  const { tr } = useTefi();
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // El callback de la cámara se registra una sola vez: el estado en curso se lee de un ref
  const processingRef = useRef(false);

  const handleScannedText = async (text: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setScanError(null);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    const error = await onScan(text);
    if (error) {
      setScanError(error);
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 2500);
    } else {
      await stopScanner();
    }
  };

  const startScanner = async () => {
    setScanError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('tefi-qr-reader', {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          verbose: false
        });
      }

      // Escanear área amplia (88% del visor) para que nunca corte esquinas en pantallas
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
          handleScannedText(decodedText);
        },
        () => {
          // Errores de frame ignorados
        }
      );
    } catch (err: any) {
      console.warn('No se pudo iniciar la cámara:', err);
      setScanError(
        tr(
          'Could not access the camera. Check the browser permissions, upload a photo of the QR or paste the link.',
          'No se pudo acceder a la cámara. Revisá los permisos del navegador, subí una foto del QR o pegá el link.'
        )
      );
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
    }
  };

  useEffect(() => {
    if (isOpen) {
      processingRef.current = false;
      setIsProcessing(false);
      setPastedText('');
      // Dar un tick para que el elemento del DOM exista
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
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
      handleScannedText(decodedResult);
    } catch (err) {
      setScanError(tr('No QR code was found in the uploaded image.', 'No se encontró un código QR en la imagen subida.'));
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText.trim()) handleScannedText(pastedText.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative border border-gray-100 dark:border-gray-800 my-auto">
        <button
          onClick={onClose}
          aria-label={tr('Close', 'Cerrar')}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2">
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>

        {/* Viewport de Cámara */}
        <div className="my-3.5 relative rounded-2xl overflow-hidden bg-gray-950 aspect-square border-2 border-emerald-500/80 shadow-inner flex items-center justify-center">
          <div id="tefi-qr-reader" className="w-full h-full" />

          {/* Guía visual de escaneo */}
          <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-emerald-400/70 rounded-2xl animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded-full">
              {tr('Center QR code', 'Centrar código QR')}
            </span>
          </div>

          {isProcessing && !scanError && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 p-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-bold">{tr('QR detected', 'QR detectado')}</p>
              <p className="text-[10px] text-gray-300">{tr('Reading and verifying...', 'Leyendo y verificando...')}</p>
            </div>
          )}
        </div>

        {scanError && (
          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="text-[11px] leading-tight">{scanError}</span>
          </div>
        )}

        {/* Alternativas a la cámara: foto del QR o link recibido por mensaje */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <form onSubmit={handlePasteSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={tr('...or paste the link here', '...o pegá el link acá')}
              aria-label={tr('Paste link', 'Pegar link')}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-900 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!pastedText.trim() || isProcessing}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl gradient-tefi text-white font-bold text-[11px] disabled:opacity-50 cursor-pointer shrink-0"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>{tr('Open', 'Abrir')}</span>
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] bg-gray-50 hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span>{tr('Upload QR Photo', 'Subir Foto QR')}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={onClose}
              className="py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-[11px] hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {tr('Cancel', 'Cancelar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
