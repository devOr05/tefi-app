// Conexión y utilidades para Solana Devnet

export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
export const TEFI_PROGRAM_ID = 'TefiProg111111111111111111111111111111111111';
export const INSURANCE_VAULT_PDA = 'TefiVault1111111111111111111111111111111111';

export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function generateMockSolanaSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

export async function pingSolanaDevnet(): Promise<boolean> {
  try {
    const res = await fetch(SOLANA_DEVNET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    const data = await res.json();
    return data.result === 'ok';
  } catch (e) {
    return false;
  }
}
