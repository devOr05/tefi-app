// Servicio de Oráculo Cambiario en Tiempo Real para Tefi
// Consulta el tipo de cambio cripto (USDC / USDT a ARS) en vivo

export interface ExchangeRateData {
  rate: number;
  source: string;
  lastUpdated: string;
  isLive: boolean;
}

const FALLBACK_RATE = 1450; // Respaldo en caso de desconexión

export async function fetchLiveUsdcRate(): Promise<ExchangeRateData> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/cripto');
    if (!res.ok) throw new Error('Respuesta no válida del oráculo');
    const data = await res.json();
    const rate = Math.round(data.venta || data.compra || FALLBACK_RATE);
    return {
      rate,
      source: 'DolarApi (Cripto / USDC)',
      lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isLive: true
    };
  } catch (err) {
    console.warn('Oráculo no disponible, utilizando tasa de referencia:', err);
    return {
      rate: FALLBACK_RATE,
      source: 'Tasa de Referencia Offline',
      lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isLive: false
    };
  }
}
