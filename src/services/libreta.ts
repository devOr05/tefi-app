import { FiadoRecord } from '../types/tefi';
import { OnChainFiado } from '../solana/program';

/**
 * La libreta se arma con lo que dice la cadena (monto, vencimiento, estado) más el detalle que
 * guardó este teléfono cuando participó del fiado (pesos, productos, foto, nombre de la otra parte).
 */
export interface FiadoLocalDetail {
  amountArs?: number;
  itemsDescription?: string;
  photoReceiptUrl?: string;
  counterpartyName?: string;
  createdAt?: string;
  repaidAt?: string;
  txSignature?: string;
  repayTxSignature?: string;
  // Momento en que el almacén mostró el QR; se borra al verse el fiado on-chain
  pendingSince?: number;
}

export type FiadoLocalDetails = Record<string, FiadoLocalDetail>;

export const shortAddress = (address: string): string => `${address.slice(0, 4)}…${address.slice(-4)}`;

export function buildLibreta(params: {
  onChain: OnChainFiado[];
  details: FiadoLocalDetails;
  viewer: 'merchant' | 'customer';
  ownName: string;
  contactNames: Record<string, string>;
  arsPerUsdc: number;
}): FiadoRecord[] {
  const { onChain, details, viewer, ownName, contactNames, arsPerUsdc } = params;

  const records = onChain.map((fiado): FiadoRecord => {
    const detail = details[fiado.address] ?? {};
    const counterparty = viewer === 'merchant' ? fiado.customer : fiado.merchant;
    const counterpartyName = contactNames[counterparty] || detail.counterpartyName || shortAddress(counterparty);

    return {
      id: fiado.address,
      merchantId: fiado.merchant,
      merchantName: viewer === 'merchant' ? ownName : counterpartyName,
      customerId: fiado.customer,
      customerName: viewer === 'customer' ? ownName : counterpartyName,
      amountUsdc: fiado.amountUsdc,
      amountArs: detail.amountArs ?? Math.round(fiado.amountUsdc * arsPerUsdc),
      itemsDescription: detail.itemsDescription ?? '',
      photoReceiptUrl: detail.photoReceiptUrl ?? '',
      createdAt: detail.createdAt ?? '',
      dueDate: new Date(fiado.dueTimestamp * 1000).toISOString(),
      status: fiado.status,
      nonce: fiado.nonce,
      receiptHash: fiado.receiptHash,
      txSignature: detail.txSignature,
      repayTxSignature: detail.repayTxSignature,
      repaidAt: detail.repaidAt
    };
  });

  // Primero lo que vence antes; los ya saldados quedan abajo, del más nuevo al más viejo
  return records.sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status === 'ACTIVE') return a.dueDate.localeCompare(b.dueDate);
    if (a.status === 'ACTIVE') return -1;
    if (b.status === 'ACTIVE') return 1;
    return (b.nonce ?? 0) - (a.nonce ?? 0);
  });
}
