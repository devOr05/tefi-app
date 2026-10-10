import React, { useEffect, useRef, useState } from 'react';
import { useTefi } from '../context/TefiContext';
import { NativeQrDetector, centerSquare, createNativeQrDetector, decodeQrPixels } from '../services/qrDecoder';
import { X, Camera, AlertCircle, Upload, RefreshCw, ClipboardPaste } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  // Recibe el texto leído; devuelve un mensaje de error si no sirve o null si fue aceptado
  onScan: (text: string) => Promise<string | null>;
}

const SCAN_INTERVAL_MS = 150;
// Un QR denso que jsQR no lee al tamaño de la cámara muchas veces sale agrandado: se alterna un intento y otro
const ENLARGED_FRAME_SCALE = 1.5;
// Donde el teléfono tiene detector propio, jsQR queda de respaldo y corre uno de cada tres cuadros para no cargarlo
const JSQR_BACKUP_EVERY = 3;
// Lado máximo al que se lleva una foto subida antes de buscarle el QR
const MAX_PHOTO_SIDE = 2000;

// Lee el QR del cuadro actual de la cámara, a la resolución de la cámara y no a la del visor.
// `pass` es el número de cuadro: decide cuándo le toca a jsQR y si lee el cuadro agrandado.
async function readFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detector: NativeQrDetector | null,
  pass: number
): Promise<string | null> {
  let jsQrTurn = pass;
  if (detector) {
    try {
      const found = await detector.detect(video);
      if (found[0]?.rawValue) return found[0].rawValue;
    } catch (e) {
      // Si el detector del sistema falla en este cuadro se sigue con jsQR
    }
    if (pass % JSQR_BACKUP_EVERY !== JSQR_BACKUP_EVERY - 1) return null;
    jsQrTurn = Math.floor(pass / JSQR_BACKUP_EVERY);
  }

  const { sx, sy, side, target } = centerSquare(video.videoWidth, video.videoHeight);
  if (!side) return null;
  const size = Math.round(target * (jsQrTurn % 2 === 1 ? ENLARGED_FRAME_SCALE : 1));
  if (canvas.width !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return decodeQrPixels(context.getImageData(0, 0, size, size).data, size, size);
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, title, subtitle, onScan }) => {
  const { tr } = useTefi();
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // La lectura de la cámara corre en un ciclo propio: el estado en curso y el destino del texto se leen de refs
  const processingRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleScannedText = async (text: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setScanError(null);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    const error = await onScanRef.current(text);
    if (error) {
      setScanError(error);
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 2500);
    }
    // Si fue aceptado, quien abrió el escáner lo cierra y la cámara se apaga al desmontarse
  };

  useEffect(() => {
    if (!isOpen) return;
    processingRef.current = false;
    setIsProcessing(false);
    setScanError(null);
    setPastedText('');

    let isClosed = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement('canvas');

    const start = async () => {
      try {
        // El QR de co-firma es denso: se pide la mayor resolución que dé la cámara trasera
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
      } catch (err) {
        console.warn('No se pudo iniciar la cámara:', err);
        if (!isClosed) {
          setScanError(
            tr(
              'Could not access the camera. Check the browser permissions, upload a photo of the QR or paste the link.',
              'No se pudo acceder a la cámara. Revisá los permisos del navegador, subí una foto del QR o pegá el link.'
            )
          );
        }
        return;
      }

      const video = videoRef.current;
      if (isClosed || !video) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      // Enfoque continuo donde el navegador lo permite (Chrome en Android)
      stream
        .getVideoTracks()[0]
        ?.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
        .catch(() => {});

      const detector = await createNativeQrDetector();
      let frames = 0;
      const scan = async () => {
        if (isClosed) return;
        if (!processingRef.current && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const text = await readFrame(video, canvas, detector, frames++).catch(() => null);
          if (text && !isClosed) await handleScannedText(text);
        }
        if (!isClosed) timer = setTimeout(scan, SCAN_INTERVAL_MS);
      };
      scan();
    };
    start();

    return () => {
      isClosed = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      // Al reabrir el escáner no tiene que verse el aviso de la lectura anterior
      setScanError(null);
      setIsProcessing(false);
    };
  }, [isOpen]);

  // Foto del QR (captura de pantalla o foto recibida por mensaje)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let text: string | null = null;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        text = decodeQrPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      }
    } catch (err) {
      console.warn('No se pudo leer la imagen subida:', err);
    }

    if (text) {
      handleScannedText(text);
    } else {
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

        {/* Visor de la cámara: muestra el cuadrado central del video, que es lo que se decodifica */}
        <div className="my-3.5 relative rounded-2xl overflow-hidden bg-gray-950 aspect-square border-2 border-emerald-500/80 shadow-inner">
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

          {/* Guía visual de escaneo */}
          <div className="absolute inset-5 pointer-events-none border-2 border-dashed border-emerald-400/70 rounded-2xl animate-pulse" />

          {isProcessing && !scanError && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 p-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-bold">{tr('QR detected', 'QR detectado')}</p>
              <p className="text-[10px] text-gray-300">{tr('Reading and verifying...', 'Leyendo y verificando...')}</p>
            </div>
          )}
        </div>

        {!scanError && (
          <p className="-mt-1.5 mb-3 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            {tr('Bring the phone closer until the QR fills the frame', 'Acercá el teléfono hasta que el QR llene el recuadro')}
          </p>
        )}

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
