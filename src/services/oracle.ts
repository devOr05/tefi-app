// Cotización del peso argentino para Tefi
// Consulta el tipo de cambio cripto (USDC / USDT a ARS) a la API REST de dolarapi.com (fuera de la cadena)

export interface ExchangeRateData {
  rate: number;
  source: string; // de dónde sale la cotización, en el idioma de la interfaz
  lastUpdated: string;
  isLive: boolean;
}

// Lo que devuelve la consulta; el texto de `source` lo arma la interfaz según el idioma
export type ExchangeRateQuote = Omit<ExchangeRateData, 'source'>;

export const FALLBACK_RATE = 1450; // Respaldo en caso de desconexión

export async function fetchLiveUsdcRate(): Promise<ExchangeRateQuote> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/cripto');
    if (!res.ok) throw new Error('Respuesta no válida de dolarapi.com');
    const data = await res.json();
    const rate = Math.round(data.venta || data.compra || FALLBACK_RATE);
    return {
      rate,
      lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isLive: true
    };
  } catch (err) {
    console.warn('Cotización no disponible, utilizando tasa de referencia:', err);
    return {
      rate: FALLBACK_RATE,
      lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isLive: false
    };
  }
}
