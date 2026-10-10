import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

export const QrImage: React.FC<{ value: string; alt: string }> = ({ value, alt }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Los pedidos de co-firma llevan una transacción completa: QR denso, generado a alta resolución
    QRCode.toDataURL(value, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(url => {
        if (isMounted) setDataUrl(url);
      })
      .catch(err => {
        console.error('Error al generar código QR:', err);
        if (isMounted) setDataUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div className="w-full aspect-square flex items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }
  return <img src={dataUrl} alt={alt} className="w-full aspect-square object-contain rounded-xl block" />;
};
