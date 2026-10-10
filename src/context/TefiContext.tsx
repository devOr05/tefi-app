import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { CustomerProfile, MerchantProfile, FiadoRecord, UserRole, LoyaltyTier, AppNotification, NeighborContact, PendingCosign } from '../types/tefi';
import {
  AirdropFailure,
  DeviceRole,
  forgetRoleKeypair,
  getDevnetBalance,
  getOrCreateRoleKeypair,
  hasRoleKeypair,
  requestDevnetAirdrop,
  storeRoleKeypair,
  sweepDevnetSol
} from '../solana/connection';
import {
  buildIssueFiadoRequest,
  buildRepayFiadoRequest,
  classifyChainError,
  ensureMerchantInitialized,
  fetchOnChainCustomerProfile,
  fetchOnChainFiado,
  fetchOnChainFiados,
  fetchOnChainMerchantProfile,
  findLandedSignature,
  submitCosignedTransaction
} from '../solana/anchorClient';
import {
  CosignError,
  ReceiptTicket,
  assertTicketMatches,
  completeCosign,
  computeReceiptHash,
  encodeCosignUrl,
  encodeNeighborUrl,
  inspectCosignTransaction,
  parseCosignUrl,
  parseNeighborUrl,
  sha256Hex
} from '../solana/cosign';
import {
  BASE_CREDIT_LIMIT_USDC,
  BASE_CREDIT_SCORE,
  MICRO_USDC,
  OnChainCustomerProfile,
  OnChainFiado,
  OnChainMerchantProfile
} from '../solana/program';
import { reconcileCustomerWithFiados } from '../services/financialLedger';
import { FiadoLocalDetail, FiadoLocalDetails, buildLibreta } from '../services/libreta';
import { fetchLiveUsdcRate, ExchangeRateData, ExchangeRateQuote, FALLBACK_RATE } from '../services/oracle';
import { Language, translations } from '../i18n/translations';

// Pedido de co-firma tal como lo ve el vecino después de escanear el QR del almacén
export interface IncomingCosign {
  kind: 'issue' | 'repay';
  tx: Transaction;
  signature: string;
  storeName: string;
  storeAddress: string;
  fiadoAddress: string;
  amountUsdc: number;
  amountArs: number;
  itemsDescription: string;
  dueDate: string;
  includesProfileSetup: boolean;
}

type ActionResult<T = {}> = ({ success: true } & T) | { success: false; error: string };

interface TefiContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  chooseDeviceRole: (role: UserRole) => void;
  needsRoleChoice: boolean;
  isSingleDeviceDemo: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  a11yLargeText: boolean;
  toggleA11yLargeText: () => void;
  a11yHighContrast: boolean;
  toggleA11yHighContrast: () => void;
  t: (key: keyof typeof translations['es']) => string;
  tr: (en: string, es: string) => string;
  customer: CustomerProfile;
  merchant: MerchantProfile;
  fiados: FiadoRecord[];
  isSyncing: boolean;
  syncFailed: boolean;
  hasSynced: boolean;
  syncFromChain: () => Promise<void>;
  exchangeRate: ExchangeRateData;
  solanaBalance: number;
  isAirdropLoading: boolean;
  requestAirdrop: () => Promise<{ success: boolean; signature?: string; error?: string }>;
  resetDevice: () => Promise<void>;
  notification: AppNotification | null;
  dismissNotification: () => void;

  // Teléfono del almacén
  neighbors: NeighborContact[];
  addNeighbor: (scannedText: string, name?: string) => ActionResult<{ neighbor: NeighborContact }>;
  fetchNeighborProfile: (address: string) => Promise<OnChainCustomerProfile | null>;
  createFiadoRequest: (data: { neighbor: NeighborContact; amountArs: number; amountUsdc: number; itemsDescription: string; photoReceiptUrl: string }) => Promise<ActionResult<{ request: PendingCosign }>>;
  createRepayRequest: (fiado: FiadoRecord) => Promise<ActionResult<{ request: PendingCosign }>>;
  refreshCosignRequest: (request: PendingCosign) => Promise<ActionResult<{ request: PendingCosign }>>;
  checkCosignRequest: (request: PendingCosign) => Promise<{ state: 'pending' } | { state: 'confirmed'; signature: string } | { state: 'failed'; error: string }>;
  handOffCosignToNeighbor: (url: string) => void;

  // Teléfono del vecino
  neighborIdUrl: string;
  pendingCosignUrl: string | null;
  clearPendingCosignUrl: () => void;
  openCosign: (scannedText: string) => Promise<ActionResult<{ incoming: IncomingCosign }>>;
  approveCosign: (incoming: IncomingCosign) => Promise<ActionResult<{ signature: string }>>;
}

const DEFAULT_STORE_NAME = 'Almacén Don Tito';
const DEFAULT_STORE_CATEGORY = 'Almacén de Barrio';
const DEFAULT_NEIGHBOR_NAME = 'Matías González';
const FIADO_TERM_DAYS = 15;
// El blockhash de Solana vence en ~1 minuto: el QR se regenera antes para que el vecino tenga tiempo de firmar
const COSIGN_QR_TTL_MS = 40_000;
const CHAIN_SYNC_INTERVAL_MS = 20_000;
// Un pedido que el vecino no firmó en este tiempo se da por abandonado (el QR ya venció hace rato)
const ABANDONED_REQUEST_MS = 10 * 60 * 1000;

const STORAGE = {
  role: 'tefi_role',
  neighbors: 'tefi_neighbors_v2',
  details: 'tefi_fiado_details_v2',
  snapshot: (address: string) => `tefi_chain_snapshot_${address}`
};
// Datos de versiones anteriores (fiados semilla y perfiles simulados) que ya no se usan
const LEGACY_STORAGE_KEYS = ['tefi_customer', 'tefi_merchant', 'tefi_fiados', 'tefi_pool'];

interface ChainSnapshot {
  owner: string;
  merchantProfile: OnChainMerchantProfile | null;
  customerProfile: OnChainCustomerProfile | null;
  fiados: OnChainFiado[];
}

const PROGRAM_ERRORS_EN: Record<number, string> = {
  6000: 'The amount exceeds the available credit limit.',
  6001: 'The fiado amount must be greater than zero.',
  6002: 'The due date must be in the future.',
  6003: 'The receipt hash is longer than allowed.',
  6004: 'The text is longer than allowed.',
  6005: 'This fiado is no longer active.',
  6006: 'The mandatory 30-day grace period has not expired yet.',
  6007: 'The signing store is not the one that issued this fiado.',
  6008: 'The receipt must be a SHA-256 hash, not readable text.'
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch (e) {
    console.warn(`Error al cargar ${key} de localStorage:`, e);
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`No se pudo guardar ${key} en localStorage:`, e);
    return false;
  }
}

function emptySnapshot(owner: string): ChainSnapshot {
  return { owner, merchantProfile: null, customerProfile: null, fiados: [] };
}

function calculateTier(score: number): LoyaltyTier {
  if (score >= 85) return 'Diamante';
  if (score >= 70) return 'Oro';
  if (score >= 50) return 'Plata';
  return 'Bronce';
}

const deviceRoleOf = (role: UserRole): DeviceRole => (role === 'MERCHANT' ? 'merchant' : 'customer');

// Un link de co-firma solo tiene sentido para un vecino. Un teléfono sin rol elegido (nuevo, o que viene
// de una versión anterior que guardaba las dos claves) tiene que elegirlo.
function detectInitialRole(): UserRole | null {
  try {
    if (new URLSearchParams(window.location.search).has('cosign')) return 'CUSTOMER';
    const stored = localStorage.getItem(STORAGE.role);
    if (stored === 'MERCHANT' || stored === 'CUSTOMER') return stored;
  } catch (e) {
    console.warn('No se pudo determinar el rol del dispositivo:', e);
  }
  return null;
}

const TefiContext = createContext<TefiContextType | undefined>(undefined);

export const TefiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Idioma (English / Español) - Comienza en inglés ('en') por defecto
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

  const tr = useCallback((en: string, es: string) => (language === 'en' ? en : es), [language]);

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
    document.title =
      language === 'en'
        ? 'Tefi.app - The corner store credit notebook, co-signed on Solana'
        : 'Tefi.app - La libreta del fiado del almacén, co-firmada en Solana';
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

  // Inicializar clases globales de accesibilidad en el DOM
  useEffect(() => {
    if (a11yLargeText) {
      document.documentElement.classList.add('a11y-large-text');
    }
    if (a11yHighContrast) {
      document.documentElement.classList.add('a11y-high-contrast');
    }
  }, [a11yLargeText, a11yHighContrast]);

  // Helper de traducción instantánea
  const t = useCallback((key: keyof typeof translations['es']): string => {
    return translations[language][key] || translations['es'][key] || key;
  }, [language]);

  // -------------------------------------------------------------
  // ROL Y CLAVE DE ESTE DISPOSITIVO
  // -------------------------------------------------------------

  const [chosenRole, setChosenRole] = useState<UserRole | null>(detectInitialRole);
  const [identityEpoch, setIdentityEpoch] = useState(0);
  const role: UserRole = chosenRole ?? 'MERCHANT';

  // Cambiar de rol en el mismo dispositivo (demo en un solo dispositivo): conserva las claves que ya tenga
  const setRole = useCallback((next: UserRole) => {
    localStorage.setItem(STORAGE.role, next);
    setChosenRole(next);
  }, []);

  // Dedicar el dispositivo a un solo rol: queda únicamente la clave de ese rol
  const chooseDeviceRole = useCallback((next: UserRole) => {
    const other = deviceRoleOf(next === 'MERCHANT' ? 'CUSTOMER' : 'MERCHANT');
    if (hasRoleKeypair(other)) {
      const otherKeypair = getOrCreateRoleKeypair(other);
      forgetRoleKeypair(other);
      // Si el dispositivo queda como almacén, el SOL de devnet de la clave que se va sirve para las comisiones
      if (next === 'MERCHANT') sweepDevnetSol(otherKeypair, getOrCreateRoleKeypair('merchant').publicKey);
    }
    localStorage.setItem(STORAGE.role, next);
    setChosenRole(next);
    setIdentityEpoch(epoch => epoch + 1);
  }, []);

  // La clave de un rol se crea recién cuando ese rol se usa en este dispositivo
  const activeKeypair: Keypair | null = useMemo(
    () => (chosenRole ? getOrCreateRoleKeypair(deviceRoleOf(chosenRole)) : null),
    [chosenRole, identityEpoch]
  );
  const activeAddress = activeKeypair ? activeKeypair.publicKey.toBase58() : '';

  const deviceKeys = useMemo(
    () => ({
      merchant: hasRoleKeypair('merchant') ? getOrCreateRoleKeypair('merchant') : null,
      customer: hasRoleKeypair('customer') ? getOrCreateRoleKeypair('customer') : null
    }),
    [activeKeypair]
  );
  // Con las dos claves en el mismo navegador la co-firma sigue siendo real on-chain, pero sale de un solo dispositivo
  const isSingleDeviceDemo = !!deviceKeys.merchant && !!deviceKeys.customer;

  useEffect(() => {
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    if (chosenRole && !localStorage.getItem(STORAGE.role)) localStorage.setItem(STORAGE.role, chosenRole);
  }, []);

  // -------------------------------------------------------------
  // ESTADO LEÍDO DE LA CADENA + DETALLE LOCAL DE CADA FIADO
  // -------------------------------------------------------------

  const [snapshot, setSnapshot] = useState<ChainSnapshot>(() => emptySnapshot(''));
  const [details, setDetails] = useState<FiadoLocalDetails>(() => readJson<FiadoLocalDetails>(STORAGE.details, {}));
  const [neighbors, setNeighbors] = useState<NeighborContact[]>(() => readJson<NeighborContact[]>(STORAGE.neighbors, []));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [solanaBalance, setSolanaBalance] = useState<number>(0);
  const [isAirdropLoading, setIsAirdropLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [pendingCosignUrl, setPendingCosignUrl] = useState<string | null>(null);

  // null mientras se consulta la cotización por primera vez
  const [rateQuote, setRateQuote] = useState<ExchangeRateQuote | null>(null);
  const exchangeRate: ExchangeRateData = useMemo(
    () =>
      rateQuote
        ? {
            ...rateQuote,
            source: rateQuote.isLive
              ? tr('dolarapi.com (crypto dollar)', 'dolarapi.com (dólar cripto)')
              : tr('Offline reference rate', 'Tasa de referencia sin conexión')
          }
        : { rate: FALLBACK_RATE, source: tr('Loading rate...', 'Cargando cotización...'), lastUpdated: '', isLive: false },
    [rateQuote, tr]
  );

  const activeAddressRef = useRef(activeAddress);
  activeAddressRef.current = activeAddress;

  const notify = useCallback((title: string, message: string) => {
    const notif: AppNotification = {
      id: `n-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setNotification(notif);
    setTimeout(() => setNotification(prev => (prev?.id === notif.id ? null : prev)), 7000);
  }, [language]);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const clearPendingCosignUrl = useCallback(() => {
    setPendingCosignUrl(null);
  }, []);

  const saveDetail = useCallback((fiadoAddress: string, detail: FiadoLocalDetail) => {
    setDetails(prev => {
      const next = { ...prev, [fiadoAddress]: { ...prev[fiadoAddress], ...detail } };
      if (!writeJson(STORAGE.details, next)) {
        // Sin espacio en el teléfono: se conserva el texto de cada fiado y se sueltan las fotos
        const withoutPhotos = Object.fromEntries(
          Object.entries(next).map(([address, d]) => [address, { ...d, photoReceiptUrl: '' }])
        );
        writeJson(STORAGE.details, withoutPhotos);
      }
      return next;
    });
  }, []);

  // El almacén guarda el detalle al mostrar el QR. Si el vecino firmó, el fiado ya está on-chain y el
  // detalle queda; si el pedido se abandonó, el detalle (con su foto) se descarta.
  const settlePendingDetails = useCallback((onChainAddresses: Set<string>) => {
    setDetails(prev => {
      const next = { ...prev };
      let changed = false;
      for (const [address, detail] of Object.entries(prev)) {
        if (detail.pendingSince === undefined) continue;
        if (onChainAddresses.has(address)) {
          next[address] = { ...detail, pendingSince: undefined };
          changed = true;
        } else if (Date.now() - detail.pendingSince > ABANDONED_REQUEST_MS) {
          delete next[address];
          changed = true;
        }
      }
      if (!changed) return prev;
      writeJson(STORAGE.details, next);
      return next;
    });
  }, []);

  const syncFromChain = useCallback(async () => {
    if (!activeKeypair || !chosenRole) return;
    const owner = activeKeypair.publicKey;
    const ownerAddress = owner.toBase58();
    setIsSyncing(true);
    try {
      const [merchantProfile, customerProfile, onChainFiados, balance] = await Promise.all([
        chosenRole === 'MERCHANT' ? fetchOnChainMerchantProfile(owner) : null,
        chosenRole === 'CUSTOMER' ? fetchOnChainCustomerProfile(owner) : null,
        fetchOnChainFiados(chosenRole === 'MERCHANT' ? { merchant: owner } : { customer: owner }),
        getDevnetBalance(owner)
      ]);
      // El rol o la identidad cambiaron mientras se consultaba: se descarta la respuesta
      if (activeAddressRef.current !== ownerAddress) return;

      const next: ChainSnapshot = { owner: ownerAddress, merchantProfile, customerProfile, fiados: onChainFiados };
      setSnapshot(next);
      writeJson(STORAGE.snapshot(ownerAddress), next);
      if (chosenRole === 'MERCHANT') settlePendingDetails(new Set(onChainFiados.map(f => f.address)));
      setSolanaBalance(balance);
      setSyncFailed(false);
      setHasSynced(true);
    } catch (e) {
      console.warn('No se pudo sincronizar con Solana Devnet:', e);
      if (activeAddressRef.current === ownerAddress) setSyncFailed(true);
    } finally {
      setIsSyncing(false);
    }
  }, [activeKeypair, chosenRole, settlePendingDetails]);

  // Al cambiar de rol o de identidad: mostrar la última copia local y volver a leer la cadena
  useEffect(() => {
    if (!activeAddress) return;
    setSnapshot(readJson<ChainSnapshot>(STORAGE.snapshot(activeAddress), emptySnapshot(activeAddress)));
    setSolanaBalance(0);
    setHasSynced(false);
    syncFromChain();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') syncFromChain();
    }, CHAIN_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeAddress, syncFromChain]);

  // Consultar la cotización al abrir y una vez por minuto
  useEffect(() => {
    fetchLiveUsdcRate().then(setRateQuote);
    const interval = setInterval(() => {
      fetchLiveUsdcRate().then(setRateQuote);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addNeighborContact = useCallback((address: string, name: string): NeighborContact => {
    const contact: NeighborContact = { address, name, addedAt: new Date().toISOString() };
    setNeighbors(prev => {
      const existing = prev.find(n => n.address === address);
      // Si ya estaba agendado solo se actualiza el nombre cuando llega uno nuevo
      const next = existing
        ? prev.map(n => (n.address === address && name ? { ...n, name } : n))
        : [contact, ...prev];
      writeJson(STORAGE.neighbors, next);
      return next;
    });
    return contact;
  }, []);

  // Demo en un solo dispositivo: el vecino de este mismo navegador queda agendado en el almacén
  useEffect(() => {
    if (deviceKeys.merchant && deviceKeys.customer) {
      addNeighborContact(deviceKeys.customer.publicKey.toBase58(), DEFAULT_NEIGHBOR_NAME);
    }
  }, [deviceKeys, addNeighborContact]);

  // Links abiertos con la cámara del teléfono: pedido de co-firma (vecino) o QR de un vecino (almacén)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('cosign')) {
        setPendingCosignUrl(window.location.href);
      } else if (params.has('neighbor') && chosenRole === 'MERCHANT') {
        const identity = parseNeighborUrl(window.location.href);
        if (identity) addNeighborContact(identity.address, identity.name);
      }
      if (params.has('cosign') || params.has('neighbor')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Error al leer el link de Tefi:', e);
    }
  }, []);

  const contactNames = useMemo(
    () => Object.fromEntries(neighbors.filter(n => n.name).map(n => [n.address, n.name])),
    [neighbors]
  );

  const fiados: FiadoRecord[] = useMemo(
    () =>
      buildLibreta({
        onChain: snapshot.owner === activeAddress ? snapshot.fiados : [],
        details,
        viewer: deviceRoleOf(role),
        ownName: role === 'MERCHANT' ? DEFAULT_STORE_NAME : DEFAULT_NEIGHBOR_NAME,
        contactNames,
        arsPerUsdc: exchangeRate.rate || 1615
      }),
    [snapshot, activeAddress, details, role, contactNames, exchangeRate.rate]
  );

  // Perfil del vecino de este dispositivo: score, límite y repagos salen de su CustomerProfile PDA
  const customer: CustomerProfile = useMemo(() => {
    const profile = role === 'CUSTOMER' && snapshot.owner === activeAddress ? snapshot.customerProfile : null;
    const creditScore = profile?.creditScore ?? BASE_CREDIT_SCORE;
    const base: CustomerProfile = {
      id: deviceKeys.customer?.publicKey.toBase58() ?? '',
      name: DEFAULT_NEIGHBOR_NAME,
      walletAddress: deviceKeys.customer?.publicKey.toBase58() ?? '',
      hasOnChainProfile: !!profile,
      creditScore,
      maxCreditLimit: profile?.creditLimitUsdc ?? BASE_CREDIT_LIMIT_USDC,
      currentDebt: profile?.activeDebtUsdc ?? 0,
      totalRepaid: profile?.totalRepaidUsdc ?? 0,
      loyaltyPoints: profile?.loyaltyPoints ?? 0,
      tier: calculateTier(creditScore)
    };
    // Regla canónica: la deuda mostrada es siempre la suma de los fiados activos de la libreta
    return role === 'CUSTOMER' ? reconcileCustomerWithFiados(base, fiados).reconciledCustomer : base;
  }, [role, snapshot, activeAddress, deviceKeys, fiados]);

  const merchant: MerchantProfile = useMemo(() => {
    const profile = role === 'MERCHANT' && snapshot.owner === activeAddress ? snapshot.merchantProfile : null;
    return {
      id: deviceKeys.merchant?.publicKey.toBase58() ?? '',
      name: DEFAULT_STORE_NAME,
      category: DEFAULT_STORE_CATEGORY,
      walletAddress: deviceKeys.merchant?.publicKey.toBase58() ?? '',
      hasOnChainProfile: !!profile,
      totalSalesUsdc: profile?.totalSalesUsdc ?? 0
    };
  }, [role, snapshot, activeAddress, deviceKeys]);

  // Solicitar 1 SOL de airdrop en Devnet (lo necesita solo el almacén, que paga comisiones y rent)
  const handleAirdrop = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!activeKeypair) return { success: false, error: tr('Choose a role first.', 'Elegí un rol primero.') };
    setIsAirdropLoading(true);
    try {
      const res = await requestDevnetAirdrop(activeKeypair.publicKey);
      if (res.success) {
        setSolanaBalance(await getDevnetBalance(activeKeypair.publicKey));
        return { success: true, signature: res.signature };
      }
      const reasons: Record<AirdropFailure, string> = {
        RATE_LIMITED: tr(
          'The public devnet faucet reached its limit. Use faucet.solana.com with the store address.',
          'El faucet público de devnet alcanzó su límite. Usá faucet.solana.com con la dirección del almacén.'
        ),
        TIMEOUT: tr('Solana Devnet took too long to respond. Try again in a moment.', 'Solana Devnet tardó en responder. Reintentá en unos momentos.'),
        UNAVAILABLE: tr('The devnet faucet is temporarily unavailable.', 'El faucet de devnet no está disponible temporalmente.')
      };
      return { success: false, error: reasons[res.error ?? 'UNAVAILABLE'] };
    } finally {
      setIsAirdropLoading(false);
    }
  };

  const chainErrorText = useCallback((err: unknown): string => {
    if (err instanceof CosignError) {
      switch (err.code) {
        case 'NOT_FOR_THIS_NEIGHBOR':
          return tr('This QR was issued for a different neighbor.', 'Este QR fue emitido para otro vecino.');
        case 'TICKET_MISMATCH':
          return tr('The receipt in this QR does not match what the store signed. Do not sign it.', 'El ticket de este QR no coincide con lo que firmó el almacén. No lo firmes.');
        case 'MISSING_STORE_SIGNATURE':
        case 'INVALID_STORE_SIGNATURE':
          return tr('This QR is not signed by the store.', 'Este QR no está firmado por el almacén.');
        case 'MALFORMED':
          return tr('The QR could not be read. Ask the store to show it again.', 'No se pudo leer el QR. Pedile al almacén que lo muestre de nuevo.');
        default:
          return tr('This QR is not a valid Tefi fiado or repayment.', 'Este QR no es un fiado ni un repago válido de Tefi.');
      }
    }

    const { code, detail, programCode } = classifyChainError(err);
    switch (code) {
      case 'EXPIRED':
        return tr('The QR expired. Scan the new one on the store screen.', 'El QR venció. Escaneá el nuevo que muestra el almacén.');
      case 'STALE':
        return tr('This request is out of date. Ask the store for a new QR.', 'Este pedido quedó desactualizado. Pedile al almacén un QR nuevo.');
      case 'INSUFFICIENT_SOL':
        return tr('The store wallet needs devnet SOL to pay the fee. Tap "+1 SOL" in store mode.', 'La billetera del almacén necesita SOL de devnet para pagar la comisión. Tocá "+1 SOL" en modo almacén.');
      case 'NETWORK':
        return tr('Solana Devnet did not respond. Try again in a moment.', 'Solana Devnet no respondió. Reintentá en un momento.');
      case 'PROGRAM':
        // Los mensajes del programa están en español; en inglés se traduce por código de error
        return language === 'en' && programCode !== undefined ? PROGRAM_ERRORS_EN[programCode] ?? detail : detail;
      case 'REJECTED':
        return tr('The Tefi program rejected the transaction. Nothing was recorded.', 'El programa de Tefi rechazó la transacción. No se asentó nada.');
      default:
        // Error técnico sin clasificar: se muestra el detalle que devolvió la red, precedido de una explicación
        return `${tr('Solana Devnet returned an error', 'Solana Devnet devolvió un error')}${detail ? `: ${detail}` : '.'}`;
    }
  }, [tr, language]);

  // -------------------------------------------------------------
  // TELÉFONO DEL ALMACÉN
  // -------------------------------------------------------------

  const addNeighbor = (scannedText: string, name?: string): ActionResult<{ neighbor: NeighborContact }> => {
    const identity = parseNeighborUrl(scannedText);
    if (!identity) {
      return { success: false, error: tr('That is not a Tefi neighbor QR or a Solana address.', 'Eso no es el QR de un vecino Tefi ni una dirección de Solana.') };
    }
    if (identity.address === deviceKeys.merchant?.publicKey.toBase58()) {
      return { success: false, error: tr('That is the store wallet, not a neighbor.', 'Esa es la billetera del almacén, no la de un vecino.') };
    }
    const fallbackName = tr('Neighbor', 'Vecino');
    return { success: true, neighbor: addNeighborContact(identity.address, name?.trim() || identity.name || fallbackName) };
  };

  // El almacén lee el perfil del vecino directo de su PDA, igual que lo haría cualquier prestamista
  const fetchNeighborProfile = useCallback(async (address: string): Promise<OnChainCustomerProfile | null> => {
    return fetchOnChainCustomerProfile(new PublicKey(address));
  }, []);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Arma (o rearma con un blockhash nuevo) el pedido que el almacén muestra en el QR
  const assembleCosign = async (
    draft: Omit<PendingCosign, 'url' | 'attempts' | 'expiresAt' | 'includesProfileSetup'>,
    previousAttempts: PendingCosign['attempts']
  ): Promise<PendingCosign> => {
    const merchantKeypair = deviceKeys.merchant!;
    const customerKey = new PublicKey(draft.neighbor.address);

    let built;
    let ticket: ReceiptTicket | undefined;
    if (draft.kind === 'issue') {
      ticket = { amountArs: draft.amountArs, items: draft.itemsDescription, photoSha256: draft.photoSha256 };
      built = await buildIssueFiadoRequest({
        merchant: merchantKeypair,
        customer: customerKey,
        amountMicroUsdc: BigInt(Math.round(draft.amountUsdc * MICRO_USDC)),
        dueTimestamp: Math.floor(new Date(draft.dueDate).getTime() / 1000),
        receiptHash: draft.receiptHash
      });
    } else {
      built = await buildRepayFiadoRequest({ merchant: merchantKeypair, customer: customerKey, nonce: draft.nonce });
    }

    const fiadoAddress = built.fiadoRecord.toBase58();
    if (draft.kind === 'issue') {
      // El detalle se guarda en este teléfono antes de la firma del vecino; on-chain solo va el hash
      saveDetail(fiadoAddress, {
        amountArs: draft.amountArs,
        itemsDescription: draft.itemsDescription,
        photoReceiptUrl: draft.photoReceiptUrl,
        counterpartyName: draft.neighbor.name,
        pendingSince: Date.now()
      });
    }

    return {
      ...draft,
      nonce: built.nonce,
      url: encodeCosignUrl(baseUrl, { tx: built.tx, storeName: DEFAULT_STORE_NAME, ticket }),
      attempts: [...previousAttempts, { signature: built.signature, fiadoAddress }],
      expiresAt: Date.now() + COSIGN_QR_TTL_MS,
      includesProfileSetup: built.includesProfileSetup
    };
  };

  // 1. Nuevo fiado: el almacén firma su parte y genera el QR; se asienta recién con la firma del vecino
  const createFiadoRequest: TefiContextType['createFiadoRequest'] = async (data) => {
    const merchantKeypair = deviceKeys.merchant;
    if (!merchantKeypair) return { success: false, error: tr('Switch to store mode first.', 'Pasá a modo almacén primero.') };

    const amountUsdc = +Number(data?.amountUsdc).toFixed(2);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      return { success: false, error: tr('Invalid amount. It must be greater than zero.', 'Monto de fiado inválido. Debe ser un valor numérico mayor a cero.') };
    }

    try {
      const customerKey = new PublicKey(data.neighbor.address);
      const profile = await fetchOnChainCustomerProfile(customerKey);
      const available = profile ? profile.creditLimitUsdc - profile.activeDebtUsdc : BASE_CREDIT_LIMIT_USDC;
      if (amountUsdc > available) {
        return {
          success: false,
          error: tr(
            `Over the neighbor's on-chain limit. Available: ${available.toFixed(2)} USDC. Requested: ${amountUsdc.toFixed(2)} USDC.`,
            `Supera el límite on-chain del vecino. Disponible: ${available.toFixed(2)} USDC. Solicitado: ${amountUsdc.toFixed(2)} USDC.`
          )
        };
      }

      await ensureMerchantInitialized(merchantKeypair, DEFAULT_STORE_NAME, DEFAULT_STORE_CATEGORY);

      const dueDate = new Date(Date.now() + FIADO_TERM_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const itemsDescription = data.itemsDescription || tr('Store purchase', 'Compra de almacén');
      const photoSha256 = data.photoReceiptUrl ? await sha256Hex(data.photoReceiptUrl) : '';
      const receiptHash = await computeReceiptHash({
        merchant: merchantKeypair.publicKey,
        customer: customerKey,
        amountMicroUsdc: BigInt(Math.round(amountUsdc * MICRO_USDC)),
        dueTimestamp: Math.floor(new Date(dueDate).getTime() / 1000),
        ticket: { amountArs: data.amountArs, items: itemsDescription, photoSha256 }
      });

      const request = await assembleCosign(
        {
          kind: 'issue',
          neighbor: data.neighbor,
          amountUsdc,
          amountArs: data.amountArs,
          itemsDescription,
          photoReceiptUrl: data.photoReceiptUrl,
          photoSha256,
          receiptHash,
          dueDate,
          nonce: 0
        },
        []
      );
      return { success: true, request };
    } catch (err) {
      console.error('[Tefi] Error al armar issue_fiado:', err);
      return { success: false, error: chainErrorText(err) };
    }
  };

  // 2. Repago: el almacén confirma que cobró (firma parcial) y el vecino lo completa desde su teléfono
  const createRepayRequest: TefiContextType['createRepayRequest'] = async (fiado) => {
    if (!deviceKeys.merchant) return { success: false, error: tr('Switch to store mode first.', 'Pasá a modo almacén primero.') };
    if (fiado.status !== 'ACTIVE') return { success: false, error: tr('This fiado is already settled.', 'Este fiado ya se encuentra saldado.') };

    try {
      const request = await assembleCosign(
        {
          kind: 'repay',
          neighbor: { address: fiado.customerId, name: fiado.customerName, addedAt: '' },
          amountUsdc: fiado.amountUsdc,
          amountArs: fiado.amountArs,
          itemsDescription: fiado.itemsDescription,
          photoReceiptUrl: fiado.photoReceiptUrl,
          photoSha256: '',
          receiptHash: fiado.receiptHash ?? '',
          dueDate: fiado.dueDate,
          nonce: fiado.nonce ?? 0
        },
        []
      );
      return { success: true, request };
    } catch (err) {
      console.error('[Tefi] Error al armar repay_fiado:', err);
      return { success: false, error: chainErrorText(err) };
    }
  };

  const refreshCosignRequest: TefiContextType['refreshCosignRequest'] = async (request) => {
    try {
      const { url, attempts, expiresAt, includesProfileSetup, ...draft } = request;
      return { success: true, request: await assembleCosign(draft, attempts) };
    } catch (err) {
      return { success: false, error: chainErrorText(err) };
    }
  };

  // El almacén sigue la transacción por su propia firma: sabe cuándo el vecino la completó y la envió
  const checkCosignRequest: TefiContextType['checkCosignRequest'] = async (request) => {
    let landed;
    try {
      landed = await findLandedSignature(request.attempts.map(a => a.signature));
    } catch (e) {
      return { state: 'pending' };
    }
    if (!landed) return { state: 'pending' };
    if (landed.failed) {
      return { state: 'failed', error: tr('The Tefi program rejected the transaction. Nothing was recorded.', 'El programa de Tefi rechazó la transacción. No se asentó nada.') };
    }

    const signature = landed.signature;
    const attempt = request.attempts.find(a => a.signature === signature)!;
    const now = new Date().toISOString();
    saveDetail(
      attempt.fiadoAddress,
      request.kind === 'issue'
        ? { txSignature: signature, createdAt: now, pendingSince: undefined }
        : { repayTxSignature: signature, repaidAt: now }
    );
    await syncFromChain();
    return { state: 'confirmed', signature };
  };

  // Demo en un solo dispositivo: el mismo navegador pasa a actuar como vecino con el link que mostraba el QR
  const handOffCosignToNeighbor = (url: string) => {
    setRole('CUSTOMER');
    setPendingCosignUrl(url);
  };

  // -------------------------------------------------------------
  // TELÉFONO DEL VECINO
  // -------------------------------------------------------------

  const neighborIdUrl = deviceKeys.customer
    ? encodeNeighborUrl(baseUrl, { address: deviceKeys.customer.publicKey.toBase58(), name: DEFAULT_NEIGHBOR_NAME })
    : '';

  // 3. El vecino lee el QR: se muestra lo que dice la transacción firmada por el almacén, no lo que dice la pantalla
  const openCosign: TefiContextType['openCosign'] = async (scannedText) => {
    const customerKeypair = deviceKeys.customer;
    if (!customerKeypair) return { success: false, error: tr('Switch to neighbor mode first.', 'Pasá a modo vecino primero.') };

    try {
      const envelope = parseCosignUrl(scannedText);
      if (!envelope) {
        return { success: false, error: tr('That QR is not a Tefi fiado or repayment.', 'Ese QR no es un fiado ni un repago de Tefi.') };
      }

      const inspected = inspectCosignTransaction(envelope.tx, customerKeypair.publicKey);
      const common = {
        tx: envelope.tx,
        signature: inspected.signature,
        storeName: envelope.storeName || tr('Store', 'Almacén'),
        storeAddress: inspected.merchant.toBase58(),
        fiadoAddress: inspected.fiadoRecord.toBase58()
      };

      if (inspected.kind === 'issue') {
        await assertTicketMatches(inspected, envelope.ticket);
        return {
          success: true,
          incoming: {
            ...common,
            kind: 'issue',
            amountUsdc: Number(inspected.amountMicroUsdc) / MICRO_USDC,
            amountArs: envelope.ticket!.amountArs,
            itemsDescription: envelope.ticket!.items,
            dueDate: new Date(inspected.dueTimestamp * 1000).toISOString(),
            includesProfileSetup: inspected.includesProfileSetup
          }
        };
      }

      // Repago: el monto que se salda es el del fiado que ya está on-chain
      const onChainFiado = await fetchOnChainFiado(inspected.fiadoRecord);
      if (!onChainFiado || onChainFiado.status !== 'ACTIVE') {
        return { success: false, error: tr('This fiado is not active on-chain (already settled?).', 'Este fiado no está activo on-chain (¿ya fue saldado?).') };
      }
      const known = fiados.find(f => f.id === common.fiadoAddress);
      return {
        success: true,
        incoming: {
          ...common,
          kind: 'repay',
          storeName: envelope.storeName || known?.merchantName || tr('Store', 'Almacén'),
          amountUsdc: onChainFiado.amountUsdc,
          amountArs: known?.amountArs ?? Math.round(onChainFiado.amountUsdc * (exchangeRate.rate || 1615)),
          itemsDescription: known?.itemsDescription ?? '',
          dueDate: new Date(onChainFiado.dueTimestamp * 1000).toISOString(),
          includesProfileSetup: false
        }
      };
    } catch (err) {
      console.error('[Tefi] Error al leer el pedido de co-firma:', err);
      return { success: false, error: chainErrorText(err) };
    }
  };

  // 4. El vecino firma con SU clave y envía. Recién ahí el fiado (o el repago) existe on-chain.
  const approveCosign: TefiContextType['approveCosign'] = async (incoming) => {
    const customerKeypair = deviceKeys.customer;
    if (!customerKeypair) return { success: false, error: tr('Switch to neighbor mode first.', 'Pasá a modo vecino primero.') };

    try {
      const signature = await submitCosignedTransaction(completeCosign(incoming.tx, customerKeypair));

      const now = new Date().toISOString();
      saveDetail(
        incoming.fiadoAddress,
        incoming.kind === 'issue'
          ? {
              amountArs: incoming.amountArs,
              itemsDescription: incoming.itemsDescription,
              counterpartyName: incoming.storeName,
              txSignature: signature,
              createdAt: now
            }
          : { repayTxSignature: signature, repaidAt: now }
      );
      await syncFromChain();

      notify(
        incoming.kind === 'issue' ? tr('Fiado co-signed on-chain', 'Fiado co-firmado on-chain') : tr('Repayment co-signed on-chain', 'Repago co-firmado on-chain'),
        tr(
          `$${incoming.amountUsdc.toFixed(2)} USDC confirmed on Solana Devnet. Tx: ${signature.slice(0, 16)}...`,
          `$${incoming.amountUsdc.toFixed(2)} USDC confirmados en Solana Devnet. Tx: ${signature.slice(0, 16)}...`
        )
      );
      return { success: true, signature };
    } catch (err) {
      console.error('[Tefi] Error al co-firmar:', err);
      // Si falla, nada se asienta: la libreta sigue mostrando solo lo que está on-chain
      return { success: false, error: chainErrorText(err) };
    }
  };

  // -------------------------------------------------------------
  // RESET DEL DISPOSITIVO
  // -------------------------------------------------------------

  // Identidad nueva para el rol en uso, para repetir el demo desde cero: clave nueva y libreta vacía.
  // El SOL de devnet del almacén se traslada a su clave nueva para no depender otra vez del faucet.
  const resetDevice = async () => {
    if (!chosenRole) return;
    if (chosenRole === 'MERCHANT') {
      const oldMerchant = deviceKeys.merchant;
      const freshMerchant = Keypair.generate();
      if (oldMerchant) {
        const hadFunds = (await getDevnetBalance(oldMerchant.publicKey)) > 0.001;
        const moved = await sweepDevnetSol(oldMerchant, freshMerchant.publicKey);
        if (hadFunds && !moved) {
          notify(tr('Reset cancelled', 'Reset cancelado'), tr('Could not move the store devnet SOL to a new key. Try again.', 'No se pudo trasladar el SOL de devnet del almacén a una clave nueva. Reintentá.'));
          return;
        }
      }
      storeRoleKeypair('merchant', freshMerchant);
    } else {
      forgetRoleKeypair('customer'); // se crea una nueva al volver a calcular la clave activa
    }

    Object.keys(localStorage)
      .filter(key => key.startsWith('tefi_chain_snapshot_'))
      .forEach(key => localStorage.removeItem(key));
    [STORAGE.neighbors, STORAGE.details].forEach(key => localStorage.removeItem(key));

    setNeighbors([]);
    setDetails({});
    setSnapshot(emptySnapshot(''));
    setIdentityEpoch(epoch => epoch + 1);
  };

  return (
    <TefiContext.Provider
      value={{
        role,
        setRole,
        chooseDeviceRole,
        needsRoleChoice: chosenRole === null,
        isSingleDeviceDemo,
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        a11yLargeText,
        toggleA11yLargeText,
        a11yHighContrast,
        toggleA11yHighContrast,
        t,
        tr,
        customer,
        merchant,
        fiados,
        isSyncing,
        syncFailed,
        hasSynced,
        syncFromChain,
        exchangeRate,
        solanaBalance,
        isAirdropLoading,
        requestAirdrop: handleAirdrop,
        resetDevice,
        notification,
        dismissNotification,
        neighbors,
        addNeighbor,
        fetchNeighborProfile,
        createFiadoRequest,
        createRepayRequest,
        refreshCosignRequest,
        checkCosignRequest,
        handOffCosignToNeighbor,
        neighborIdUrl,
        pendingCosignUrl,
        clearPendingCosignUrl,
        openCosign,
        approveCosign
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
