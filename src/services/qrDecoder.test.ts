import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { MAX_DECODE_SIDE, centerSquare, decodeQrPixels } from './qrDecoder';

// Dibuja un QR como lo vería una cámara perfecta: `pixelsPerModule` píxeles por módulo y un margen blanco
function renderQr(text: string, pixelsPerModule: number) {
  const { modules, version } = QRCode.create(text, { errorCorrectionLevel: 'L' });
  const margin = 4;
  const side = (modules.size + margin * 2) * pixelsPerModule;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (!modules.data[row * modules.size + col]) continue;
      for (let y = 0; y < pixelsPerModule; y++) {
        for (let x = 0; x < pixelsPerModule; x++) {
          const offset = (((row + margin) * pixelsPerModule + y) * side + (col + margin) * pixelsPerModule + x) * 4;
          pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 15;
        }
      }
    }
  }
  return { pixels, side, version, modulesPerSide: modules.size };
}

// Un pedido de co-firma real ronda los 830 caracteres: URL de la app + transacción en base64 + ticket
const cosignSizedUrl = `https://tef-iapp.vercel.app/?cosign=${'Qk9vZ2FsbG9zZGVwcnVlYmE'.repeat(40).slice(0, 700)}&s=Almac%C3%A9n+Don+Tito&ars=1500&d=Yerba+500g+%2B+1+Pan&ph=${'ab12'.repeat(16)}`;

describe('decodeQrPixels', () => {
  it('reads a QR as dense as a co-sign request at camera resolution', () => {
    const qr = renderQr(cosignSizedUrl, 5);

    expect(cosignSizedUrl.length).toBeGreaterThan(800);
    expect(qr.modulesPerSide).toBeGreaterThanOrEqual(97);
    // Entra en lo que entrega una cámara de teléfono sin tener que agrandarlo
    expect(qr.side).toBeLessThanOrEqual(MAX_DECODE_SIDE);
    expect(decodeQrPixels(qr.pixels, qr.side, qr.side)).toBe(cosignSizedUrl);
  });

  it('reads the short QR a neighbor shows to a store', () => {
    const url = 'https://tef-iapp.vercel.app/?neighbor=8DqYj6dsTX21KisFnGTSpvSfnsHS49xc2YhCV7yJja5z&name=Mat%C3%ADas+Gonz%C3%A1lez';
    const qr = renderQr(url, 4);

    expect(decodeQrPixels(qr.pixels, qr.side, qr.side)).toBe(url);
  });

  it('returns null when the image has no QR', () => {
    const side = 200;
    expect(decodeQrPixels(new Uint8ClampedArray(side * side * 4).fill(128), side, side)).toBeNull();
  });
});

describe('centerSquare', () => {
  it('takes the centre of a landscape frame at its native resolution', () => {
    expect(centerSquare(1920, 1080)).toEqual({ sx: 420, sy: 0, side: 1080, target: 1080 });
  });

  it('takes the centre of a portrait frame, as phones deliver it', () => {
    expect(centerSquare(1080, 1920)).toEqual({ sx: 0, sy: 420, side: 1080, target: 1080 });
  });

  it('caps very large frames', () => {
    expect(centerSquare(3840, 2160)).toEqual({ sx: 840, sy: 0, side: 2160, target: MAX_DECODE_SIDE });
  });
});
