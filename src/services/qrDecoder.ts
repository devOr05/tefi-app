// Lectura de códigos QR desde los píxeles de la cámara o de una foto.
// El QR de co-firma lleva una transacción entera (unos 100 módulos por lado). Solo se puede leer si se
// decodifica a la resolución real de la cámara, no a la del recuadro que se ve en pantalla.
import jsQR from 'jsqr';

/** Lado máximo, en píxeles, de la imagen que se decodifica: más resolución no lee mejor y gasta batería. */
export const MAX_DECODE_SIDE = 1280;

export interface NativeQrDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

/** Detector de códigos del sistema operativo (Chrome en Android, por ejemplo). Donde no existe se usa jsQR. */
export async function createNativeQrDetector(): Promise<NativeQrDetector | null> {
  try {
    const Detector = (globalThis as { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) return null;
    const formats: string[] = await Detector.getSupportedFormats();
    return formats.includes('qr_code') ? new Detector({ formats: ['qr_code'] }) : null;
  } catch (e) {
    return null;
  }
}

/** Lee el QR que haya en una imagen RGBA. Devuelve su texto, o null si no encuentra ninguno. */
export function decodeQrPixels(data: Uint8ClampedArray, width: number, height: number): string | null {
  const found = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });
  return found?.data || null;
}

/**
 * Recorte cuadrado del centro de un cuadro de video (lo mismo que muestra el visor) y el tamaño al que
 * se lo lleva para decodificar.
 */
export function centerSquare(width: number, height: number): { sx: number; sy: number; side: number; target: number } {
  const side = Math.min(width, height);
  return {
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    side,
    target: Math.min(side, MAX_DECODE_SIDE)
  };
}
