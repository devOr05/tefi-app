import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, CheckCircle, RefreshCcw, Sparkles } from 'lucide-react';
import { useTefi } from '../context/TefiContext';

interface CameraCaptureProps {
  onCapture: (photoUrl: string) => void;
  initialPhoto?: string;
}

const PRESET_PHOTOS = [
  {
    nameEs: 'Ticket Almacén',
    nameEn: 'Store Receipt',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
  },
  {
    nameEs: 'Fiambrería y Pan',
    nameEn: 'Deli & Bread',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80'
  },
  {
    nameEs: 'Asado y Bebidas',
    nameEn: 'BBQ & Drinks',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80'
  }
];

// Utilidad para comprimir fotos en el navegador evitando desbordar el localStorage
const compressImage = (fileOrDataUrl: File | string, maxWidth = 800, quality = 0.72): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, initialPhoto }) => {
  const { t, language } = useTefi();
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhoto || '');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Manejo de archivo o cámara nativa móvil con compresión automática
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file);
        setPhotoUrl(compressed);
        onCapture(compressed);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // 2. Abrir cámara web en vivo si está disponible
  const startLiveCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('No se pudo acceder a la cámara en vivo, usando selector de archivos', err);
      setIsCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 480;
      canvas.height = videoRef.current.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(dataUrl);
        onCapture(dataUrl);
        stopLiveCamera();
      }
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const selectPreset = (url: string) => {
    setPhotoUrl(url);
    onCapture(url);
    stopLiveCamera();
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
        <span>📸 {t('cameraPhotoTicket')}</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{t('photoStaysOnPhone')}</span>
      </label>

      {/* Input nativo de cámara para celulares */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {isCompressing ? (
        <div className="border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{t('cameraOptimizing')}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('cameraMobileReady')}</span>
        </div>
      ) : isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-emerald-500 shadow-md">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={takeSnapshot}
              className="px-5 py-2.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {t('capturePhotoBtn')}
            </button>
            <button
              type="button"
              onClick={stopLiveCamera}
              className="px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium cursor-pointer"
            >
              {t('cancelBtn')}
            </button>
          </div>
        </div>
      ) : photoUrl ? (
        <div className="relative rounded-2xl overflow-hidden aspect-4/3 border border-emerald-200 dark:border-emerald-800 shadow-xs group bg-gray-50 dark:bg-gray-800">
          <img src={photoUrl} alt="Comprobante" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle className="w-3 h-3" />
            {t('photoLoaded')}
          </div>
          <button
            type="button"
            onClick={() => {
              setPhotoUrl('');
              onCapture('');
            }}
            className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:bg-white dark:hover:bg-gray-900 cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            {t('changePhoto')}
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('takePhotoOrTicket')}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5 mb-3">{t('avoidDisputes')}</p>

          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={startLiveCamera}
              className="px-3.5 py-1.5 rounded-xl gradient-tefi text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('openCameraBtn')}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              {t('galleryBtn')}
            </button>
          </div>

          {/* Presets rápidos para demo */}
          <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-750 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">{t('quickDemo')}</span>
            {PRESET_PHOTOS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPreset(p.url)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer"
              >
                {language === 'en' ? p.nameEn : p.nameEs}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
