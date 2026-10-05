import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerProfile, MerchantProfile, FiadoRecord, InsurancePoolState, UserRole, LoyaltyTier, PaymentMethod, WebhookNotification, FiadoQrPayload } from '../types/tefi';
import {
  generateMockSolanaSignature,
  getOrCreateRoleKeypair,
  getDevnetBalance,
  requestDevnetAirdrop,
  broadcastSolanaFiadoEvent
} from '../solana/connection';
import { fetchLiveUsdcRate, ExchangeRateData } from '../services/oracle';
import { Language, translations } from '../i18n/translations';

interface TefiContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  a11yLargeText: boolean;
  toggleA11yLargeText: () => void;
  a11yHighContrast: boolean;
  toggleA11yHighContrast: () => void;
  t: (key: keyof typeof translations['es']) => string;
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
  acceptScannedFiado: (payload: FiadoQrPayload) => { success: boolean; error?: string; fiado?: FiadoRecord };
  pendingFiadoFromUrl: FiadoQrPayload | null;
  clearPendingFiadoFromUrl: () => void;
  repayFiado: (fiadoId: string, paymentMethod?: PaymentMethod) => { success: boolean; signature?: string };
  claimInsurance: (fiadoId: string) => { success: boolean; payoutAmount?: number; signature?: string };
  requestAirdrop: () => Promise<{ success: boolean; signature?: string; error?: string }>;
  refreshBalance: () => Promise<void>;
  resetDemoData: () => void;
  updateLinkedAccounts: (data: { cuentaDniAlias?: string; cuentaDniLinked?: boolean; mercadoPagoAlias?: string; mercadoPagoLinked?: boolean }) => void;
  depositToAbundanceFountain: (amountArs: number, paymentMethod: PaymentMethod) => { success: boolean; usdcAdded: number; solAdded: number };
  withdrawFromAbundanceFountain: (amountUsdc: number) => { success: boolean; error?: string };
  repayAllDebtWithAbundanceFountain: () => { success: boolean; error?: string };
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
  mercadoPagoLinked: true,
  abundanceSavingsSol: 0.145,
  abundanceSavingsUsdc: 22.50,
  abundanceYieldEarnedUsdc: 1.85
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
      if (parsed.abundanceSavingsUsdc === undefined) {
        parsed.abundanceSavingsSol = 0.145;
        parsed.abundanceSavingsUsdc = 22.50;
        parsed.abundanceYieldEarnedUsdc = 1.85;
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
  const [pendingFiadoFromUrl, setPendingFiadoFromUrl] = useState<FiadoQrPayload | null>(null);

  // Idioma (English / Spanish) - Comienza en inglés ('en') por defecto
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('tefi_language_v2');
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tefi_language_v2', lang);
    localStorage.setItem('tefi_language', lang);
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'es' ? 'en' : 'es');
  }, [language, setLanguage]);

  // Tema (Modo Oscuro / Modo Claro)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tefi_theme') as 'light' | 'dark') || 'light';
  });

  const updateStatusBarColor = useCallback((currentTheme: 'light' | 'dark') => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // En modo oscuro se mimetiza con el fondo oscuro (#0c0f17); en claro fondo blanco (#ffffff)
      metaThemeColor.setAttribute('content', currentTheme === 'dark' ? '#0c0f17' : '#ffffff');
    }
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('tefi_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateStatusBarColor(newTheme);
  }, [updateStatusBarColor]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // Sincronizar tema e idioma al montar la app
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateStatusBarColor(theme);
    document.documentElement.lang = language;
  }, [theme, language, updateStatusBarColor]);

  // Accesibilidad para personas con capacidades reducidas
  const [a11yLargeText, setA11yLargeText] = useState<boolean>(() => {
    return localStorage.getItem('tefi_a11y_large_text') === 'true';
  });

  const [a11yHighContrast, setA11yHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('tefi_a11y_high_contrast') === 'true';
  });

  const toggleA11yLargeText = useCallback(() => {
    setA11yLargeText(prev => {
      const next = !prev;
      localStorage.setItem('tefi_a11y_large_text', String(next));
      if (next) {
        document.documentElement.classList.add('a11y-large-text');
      } else {
        document.documentElement.classList.remove('a11y-large-text');
      }
      return next;
    });
  }, []);

  const toggleA11yHighContrast = useCallback(() => {
    setA11yHighContrast(prev => {
      const next = !prev;
      localStorage.setItem('tefi_a11y_high_contrast', String(next));
      if (next) {
        document.documentElement.classList.add('a11y-high-contrast');
      } else {
        document.documentElement.classList.remove('a11y-high-contrast');
      }
      return next;
    });
  }, []);

  // Inicializar clases globales de tema y accesibilidad en el DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (a11yLargeText) {
      document.documentElement.classList.add('a11y-large-text');
    }
    if (a11yHighContrast) {
      document.documentElement.classList.add('a11y-high-contrast');
    }
  }, [theme, a11yLargeText, a11yHighContrast]);

  // Helper de traducción instantánea
  const t = useCallback((key: keyof typeof translations['es']): string => {
    return translations[language][key] || translations['es'][key] || key;
  }, [language]);

  const dismissWebhookNotification = useCallback(() => {
    setWebhookNotification(null);
  }, []);

  const clearPendingFiadoFromUrl = useCallback(() => {
    setPendingFiadoFromUrl(null);
  }, []);

  // Detectar fiado compartido por URL / QR nativo al iniciar
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const fiadoParam = searchParams.get('fiado');
      const fId = searchParams.get('f');

      if (fiadoParam) {
        const decoded = JSON.parse(decodeURIComponent(fiadoParam));
        if (decoded) {
          const payload: FiadoQrPayload = decoded.protocol === 'tefi' ? decoded : {
            protocol: 'tefi',
            version: '1.0',
            action: 'FIADO_REQUEST',
            data: decoded.data || decoded
          };
          setRole('CUSTOMER');
          setPendingFiadoFromUrl(payload);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (fId) {
        const ars = parseFloat(searchParams.get('ars') || '15000');
        const usdc = parseFloat(searchParams.get('usdc') || (ars / 1615).toFixed(2));
        const payload: FiadoQrPayload = {
          protocol: 'tefi',
          version: '1.0',
          action: 'FIADO_REQUEST',
          data: {
            id: fId,
            merchantId: searchParams.get('m') || 'merch-tito-01',
            merchantName: decodeURIComponent(searchParams.get('n') || 'Almacén Don Tito'),
            customerId: 'cust-matias-01',
            customerName: 'Matías González',
            amountArs: ars,
            amountUsdc: usdc,
            itemsDescription: decodeURIComponent(searchParams.get('d') || 'Compra de almacén'),
            photoReceiptUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            nonce: 3
          }
        };
        setRole('CUSTOMER');
        setPendingFiadoFromUrl(payload);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Error al leer fiado desde URL:', e);
    }
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

  // 1b. Cliente acepta un Fiado escaneado via QR P2P (Lectura óptica directa entre celulares)
  const acceptScannedFiado = (payload: FiadoQrPayload) => {
    const data = payload.data;
    if (!data || !data.amountUsdc || data.amountUsdc <= 0) {
      return { success: false, error: 'Datos del fiado corruptos o incompletos.' };
    }

    const availableLimit = customer.maxCreditLimit - customer.currentDebt;
    if (data.amountUsdc > availableLimit) {
      return {
        success: false,
        error: `Supera tu límite disponible (${availableLimit.toFixed(1)} USDC). Solicitado: ${data.amountUsdc.toFixed(1)} USDC.`
      };
    }

    // Evitar duplicar si ya fue aceptado
    const alreadyExists = fiados.some(f => f.id === data.id && f.status === 'ACTIVE');
    if (alreadyExists) {
      return { success: false, error: 'Este fiado ya se encuentra registrado y activo en tu libreta.' };
    }

    const txSig = data.txSignature || generateMockSolanaSignature();

    const newFiado: FiadoRecord = {
      id: data.id,
      merchantId: data.merchantId || merchant.id,
      merchantName: data.merchantName || 'Almacén Don Tito',
      customerId: customer.id,
      customerName: customer.name,
      amountUsdc: data.amountUsdc,
      amountArs: data.amountArs,
      itemsDescription: data.itemsDescription || 'Compra de almacén',
      photoReceiptUrl: data.photoReceiptUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
      createdAt: data.createdAt || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      nonce: data.nonce ?? 0,
      txSignature: txSig
    };

    setFiados(prev => [newFiado, ...prev.filter(f => f.id !== newFiado.id)]);

    setCustomer(prev => ({
      ...prev,
      currentDebt: +(prev.currentDebt + newFiado.amountUsdc).toFixed(2)
    }));

    // Transmitir evento on-chain de confirmación de fiado en Solana Devnet con la wallet del cliente
    broadcastSolanaFiadoEvent(customerKeypair, {
      type: 'NEW_FIADO',
      fiadoId: newFiado.id,
      amountUsdc: newFiado.amountUsdc
    }).then(realSig => {
      if (realSig) {
        setFiados(curr =>
          curr.map(f => (f.id === newFiado.id ? { ...f, txSignature: realSig } : f))
        );
      }
    });

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

      let newSavingsUsdc = prev.abundanceSavingsUsdc || 0;
      let newSavingsSol = prev.abundanceSavingsSol || 0;

      if (paymentMethod === 'ABUNDANCE_FOUNTAIN') {
        newSavingsUsdc = Math.max(0, +(newSavingsUsdc - target.amountUsdc).toFixed(2));
        newSavingsSol = Math.max(0, +(newSavingsSol - (target.amountUsdc / 155)).toFixed(4));
      }

      return {
        ...prev,
        currentDebt: newDebt,
        abundanceSavingsUsdc: newSavingsUsdc,
        abundanceSavingsSol: newSavingsSol,
        creditScore: newScore,
        totalRepaid: +(prev.totalRepaid + target.amountUsdc).toFixed(2),
        loyaltyPoints: prev.loyaltyPoints + pointsEarned,
        tier: newTier,
        maxCreditLimit: newLimit
      };
    });

    // Disparar Notificación de Webhook Automático en tiempo real
    const methodLabels: Record<PaymentMethod, string> = language === 'en' ? {
      MERCADO_PAGO: 'Mercado Pago (Instant Transfer)',
      CUENTA_DNI: 'Cuenta DNI (State Bank)',
      CASH: 'Cash at Counter',
      SOLANA_USDC: 'Solana USDC (On-Chain)',
      ABUNDANCE_FOUNTAIN: 'Abundance Fountain (Collateral)'
    } : {
      MERCADO_PAGO: 'Mercado Pago (Transferencias 3.0)',
      CUENTA_DNI: 'Cuenta DNI (Banco Provincia)',
      CASH: 'Efectivo en Mostrador',
      SOLANA_USDC: 'Solana USDC (On-Chain)',
      ABUNDANCE_FOUNTAIN: 'Fuente de la Abundancia (Fondos Retenidos)'
    };

    const notifTitle = language === 'en'
      ? (paymentMethod === 'ABUNDANCE_FOUNTAIN'
        ? '💧 Credit Settled with Fountain'
        : (paymentMethod === 'CASH' ? 'In-Person Cash Payment Registered' : 'Banking Webhook Received 🔔'))
      : (paymentMethod === 'ABUNDANCE_FOUNTAIN'
        ? '💧 Fiado Saldado con la Fuente'
        : (paymentMethod === 'CASH' ? 'Pago Presencial Registrado' : 'Webhook Bancario Recibido 🔔'));

    const notifMessage = language === 'en'
      ? `Payment of $${target.amountArs.toLocaleString('en-US')} ARS (${target.amountUsdc} USDC) received from ${target.customerName} via ${methodLabels[paymentMethod]}! Automatic on-chain reconciliation.`
      : `¡Pago de $${target.amountArs.toLocaleString('es-AR')} ARS (${target.amountUsdc} USDC) recibido de ${target.customerName} vía ${methodLabels[paymentMethod]}! Conciliación automática on-chain.`;

    const notif: WebhookNotification = {
      id: `wh-${Date.now()}`,
      title: notifTitle,
      message: notifMessage,
      amountArs: target.amountArs,
      amountUsdc: target.amountUsdc,
      method: paymentMethod,
      customerName: target.customerName,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

  const depositToAbundanceFountain = (amountArs: number, paymentMethod: PaymentMethod) => {
    const rate = exchangeRate.rate || 1615;
    const usdcAdded = +(amountArs / rate).toFixed(2);
    const solAdded = +(usdcAdded / 155).toFixed(4);

    setCustomer(prev => {
      const currentUsdc = prev.abundanceSavingsUsdc || 0;
      const currentSol = prev.abundanceSavingsSol || 0;
      const newUsdc = +(currentUsdc + usdcAdded).toFixed(2);
      const newSol = +(currentSol + solAdded).toFixed(4);
      const newScore = Math.min(100, prev.creditScore + 2);
      const newLimit = +(prev.maxCreditLimit + Math.floor(usdcAdded * 0.3)).toFixed(0);

      const updated = {
        ...prev,
        abundanceSavingsUsdc: newUsdc,
        abundanceSavingsSol: newSol,
        creditScore: newScore,
        maxCreditLimit: newLimit,
        tier: calculateTier(newScore)
      };
      localStorage.setItem('tefi_customer', JSON.stringify(updated));
      return updated;
    });

    const methodLabels: Record<PaymentMethod, string> = language === 'en' ? {
      MERCADO_PAGO: 'Mercado Pago',
      CUENTA_DNI: 'Cuenta DNI',
      CASH: 'Cash',
      SOLANA_USDC: 'Solana USDC',
      ABUNDANCE_FOUNTAIN: 'Abundance Fountain'
    } : {
      MERCADO_PAGO: 'Mercado Pago',
      CUENTA_DNI: 'Cuenta DNI',
      CASH: 'Efectivo',
      SOLANA_USDC: 'Solana USDC',
      ABUNDANCE_FOUNTAIN: 'Fuente de la Abundancia'
    };

    const notif: WebhookNotification = {
      id: `fountain-${Date.now()}`,
      title: language === 'en' ? '💧 Deposit to Abundance Fountain' : '💧 Aporte a la Fuente de la Abundancia',
      message: language === 'en'
        ? `+$${amountArs.toLocaleString('en-US')} ARS (${usdcAdded} USDC ≈ ${solAdded} SOL) contributed via ${methodLabels[paymentMethod]}. +2 Credit Score pts & earning 7.4% APY on Solana.`
        : `+$${amountArs.toLocaleString('es-AR')} ARS (${usdcAdded} USDC ≈ ${solAdded} SOL) vertidos vía ${methodLabels[paymentMethod]}. +2 pts de Score y rindiendo 7.4% APY en Solana.`,
      amountArs,
      amountUsdc: usdcAdded,
      method: paymentMethod,
      customerName: customer.name,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setWebhookNotification(notif);
    setTimeout(() => {
      setWebhookNotification(prev => (prev?.id === notif.id ? null : prev));
    }, 7000);

    return { success: true, usdcAdded, solAdded };
  };

  const withdrawFromAbundanceFountain = (amountUsdc: number): { success: boolean; error?: string } => {
    const currentUsdc = customer.abundanceSavingsUsdc || 0;
    const currentDebt = customer.currentDebt || 0;

    if (amountUsdc <= 0) {
      return { success: false, error: 'Ingresá un monto válido mayor a 0.' };
    }

    if (amountUsdc > currentUsdc) {
      return { success: false, error: 'El monto solicitado supera tu saldo en la Fuente.' };
    }

    // Regla de Protección y Colateral: "No podés retirarlo si te deja el score más bajo que la deuda"
    const scoreDeduction = Math.min(15, Math.ceil(amountUsdc * 0.4));
    const potentialScore = Math.max(10, customer.creditScore - scoreDeduction);
    const limitDeduction = Math.floor(amountUsdc * 0.3);
    const potentialLimit = Math.max(5, customer.maxCreditLimit - limitDeduction);
    const remainingSavings = +(currentUsdc - amountUsdc).toFixed(2);

    if (currentDebt > 0) {
      // 1. Si el retiro deja el score por debajo de los consumos
      if (potentialScore < currentDebt) {
        return {
          success: false,
          error: `Retiro bloqueado: Tu score resultante (${potentialScore} pts) quedaría por debajo de tus consumos activos ($${currentDebt} USDC). Primero saldá tus fiados pendientes.`
        };
      }

      // 2. Si el retiro deja el límite de fiado por debajo de los consumos activos
      if (potentialLimit < currentDebt) {
        return {
          success: false,
          error: `Retiro bloqueado: Tu límite de fiado resultante ($${potentialLimit} USDC) quedaría por debajo de tus consumos activos ($${currentDebt} USDC).`
        };
      }

      // 3. Si el retiro consume el colateral necesario para respaldar los fiados
      if (remainingSavings < currentDebt) {
        const maxWithdrawable = Math.max(0, +(currentUsdc - currentDebt).toFixed(2));
        return {
          success: false,
          error: `Garantía retenida: Tenés consumos activos por $${currentDebt} USDC. Solo podés retirar hasta $${maxWithdrawable} USDC para no comprometer tu garantía de solvencia.`
        };
      }
    }

    setCustomer(prev => {
      const currentUsdcVal = prev.abundanceSavingsUsdc || 0;
      const currentSol = prev.abundanceSavingsSol || 0;
      const solToDeduct = +(amountUsdc / 155).toFixed(4);

      const newUsdc = Math.max(0, +(currentUsdcVal - amountUsdc).toFixed(2));
      const newSol = Math.max(0, +(currentSol - solToDeduct).toFixed(4));
      const newScore = Math.max(10, prev.creditScore - scoreDeduction);
      const newLimit = Math.max(5, prev.maxCreditLimit - limitDeduction);

      const updated = {
        ...prev,
        abundanceSavingsUsdc: newUsdc,
        abundanceSavingsSol: newSol,
        creditScore: newScore,
        maxCreditLimit: newLimit,
        tier: calculateTier(newScore)
      };
      localStorage.setItem('tefi_customer', JSON.stringify(updated));
      return updated;
    });

    const notif: WebhookNotification = {
      id: `fountain-w-${Date.now()}`,
      title: language === 'en' ? '🪙 Withdrawal from Abundance Fountain' : '🪙 Retiro de la Fuente de la Abundancia',
      message: language === 'en'
        ? `You have withdrawn $${amountUsdc.toFixed(2)} USDC to your linked account. Your solvency collateral and credits remain protected.`
        : `Has retirado $${amountUsdc.toFixed(2)} USDC a tu cuenta vinculada. Tu garantía de solvencia y fiados se mantienen protegidos.`,
      amountArs: Math.round(amountUsdc * (exchangeRate.rate || 1615)),
      amountUsdc,
      method: 'CUENTA_DNI',
      customerName: customer.name,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setWebhookNotification(notif);
    setTimeout(() => {
      setWebhookNotification(prev => (prev?.id === notif.id ? null : prev));
    }, 7000);

    return { success: true };
  };

  const repayAllDebtWithAbundanceFountain = (): { success: boolean; error?: string } => {
    const totalDebt = customer.currentDebt || 0;
    const currentSavings = customer.abundanceSavingsUsdc || 0;

    if (totalDebt <= 0) {
      return { success: false, error: language === 'en' ? 'No pending credits in your passbook.' : 'No tenés consumos pendientes en tu libreta.' };
    }

    if (currentSavings < totalDebt) {
      return {
        success: false,
        error: language === 'en'
          ? `Insufficient savings in the Fountain ($${currentSavings.toFixed(2)} USDC) to settle total credits ($${totalDebt.toFixed(2)} USDC).`
          : `Saldo insuficiente en la Fuente ($${currentSavings.toFixed(2)} USDC) para saldar el total de consumos ($${totalDebt.toFixed(2)} USDC).`
      };
    }

    const txSig = generateMockSolanaSignature();

    // Marcar todos los fiados activos como pagados
    setFiados(prev =>
      prev.map(f =>
        f.status === 'ACTIVE'
          ? {
              ...f,
              status: 'PAID',
              repaidAt: new Date().toISOString(),
              txSignature: txSig,
              paymentMethod: 'ABUNDANCE_FOUNTAIN'
            }
          : f
      )
    );

    // Transmitir a Solana
    broadcastSolanaFiadoEvent(customerKeypair, {
      type: 'REPAY',
      fiadoId: 'ALL_ACTIVE_SETTLED',
      amountUsdc: totalDebt
    });

    setCustomer(prev => {
      const newSavingsUsdc = Math.max(0, +(prev.abundanceSavingsUsdc! - totalDebt).toFixed(2));
      const newSavingsSol = Math.max(0, +(prev.abundanceSavingsSol! - (totalDebt / 155)).toFixed(4));
      const newScore = Math.min(100, prev.creditScore + 8); // Boost significativo por liquidar consumos
      const newLimit = +(prev.maxCreditLimit + 10).toFixed(0);

      const updated = {
        ...prev,
        currentDebt: 0,
        abundanceSavingsUsdc: newSavingsUsdc,
        abundanceSavingsSol: newSavingsSol,
        creditScore: newScore,
        maxCreditLimit: newLimit,
        tier: calculateTier(newScore),
        totalRepaid: +(prev.totalRepaid + totalDebt).toFixed(2),
        loyaltyPoints: prev.loyaltyPoints + Math.round(totalDebt * 25)
      };
      localStorage.setItem('tefi_customer', JSON.stringify(updated));
      return updated;
    });

    const notif: WebhookNotification = {
      id: `wh-settle-${Date.now()}`,
      title: language === 'en' ? '⚡ Credits Settled with Abundance Fountain' : '⚡ Fiados Liquidados con la Fuente de la Abundancia',
      message: language === 'en'
        ? `Active credits of $${totalDebt.toFixed(2)} USDC settled using your collateral funds! Your debts are 100% paid, +8 pts to your Score, and remaining $${Math.max(0, +(currentSavings - totalDebt).toFixed(2))} USDC are free to withdraw.`
        : `¡Consumos activos de $${totalDebt.toFixed(2)} USDC saldados usando tus fondos en garantía! Tus fiados están 100% pagados, +8 pts a tu Score y tus $${Math.max(0, +(currentSavings - totalDebt).toFixed(2))} USDC restantes quedan libres para retirar.`,
      amountArs: Math.round(totalDebt * (exchangeRate.rate || 1615)),
      amountUsdc: totalDebt,
      method: 'ABUNDANCE_FOUNTAIN',
      customerName: customer.name,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setWebhookNotification(notif);
    setTimeout(() => {
      setWebhookNotification(prev => (prev?.id === notif.id ? null : prev));
    }, 7000);

    return { success: true };
  };

  return (
    <TefiContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        a11yLargeText,
        toggleA11yLargeText,
        a11yHighContrast,
        toggleA11yHighContrast,
        t,
        customer,
        setCustomer,
        merchant,
        fiados,
        insurancePool,
        exchangeRate,
        solanaBalance,
        isAirdropLoading,
        createFiado,
        acceptScannedFiado,
        pendingFiadoFromUrl,
        clearPendingFiadoFromUrl,
        repayFiado,
        claimInsurance,
        requestAirdrop: handleAirdrop,
        refreshBalance,
        resetDemoData,
        updateLinkedAccounts,
        depositToAbundanceFountain,
        withdrawFromAbundanceFountain,
        repayAllDebtWithAbundanceFountain,
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
