export type UserRole = 'CUSTOMER' | 'MERCHANT';

export type LoyaltyTier = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

export type FiadoStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'INSURANCE_CLAIMED';

export interface CustomerProfile {
  id: string;
  name: string;
  walletAddress: string;
  hasOnChainProfile: boolean; // false hasta que el primer fiado crea su CustomerProfile PDA
  creditScore: number; // 0 a 100
  maxCreditLimit: number; // Límite en USDC (ej: $50)
  currentDebt: number; // Deuda activa en USDC
  totalRepaid: number; // Total devuelto históricamente
  loyaltyPoints: number; // Puntos Tefi acumulados
  tier: LoyaltyTier;
}

export interface MerchantProfile {
  id: string;
  name: string;
  category: string;
  walletAddress: string;
  hasOnChainProfile: boolean; // false hasta que el almacén crea su MerchantProfile PDA con el primer fiado
  totalSalesUsdc: number;
}

// Un fiado de la libreta. Monto, vencimiento y estado se leen de la cuenta FiadoRecord on-chain;
// el detalle de la compra y la foto existen solo en los teléfonos que participaron.
export interface FiadoRecord {
  id: string; // dirección de la cuenta FiadoRecord (PDA)
  merchantId: string; // clave pública del almacén
  merchantName: string;
  customerId: string; // clave pública del vecino
  customerName: string;
  amountUsdc: number;
  amountArs: number;
  itemsDescription: string;
  photoReceiptUrl: string; // Foto del ticket o productos
  createdAt: string;
  dueDate: string;
  status: FiadoStatus;
  nonce?: number;
  receiptHash?: string;
  txSignature?: string;
  repayTxSignature?: string;
  repaidAt?: string;
}

// Vecino agendado en el teléfono del almacén: solo su clave pública y el nombre que le puso el almacenero
export interface NeighborContact {
  address: string;
  name: string;
  addedAt: string;
}

// Pedido de co-firma que el almacén muestra en el QR hasta que el vecino lo firma y lo envía
export interface PendingCosign {
  kind: 'issue' | 'repay';
  url: string;
  // Un intento por cada QR generado: se regenera con un blockhash nuevo antes de que venza
  attempts: { signature: string; fiadoAddress: string }[];
  expiresAt: number;
  nonce: number;
  neighbor: NeighborContact;
  amountUsdc: number;
  amountArs: number;
  itemsDescription: string;
  photoReceiptUrl: string;
  photoSha256: string;
  receiptHash: string;
  dueDate: string;
  includesProfileSetup: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}
