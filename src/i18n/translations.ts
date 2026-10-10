import { LoyaltyTier } from '../types/tefi';

export type Language = 'es' | 'en';

const TIER_NAMES_EN: Record<LoyaltyTier, string> = {
  Bronce: 'Bronze',
  Plata: 'Silver',
  Oro: 'Gold',
  Diamante: 'Diamond'
};

export const tierLabel = (tier: LoyaltyTier, language: Language): string => (language === 'en' ? TIER_NAMES_EN[tier] : tier);

export const translations = {
  es: {
    // Header & Global
    store: 'Almacén',
    neighbor: 'Vecino',
    wallet: 'Billetera',
    copyWallet: 'Copiar clave pública',
    viewSolanaExplorer: 'Ver en Solana Explorer',
    liveOracle: 'Cotización',
    airdropTitle: 'Pedir 1 SOL de devnet (el almacén paga comisiones y rent)',
    resetDemo: 'Reiniciar este dispositivo (identidad nueva)',
    toggleTheme: 'Alternar tema claro / oscuro',
    largeText: 'Texto grande',
    normalText: 'Texto normal',

    // Navigation
    navStore: 'Almacén',
    navFiar: 'Fiar',
    navNeighbors: 'Vecinos',
    navLibreta: 'Mi Libreta',
    navScore: 'Score Crediticio',
    navHistory: 'Historial',

    // Merchant Dashboard
    totalPendingFiados: 'Total por Cobrar (Fiados)',
    salesOnCredit: 'Ventas Fiadas',
    collected: 'Cobrados',
    onHold: 'En Espera',
    fiadosToCollect: 'Fiados por Cobrar',
    filterPaid: 'Cobrados',
    noFiadosFound: 'No hay fiados por cobrar.',
    equivArs: 'Equiv. aprox:',

    // Repayment history
    loyaltySubtitle: 'Leído de tu perfil on-chain',
    loyaltyTier: 'Nivel',
    points: 'pts',
    historyTitle: 'Historial de Cumplimiento',
    pointsEarnedBadge: '20 pts por cada USDC saldado',
    noPastFiados: 'Aún no registrás fiados saldados.',
    noPastFiadosSub: 'Cada fiado que el almacén y vos co-firmen como pagado va a aparecer acá.',
    viewOnDevnet: 'Ver en Devnet',

    // Passbook / Libreta
    totalConsumptions: 'Total de consumos en la libreta',
    feeNotice: 'Sin comisiones para vos: la comisión de red de cada fiado y de cada repago la paga el almacén.',
    activeFiadosTitle: 'Compras al Fiado Activas',
    payNow: 'Escanear QR de repago',
    viewTicketPhoto: 'Ver foto del ticket',
    inStoreBanner: '¿En el Almacén?',
    inStoreScanDesc: 'Escaneá el QR del almacén para revisar y co-firmar con este teléfono',
    scanQrBtn: 'Escanear QR',
    allSettled: '¡Estás al día!',
    noActiveFiados: 'No tenés consumos pendientes en tu libreta.',
    dueOn: 'Vence el',
    closeReceipt: 'Cerrar Comprobante',

    // Credit Score
    howScoreWorks: '¿Cómo funciona tu Score Tefi?',
    howScoreWorksDesc: 'Las reglas las aplica el programa de Tefi en Solana. Cada vez que el almacén y vos co-firman el repago de un fiado antes de su vencimiento:',
    howScoreLi1: 'Sumás +5 puntos en tu score on-chain (máximo 100).',
    howScoreLi2: 'Tu límite de crédito crece 5 USDC.',
    howScoreLi3: 'Si pagás después del vencimiento la deuda se salda igual, pero no suma score ni límite.',

    // Camera
    cameraPhotoTicket: 'Foto del Ticket o Mercadería',
    photoStaysOnPhone: 'Queda en el teléfono · on-chain va solo su hash',
    cameraOptimizing: 'Optimizando y comprimiendo foto...',
    cameraMobileReady: 'Asegurando rendimiento y compatibilidad móvil',
    capturePhotoBtn: 'Capturar Foto',
    cancelBtn: 'Cancelar',
    photoLoaded: 'Foto cargada',
    changePhoto: 'Cambiar Foto',
    takePhotoOrTicket: 'Sacar foto a los productos o ticket',
    avoidDisputes: 'Evita disputas: su SHA-256 forma parte del hash del ticket que firman los dos',
    openCameraBtn: 'Abrir Cámara',
    galleryBtn: 'Galería',
    quickDemo: 'Fotos de muestra:'
  },
  en: {
    // Header & Global
    store: 'Store',
    neighbor: 'Neighbor',
    wallet: 'Wallet',
    copyWallet: 'Copy public key',
    viewSolanaExplorer: 'View on Solana Explorer',
    liveOracle: 'ARS rate',
    airdropTitle: 'Request 1 devnet SOL (the store pays fees and rent)',
    resetDemo: 'Reset this device (new identity)',
    toggleTheme: 'Toggle light / dark theme',
    largeText: 'Large text',
    normalText: 'Normal text',

    // Navigation
    navStore: 'Store',
    navFiar: 'Credit',
    navNeighbors: 'Neighbors',
    navLibreta: 'My Passbook',
    navScore: 'Credit Score',
    navHistory: 'History',

    // Merchant Dashboard
    totalPendingFiados: 'Total Pending Receivables',
    salesOnCredit: 'Credit Sales',
    collected: 'Collected',
    onHold: 'Pending',
    fiadosToCollect: 'Credits to Collect',
    filterPaid: 'Collected',
    noFiadosFound: 'No store credits to collect.',
    equivArs: 'Approx. equiv:',

    // Repayment history
    loyaltySubtitle: 'Read from your on-chain profile',
    loyaltyTier: 'Tier',
    points: 'pts',
    historyTitle: 'Repayment History',
    pointsEarnedBadge: '20 pts per USDC repaid',
    noPastFiados: 'No repaid credits yet.',
    noPastFiadosSub: 'Every credit you and the store co-sign as repaid will show up here.',
    viewOnDevnet: 'View on Devnet',

    // Passbook / Libreta
    totalConsumptions: 'Total passbook consumptions',
    feeNotice: 'No fees for you: the store pays the network fee of every credit and repayment.',
    activeFiadosTitle: 'Active Store Credits',
    payNow: 'Scan repayment QR',
    viewTicketPhoto: 'View receipt photo',
    inStoreBanner: 'At the Store?',
    inStoreScanDesc: 'Scan the store QR to review and co-sign with this phone',
    scanQrBtn: 'Scan QR',
    allSettled: 'You are all caught up!',
    noActiveFiados: 'No pending consumptions in your passbook.',
    dueOn: 'Due on',
    closeReceipt: 'Close Receipt',

    // Credit Score
    howScoreWorks: 'How does your Tefi Score work?',
    howScoreWorksDesc: 'The rules are enforced by the Tefi program on Solana. Every time the store and you co-sign the repayment of a credit before its due date:',
    howScoreLi1: 'You earn +5 points on your on-chain score (maximum 100).',
    howScoreLi2: 'Your credit limit grows by 5 USDC.',
    howScoreLi3: 'Repaying after the due date still settles the debt, but adds no score or limit.',

    // Camera
    cameraPhotoTicket: 'Receipt or Goods Photo',
    photoStaysOnPhone: 'Stays on the phone · only its hash goes on-chain',
    cameraOptimizing: 'Optimizing and compressing photo...',
    cameraMobileReady: 'Ensuring mobile performance and compatibility',
    capturePhotoBtn: 'Take Photo',
    cancelBtn: 'Cancel',
    photoLoaded: 'Photo uploaded',
    changePhoto: 'Change Photo',
    takePhotoOrTicket: 'Take a photo of products or receipt',
    avoidDisputes: 'Avoid disputes: its SHA-256 is part of the receipt hash both of you sign',
    openCameraBtn: 'Open Camera',
    galleryBtn: 'Gallery',
    quickDemo: 'Sample photos:'
  }
};
