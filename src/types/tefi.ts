export type UserRole = 'CUSTOMER' | 'MERCHANT';

export type LoyaltyTier = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

export type FiadoStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'INSURANCE_CLAIMED';

export type PaymentMethod = 'MERCADO_PAGO' | 'CUENTA_DNI' | 'CASH' | 'SOLANA_USDC';

export interface CustomerProfile {
  id: string;
  name: string;
  walletAddress: string;
  creditScore: number; // 0 a 100
  maxCreditLimit: number; // Límite en USDC (ej: $50)
  currentDebt: number; // Deuda activa en USDC
  totalRepaid: number; // Total devuelto históricamente
  loyaltyPoints: number; // Puntos Tefi acumulados
  tier: LoyaltyTier;
  avatarUrl?: string;
  solanaBalanceSol?: number;
  isDidVerified?: boolean;
  didUri?: string;
  biometricHash?: string;
  cuentaDniAlias?: string;
  cuentaDniLinked?: boolean;
  mercadoPagoAlias?: string;
  mercadoPagoLinked?: boolean;
  abundanceSavingsSol?: number;
  abundanceSavingsUsdc?: number;
  abundanceYieldEarnedUsdc?: number;
}

export interface MerchantProfile {
  id: string;
  name: string;
  category: string;
  walletAddress: string;
  totalSalesUsdc: number;
  totalDefaultedUsdc: number;
  defaultRate: number; // % de incobrabilidad
  baseInsuranceFee: number; // % base (ej: 2.5%)
  currentInsuranceFee: number; // % ajustado por riesgo (aumenta si tiene muchos incobrables)
  isInsured: boolean;
  activeClaimsCount: number;
  fiadoNonce?: number;
  solanaBalanceSol?: number;
}

export interface FiadoRecord {
  id: string;
  merchantId: string;
  merchantName: string;
  customerId: string;
  customerName: string;
  amountUsdc: number;
  amountArs: number;
  itemsDescription: string;
  photoReceiptUrl: string; // Foto del ticket o productos
  createdAt: string;
  dueDate: string;
  status: FiadoStatus;
  nonce?: number;
  txSignature?: string;
  repaidAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface InsurancePoolState {
  totalBalanceUsdc: number;
  totalClaimsPaidUsdc: number;
  totalActivePolicies: number;
  solanaVaultAddress: string;
}

export interface WebhookNotification {
  id: string;
  title: string;
  message: string;
  amountArs: number;
  amountUsdc: number;
  method: PaymentMethod;
  customerName: string;
  timestamp: string;
}

