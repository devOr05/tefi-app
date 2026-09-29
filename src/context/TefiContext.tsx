import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerProfile, MerchantProfile, FiadoRecord, InsurancePoolState, UserRole, LoyaltyTier } from '../types/tefi';
import { generateMockSolanaSignature } from '../solana/connection';

interface TefiContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customer: CustomerProfile;
  merchant: MerchantProfile;
  fiados: FiadoRecord[];
  insurancePool: InsurancePoolState;
  createFiado: (data: { amountArs: number; amountUsdc: number; itemsDescription: string; photoReceiptUrl: string }) => { success: boolean; error?: string; fiado?: FiadoRecord };
  repayFiado: (fiadoId: string) => { success: boolean; signature?: string };
  claimInsurance: (fiadoId: string) => { success: boolean; payoutAmount?: number; signature?: string };
  resetDemoData: () => void;
}

const INITIAL_CUSTOMER: CustomerProfile = {
  id: 'cust-matias-01',
  name: 'Matías González',
  walletAddress: '8Yq7...9xL2',
  creditScore: 78, // Buen puntaje inicial
  maxCreditLimit: 60, // 60 USDC de límite inicial
  currentDebt: 18.5,
  totalRepaid: 142.0,
  loyaltyPoints: 340,
  tier: 'Oro',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const INITIAL_MERCHANT: MerchantProfile = {
  id: 'merch-tito-01',
  name: 'Almacén & Fiambrería Don Tito',
  category: 'Almacén y Kiosco',
  walletAddress: '3Kx9...4nM7',
  totalSalesUsdc: 850.0,
  totalDefaultedUsdc: 25.0,
  defaultRate: 2.9, // 2.9% de incobrabilidad
  baseInsuranceFee: 2.5, // 2.5% base
  currentInsuranceFee: 3.2, // 3.2% ajustado por riesgo
  isInsured: true,
  activeClaimsCount: 1
};

const INITIAL_FIADOS: FiadoRecord[] = [
  {
    id: 'f-101',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 12.0,
    amountArs: 15600,
    itemsDescription: '1 Yerba Playadito 1kg + 2 Leches La Serenísima + 1 Pan lactal',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-24T14:30:00Z',
    dueDate: '2026-10-09T14:30:00Z',
    status: 'ACTIVE',
    txSignature: generateMockSolanaSignature()
  },
  {
    id: 'f-102',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 6.5,
    amountArs: 8450,
    itemsDescription: '300g Jamón cocido + 300g Queso Danbo + 6 Criollitos',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-26T18:15:00Z',
    dueDate: '2026-10-11T18:15:00Z',
    status: 'ACTIVE',
    txSignature: generateMockSolanaSignature()
  },
  {
    id: 'f-100',
    merchantId: 'merch-tito-01',
    merchantName: 'Almacén Don Tito',
    customerId: 'cust-matias-01',
    customerName: 'Matías González',
    amountUsdc: 15.0,
    amountArs: 19500,
    itemsDescription: 'Carne para asado + Carbón + Gaseosa',
    photoReceiptUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
    createdAt: '2026-09-10T12:00:00Z',
    dueDate: '2026-09-25T12:00:00Z',
    status: 'PAID',
    repaidAt: '2026-09-23T11:20:00Z',
    txSignature: generateMockSolanaSignature()
  }
];

const INITIAL_INSURANCE_POOL: InsurancePoolState = {
  totalBalanceUsdc: 12450.0,
  totalClaimsPaidUsdc: 1820.0,
  totalActivePolicies: 48,
  solanaVaultAddress: 'TefiVault1111111111111111111111111111111111'
};

const TefiContext = createContext<TefiContextType | undefined>(undefined);

export const TefiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('MERCHANT');
  const [customer, setCustomer] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem('tefi_customer');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER;
  });
  const [merchant, setMerchant] = useState<MerchantProfile>(() => {
    const saved = localStorage.getItem('tefi_merchant');
    return saved ? JSON.parse(saved) : INITIAL_MERCHANT;
  });
  const [fiados, setFiados] = useState<FiadoRecord[]>(() => {
    const saved = localStorage.getItem('tefi_fiados');
    return saved ? JSON.parse(saved) : INITIAL_FIADOS;
  });
  const [insurancePool, setInsurancePool] = useState<InsurancePoolState>(() => {
    const saved = localStorage.getItem('tefi_pool');
    return saved ? JSON.parse(saved) : INITIAL_INSURANCE_POOL;
  });

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

  // Recalcular Tier de Fidelidad
  function calculateTier(score: number): LoyaltyTier {
    if (score >= 85) return 'Diamante';
    if (score >= 70) return 'Oro';
    if (score >= 50) return 'Plata';
    return 'Bronce';
  }

  // 1. Crear nuevo Fiado
  const createFiado = (data: { amountArs: number; amountUsdc: number; itemsDescription: string; photoReceiptUrl: string }) => {
    // Validar límite de crédito del cliente
    const newTotalDebt = customer.currentDebt + data.amountUsdc;
    if (newTotalDebt > customer.maxCreditLimit) {
      return {
        success: false,
        error: `Límite superado. Disponible: ${(customer.maxCreditLimit - customer.currentDebt).toFixed(1)} USDC. Solicitado: ${data.amountUsdc.toFixed(1)} USDC.`
      };
    }

    const txSig = generateMockSolanaSignature();
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
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días
      status: 'ACTIVE',
      txSignature: txSig
    };

    setFiados(prev => [newFiado, ...prev]);

    // Actualizar deuda del cliente
    setCustomer(prev => ({
      ...prev,
      currentDebt: +(prev.currentDebt + data.amountUsdc).toFixed(2)
    }));

    // Actualizar volumen de ventas del comercio
    setMerchant(prev => ({
      ...prev,
      totalSalesUsdc: +(prev.totalSalesUsdc + data.amountUsdc).toFixed(2)
    }));

    return { success: true, fiado: newFiado };
  };

  // 2. Cliente paga su deuda (Repayment) -> Aumenta score, suma puntos y sube límite
  const repayFiado = (fiadoId: string) => {
    const target = fiados.find(f => f.id === fiadoId);
    if (!target || target.status !== 'ACTIVE') return { success: false };

    const txSig = generateMockSolanaSignature();

    setFiados(prev =>
      prev.map(f =>
        f.id === fiadoId
          ? { ...f, status: 'PAID', repaidAt: new Date().toISOString(), txSignature: txSig }
          : f
      )
    );

    setCustomer(prev => {
      const newDebt = Math.max(0, +(prev.currentDebt - target.amountUsdc).toFixed(2));
      const newScore = Math.min(100, prev.creditScore + 5);
      const pointsEarned = Math.round(target.amountUsdc * 25); // 25 puntos por USDC
      const newTier = calculateTier(newScore);
      // Cada pago puntual expande el límite de crédito en 5 USDC
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

    return { success: true, signature: txSig };
  };

  // 3. Comercio reclama seguro por incobrable -> El seguro del comercio AUMENTA y se penaliza al cliente
  const claimInsurance = (fiadoId: string) => {
    const target = fiados.find(f => f.id === fiadoId);
    if (!target || target.status !== 'ACTIVE') return { success: false };

    const txSig = generateMockSolanaSignature();

    // Marcar fiado como reclamado
    setFiados(prev =>
      prev.map(f =>
        f.id === fiadoId
          ? { ...f, status: 'INSURANCE_CLAIMED', txSignature: txSig }
          : f
      )
    );

    // Ajuste Actuarial: El comercio cobra la indemnización pero sube su prima de riesgo
    setMerchant(prev => {
      const newDefaulted = +(prev.totalDefaultedUsdc + target.amountUsdc).toFixed(2);
      const newDefaultRate = +((newDefaulted / (prev.totalSalesUsdc || 1)) * 100).toFixed(1);
      // Fórmula de prima dinámica: base 2.5% + (tasa de incobrabilidad * 0.45)
      const adjustedFee = Math.min(12.0, +(2.5 + newDefaultRate * 0.45).toFixed(1));

      return {
        ...prev,
        totalDefaultedUsdc: newDefaulted,
        defaultRate: newDefaultRate,
        currentInsuranceFee: adjustedFee,
        activeClaimsCount: prev.activeClaimsCount + 1
      };
    });

    // Pagar desde el pool
    setInsurancePool(prev => ({
      ...prev,
      totalBalanceUsdc: Math.max(0, +(prev.totalBalanceUsdc - target.amountUsdc).toFixed(2)),
      totalClaimsPaidUsdc: +(prev.totalClaimsPaidUsdc + target.amountUsdc).toFixed(2)
    }));

    // Penalizar severamente al deudor en su score e inhabilitar límite
    setCustomer(prev => {
      const penalScore = Math.max(10, prev.creditScore - 30);
      const slashedLimit = Math.max(5, Math.floor(prev.maxCreditLimit * 0.4));
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

  return (
    <TefiContext.Provider
      value={{
        role,
        setRole,
        customer,
        merchant,
        fiados,
        insurancePool,
        createFiado,
        repayFiado,
        claimInsurance,
        resetDemoData
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
