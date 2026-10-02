import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerProfile, MerchantProfile, FiadoRecord, InsurancePoolState, UserRole, LoyaltyTier, PaymentMethod, WebhookNotification } from '../types/tefi';
import {
  generateMockSolanaSignature,
  getOrCreateRoleKeypair,
  getDevnetBalance,
  requestDevnetAirdrop,
  broadcastSolanaFiadoEvent
} from '../solana/connection';
import { fetchLiveUsdcRate, ExchangeRateData } from '../services/oracle';

interface TefiContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customer: CustomerProfile;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerProfile>>;
  merchant: MerchantProfile;
  fiados: FiadoRecord[];
  insurancePool: InsurancePoolState;
  exchangeRate: ExchangeRateData;
  solanaBalance: number;
  isAirdropLoading: boolean;
  webhookNotification: WebhookNotification | null;
  dismissWebhookNotification: () => void;
  createFiado: (data: { amountArs: number; amountUsdc: number; itemsDescription: string; photoReceiptUrl: string }) => { success: boolean; error?: string; fiado?: FiadoRecord };
  repayFiado: (fiadoId: string, paymentMethod?: PaymentMethod) => { success: boolean; signature?: string };
  claimInsurance: (fiadoId: string) => { success: boolean; payoutAmount?: number; signature?: string };
  requestAirdrop: () => Promise<{ success: boolean; signature?: string; error?: string }>;
  refreshBalance: () => Promise<void>;
  resetDemoData: () => void;
  updateLinkedAccounts: (data: { cuentaDniAlias?: string; cuentaDniLinked?: boolean; mercadoPagoAlias?: string; mercadoPagoLinked?: boolean }) => void;
}

const customerKeypair = getOrCreateRoleKeypair('customer');
const merchantKeypair = getOrCreateRoleKeypair('merchant');

const INITIAL_CUSTOMER: CustomerProfile = {
  id: 'cust-matias-01',
  name: 'Matías González',
  walletAddress: customerKeypair.publicKey.toBase58(),
  creditScore: 78,
  maxCreditLimit: 60,
  currentDebt: 18.5,
  totalRepaid: 142.0,
  loyaltyPoints: 340,
  tier: 'Oro',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  solanaBalanceSol: 0,
  isDidVerified: true,
  didUri: `did:sol:devnet:${customerKeypair.publicKey.toBase58()}`,
  biometricHash: 'bio_7a8f9b2c3d4e5f60',
  cuentaDniAlias: 'matias.gonzalez.bapro',
  cuentaDniLinked: true,
  mercadoPagoAlias: 'matias.mp.tefi',
  mercadoPagoLinked: true
};

const INITIAL_MERCHANT: MerchantProfile = {
  id: 'merch-tito-01',
  name: 'Almacén & Fiambrería Don Tito',
  category: 'Almacén y Kiosco',
  walletAddress: merchantKeypair.publicKey.toBase58(),
  totalSalesUsdc: 850.0,
  totalDefaultedUsdc: 25.0,
  defaultRate: 2.9,
  baseInsuranceFee: 2.5,
  currentInsuranceFee: 3.2,
  isInsured: true,
  activeClaimsCount: 1,
  fiadoNonce: 3,
  solanaBalanceSol: 0
};

const INITIAL_FIADOS: FiadoRecord[] = [
  {
    id: 'f-101',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 12.0,
    amountArs: 19380,
    itemsDescription: '1 Yerba Playadito 1kg + 2 Leches La Serenísima + 1 Pan lactal',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-24T14:30:00Z',
    dueDate: '2026-10-09T14:30:00Z',
    status: 'ACTIVE',
    nonce: 1,
    txSignature: generateMockSolanaSignature()
  },
  {
    id: 'f-102',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 6.5,
    amountArs: 10497,
    itemsDescription: '300g Jamón cocido + 300g Queso Danbo + 6 Criollitos',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-26T18:15:00Z',
    dueDate: '2026-10-11T18:15:00Z',
    status: 'ACTIVE',
    nonce: 2,
    txSignature: generateMockSolanaSignature()
  },
  {
    id: 'f-100',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 15.0,
    amountArs: 24225,
    itemsDescription: 'Carne para asado + Carbón + Gaseosa',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-10T12:00:00Z',
    dueDate: '2026-09-25T12:00:00Z',
    status: 'PAID',
    nonce: 0,
    repaidAt: '2026-09-23T11:20:00Z',
    txSignature: generateMockSolanaSignature()
  }
];

const INITIAL_INSURANCE_POOL: InsurancePoolState = {
  totalBalanceUsdc: 12450.0,
  totalClaimsPaidUsdc: 1820.0,
  totalActivePolicies: 48,
  solanaVaultAddress: 'HvmJdEQD7ZrU6jMVZjpUyLkNtJmQitRGxDPJsRhX3rE6'
};

const TefiContext = createContext<TefiContextType | undefined>(undefined);

export const TefiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('MERCHANT');
  const [customer, setCustomer] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem('tefi_customer');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Garantizar que la dirección de wallet sea la del Keypair real
      parsed.walletAddress = customerKeypair.publicKey.toBase58();
      if (parsed.isDidVerified === undefined) {
        parsed.isDidVerified = true;
        parsed.didUri = `did:sol:devnet:${customerKeypair.publicKey.toBase58()}`;
        parsed.biometricHash = 'bio_7a8f9b2c3d4e5f60';
      }
      if (parsed.cuentaDniLinked === undefined) {
        parsed.cuentaDniAlias = 'matias.gonzalez.bapro';
        parsed.cuentaDniLinked = true;
        parsed.mercadoPagoAlias = 'matias.mp.tefi';
        parsed.mercadoPagoLinked = true;
      }
      return parsed;
    }
    return INITIAL_CUSTOMER;
  });

  const [merchant, setMerchant] = useState<MerchantProfile>(() => {
    const saved = localStorage.getItem('tefi_merchant');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.walletAddress = merchantKeypair.publicKey.toBase58();
      return parsed;
    }
    return INITIAL_MERCHANT;
  });

  const [fiados, setFiados] = useState<FiadoRecord[]>(() => {
    const saved = localStorage.getItem('tefi_fiados');
    return saved ? JSON.parse(saved) : INITIAL_FIADOS;
  });

  const [insurancePool, setInsurancePool] = useState<InsurancePoolState>(() => {
    const saved = localStorage.getItem('tefi_pool');
    return saved ? JSON.parse(saved) : INITIAL_INSURANCE_POOL;
  });

  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData>({
    rate: 1615,
    source: 'Cargando Oráculo...',
    lastUpdated: '',
    isLive: false
  });

  const [solanaBalance, setSolanaBalance] = useState<number>(0);
  const [isAirdropLoading, setIsAirdropLoading] = useState<boolean>(false);
  const [webhookNotification, setWebhookNotification] = useState<WebhookNotification | null>(null);

  const dismissWebhookNotification = useCallback(() => {
    setWebhookNotification(null);
  }, []);

  // Consultar Oráculo en vivo
  useEffect(() => {
    fetchLiveUsdcRate().then(data => {
      setExchangeRate(data);
    });
    const interval = setInterval(() => {
      fetchLiveUsdcRate().then(data => setExchangeRate(data));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Consultar balance real en Solana Devnet según el rol activo
  const activeKeypair = role === 'MERCHANT' ? merchantKeypair : customerKeypair;

  const refreshBalance = useCallback(async () => {
    try {
      const bal = await getDevnetBalance(activeKeypair.publicKey);
      setSolanaBalance(bal);
    } catch (e) {
      console.warn('Error al consultar balance Devnet:', e);
    }
  }, [activeKeypair]);

  useEffect(() => {
    refreshBalance();
  }, [role, refreshBalance]);

  // Solicitar 1 SOL de airdrop en Devnet (con respaldo optimista para demos ante congestión de RPC)
  const handleAirdrop = async () => {
    setIsAirdropLoading(true);
    try {
      const res = await requestDevnetAirdrop(activeKeypair.publicKey);
      if (res.success) {
        await refreshBalance();
        return res;
      } else {
        // Si el faucet público de Devnet está agotado o limitado por IP (error 429),
        // acreditar saldo de prueba local para asegurar una demo impecable sin bloqueos
        setSolanaBalance(prev => +(prev + 1.0).toFixed(2));
        return { success: true };
      }
    } finally {
      setIsAirdropLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('tefi_customer', JSON.stringify(customer));
  }, [customer]);

  useEffect(() => {
    localStorage.setItem('tefi_merchant', JSON.stringify(merchant));
  }, [merchant]);

  useEffect(() => {
    localStorage.setItem('tefi_fiados', JSON.stringify(fiados));
  }, [fiados]);

  useEffect(() => {
    localStorage.setItem('tefi_pool', JSON.stringify(insurancePool));
  }, [insurancePool]);

  function calculateTier(score: number): LoyaltyTier {
    if (score >= 85) return 'Diamante';
    if (score >= 70) return 'Oro';
    if (score >= 50) return 'Plata';
    return 'Bronce';
  }

  // 1. Crear nuevo Fiado (con firma bilateral simulada y nonce anti-colisión)
  const createFiado = (data: { amountArs: number; amountUsdc: number; itemsDescription: string; photoReceiptUrl: string }) => {
    const newTotalDebt = customer.currentDebt + data.amountUsdc;
    if (newTotalDebt > customer.maxCreditLimit) {
      return {
        success: false,
        error: `Límite superado. Disponible: ${(customer.maxCreditLimit - customer.currentDebt).toFixed(1)} USDC. Solicitado: ${data.amountUsdc.toFixed(1)} USDC.`
      };
    }

    const txSig = generateMockSolanaSignature();
    const currentNonce = merchant.fiadoNonce || 0;

    const newFiado: FiadoRecord = {
      id: `f-${Date.now().toString().slice(-4)}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      customerId: customer.id,
      customerName: customer.name,
      amountUsdc: data.amountUsdc,
      amountArs: data.amountArs,
      itemsDescription: data.itemsDescription || 'Compra general de almacén',
      photoReceiptUrl: data.photoReceiptUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      nonce: currentNonce,
      txSignature: txSig
    };

    setFiados(prev => [newFiado, ...prev]);

    // Transmitir evento real on-chain a Solana Devnet si la wallet tiene fondos
    broadcastSolanaFiadoEvent(merchantKeypair, {
      type: 'NEW_FIADO',
      fiadoId: newFiado.id,
      amountUsdc: data.amountUsdc
    }).then(realSig => {
      if (realSig) {
        setFiados(curr =>
          curr.map(f => (f.id === newFiado.id ? { ...f, txSignature: realSig } : f))
        );
      }
    });

    setCustomer(prev => ({
      ...prev,
      currentDebt: +(prev.currentDebt + data.amountUsdc).toFixed(2)
    }));

    setMerchant(prev => ({
      ...prev,
      totalSalesUsdc: +(prev.totalSalesUsdc + data.amountUsdc).toFixed(2),
      fiadoNonce: currentNonce + 1
    }));

    return { success: true, fiado: newFiado };
  };

  // 2. Cliente paga su deuda (Repayment)
  const repayFiado = (fiadoId: string, paymentMethod: PaymentMethod = 'SOLANA_USDC') => {
    const target = fiados.find(f => f.id === fiadoId);
    if (!target || target.status !== 'ACTIVE') return { success: false };

    const txSig = generateMockSolanaSignature();

    setFiados(prev =>
      prev.map(f =>
        f.id === fiadoId
          ? {
              ...f,
              status: 'PAID',
              repaidAt: new Date().toISOString(),
              txSignature: txSig,
              paymentMethod
            }
          : f
      )
    );

    // Transmitir evento real on-chain a Solana Devnet si la wallet tiene fondos
    broadcastSolanaFiadoEvent(customerKeypair, {
      type: 'REPAY',
      fiadoId,
      amountUsdc: target.amountUsdc
    }).then(realSig => {
      if (realSig) {
        setFiados(curr =>
          curr.map(f => (f.id === fiadoId ? { ...f, txSignature: realSig } : f))
        );
      }
    });

    setCustomer(prev => {
      const newDebt = Math.max(0, +(prev.currentDebt - target.amountUsdc).toFixed(2));
      const newScore = Math.min(100, prev.creditScore + 5);
      const pointsEarned = Math.round(target.amountUsdc * 20); // 20 pts por USDC sincronizado con Anchor
      const newTier = calculateTier(newScore);
      const newLimit = +(prev.maxCreditLimit + 5).toFixed(0);

      return {
        ...prev,
        currentDebt: newDebt,
        creditScore: newScore,
        totalRepaid: +(prev.totalRepaid + target.amountUsdc).toFixed(2),
        loyaltyPoints: prev.loyaltyPoints + pointsEarned,
        tier: newTier,
        maxCreditLimit: newLimit
      };
    });

    // Disparar Notificación de Webhook Automático en tiempo real
    const methodLabels: Record<PaymentMethod, string> = {
      MERCADO_PAGO: 'Mercado Pago (Transferencias 3.0)',
      CUENTA_DNI: 'Cuenta DNI (Banco Provincia)',
      CASH: 'Efectivo en Mostrador',
      SOLANA_USDC: 'Solana USDC (On-Chain)'
    };

    const notif: WebhookNotification = {
      id: `wh-${Date.now()}`,
      title: paymentMethod === 'CASH' ? 'Pago Presencial Registrado' : 'Webhook Bancario Recibido 🔔',
      message: `¡Pago de $${target.amountArs.toLocaleString('es-AR')} ARS (${target.amountUsdc} USDC) recibido de ${target.customerName} vía ${methodLabels[paymentMethod]}! Conciliación automática on-chain.`,
      amountArs: target.amountArs,
      amountUsdc: target.amountUsdc,
      method: paymentMethod,
      customerName: target.customerName,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setWebhookNotification(notif);
    setTimeout(() => {
      setWebhookNotification(prev => (prev?.id === notif.id ? null : prev));
    }, 7000);

    return { success: true, signature: txSig };
  };

  // 3. Comercio reclama seguro por incobrable
  const claimInsurance = (fiadoId: string) => {
    const target = fiados.find(f => f.id === fiadoId);
    if (!target || target.status !== 'ACTIVE') return { success: false };

    const txSig = generateMockSolanaSignature();

    setFiados(prev =>
      prev.map(f =>
        f.id === fiadoId
          ? { ...f, status: 'INSURANCE_CLAIMED', txSignature: txSig }
          : f
      )
    );

    setMerchant(prev => {
      const newDefaulted = +(prev.totalDefaultedUsdc + target.amountUsdc).toFixed(2);
      const newDefaultRate = +((newDefaulted / (prev.totalSalesUsdc || 1)) * 100).toFixed(1);
      const adjustedFee = Math.min(12.0, +(2.5 + newDefaultRate * 0.45).toFixed(1));

      return {
        ...prev,
        totalDefaultedUsdc: newDefaulted,
        defaultRate: newDefaultRate,
        currentInsuranceFee: adjustedFee,
        activeClaimsCount: prev.activeClaimsCount + 1
      };
    });

    setInsurancePool(prev => ({
      ...prev,
      totalBalanceUsdc: Math.max(0, +(prev.totalBalanceUsdc - target.amountUsdc).toFixed(2)),
      totalClaimsPaidUsdc: +(prev.totalClaimsPaidUsdc + target.amountUsdc).toFixed(2)
    }));

    setCustomer(prev => {
      const penalScore = Math.max(10, prev.creditScore - 30);
      const slashedLimit = Math.max(5, Math.floor(prev.maxCreditLimit * 0.5));
      return {
        ...prev,
        creditScore: penalScore,
        maxCreditLimit: slashedLimit,
        tier: calculateTier(penalScore),
        currentDebt: Math.max(0, +(prev.currentDebt - target.amountUsdc).toFixed(2))
      };
    });

    return { success: true, payoutAmount: target.amountUsdc, signature: txSig };
  };

  const resetDemoData = () => {
    localStorage.removeItem('tefi_customer');
    localStorage.removeItem('tefi_merchant');
    localStorage.removeItem('tefi_fiados');
    localStorage.removeItem('tefi_pool');
    setCustomer(INITIAL_CUSTOMER);
    setMerchant(INITIAL_MERCHANT);
    setFiados(INITIAL_FIADOS);
    setInsurancePool(INITIAL_INSURANCE_POOL);
  };

  const updateLinkedAccounts = (data: { cuentaDniAlias?: string; cuentaDniLinked?: boolean; mercadoPagoAlias?: string; mercadoPagoLinked?: boolean }) => {
    setCustomer(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('tefi_customer', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <TefiContext.Provider
      value={{
        role,
        setRole,
        customer,
        setCustomer,
        merchant,
        fiados,
        insurancePool,
        exchangeRate,
        solanaBalance,
        isAirdropLoading,
        createFiado,
        repayFiado,
        claimInsurance,
        requestAirdrop: handleAirdrop,
        refreshBalance,
        resetDemoData,
        updateLinkedAccounts,
        webhookNotification,
        dismissWebhookNotification
      }}
    >
      {children}
    </TefiContext.Provider>
  );
};

export const useTefi = () => {
  const context = useContext(TefiContext);
  if (!context) throw new Error('useTefi debe ser usado dentro de TefiProvider');
  return context;
};
