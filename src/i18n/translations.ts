export type Language = 'es' | 'en';

export const translations = {
  es: {
    // Header & Global
    store: 'Almacén',
    neighbor: 'Vecino',
    wallet: 'Billetera',
    copied: 'Copiado',
    copyWallet: 'Copiar clave pública',
    viewSolanaExplorer: 'Ver en Solana Explorer',
    liveOracle: 'Oráculo en vivo',
    airdropTitle: 'Solicitar 1 SOL gratuito para gas en Devnet',
    resetDemo: 'Reiniciar datos de demo',
    toggleTheme: 'Alternar tema claro / oscuro',
    toggleLang: 'Cambiar idioma (Español / Inglés)',
    accessibility: 'Accesibilidad',
    highContrast: 'Alto contraste',
    textSize: 'Tamaño de texto',
    largeText: 'Texto grande',
    normalText: 'Texto normal',

    // Navigation
    navStore: 'Almacén',
    navFiar: 'Fiar',
    navInsurance: 'Seguro & Riesgo',
    navLibreta: 'Mi Libreta',
    navScore: 'Score Crediticio',
    navLoyalty: 'Fidelidad',

    // Loyalty View
    loyaltyTitle: 'Programa Fidelidad Barrial',
    loyaltySubtitle: 'Puntos acumulados por pagar a término',
    loyaltyTier: 'Nivel',
    loyaltyPerksTitle: 'Beneficios por Nivel de Cumplimiento',
    points: 'pts',
    redeemable: 'Canjeable',
    historyTitle: 'Historial de Cumplimiento',
    pointsEarnedBadge: '20 pts por cada USDC saldado',
    noPastFiados: 'Aún no registras fiados saldados.',
    noPastFiadosSub: 'Cada compra al fiado que abones a tiempo sumará puntos canjeables aquí.',
    viewOnDevnet: 'Ver en Devnet',

    // Partner Stores & Promos
    promosTitle: 'Promociones & Comercios Adheridos',
    promosSubtitle: 'Aprovechá descuentos exclusivos pagando con tu libreta Tefi',
    partnerStoresTitle: 'Almacenes de Barrio Adheridos',
    partnerStoresSubtitle: 'Comercios que confían y reciben la libreta Tefi',
    activeInTefi: 'Adherido a Tefi',
    joinNetworkBtn: 'Sumá tu Almacén a la Red Tefi',
    joinModalTitle: 'Adhesión Comercial a la Red Tefi',
    joinModalDesc: 'Digitalizá la libreta de tu comercio barrial con micropagos instantáneos, score reputacional y seguro contra mora en Solana.',
    storeNamePlaceholder: 'Nombre de tu almacén o negocio',
    addressPlaceholder: 'Dirección o barrio (ej: Palermo / Morón)',
    phonePlaceholder: 'WhatsApp o teléfono de contacto',
    categoryPlaceholder: 'Rubro (Almacén, Fiambrería, Panadería, etc.)',
    submitJoin: 'Solicitar Adhesión Gratuita',
    joinSuccess: '¡Solicitud recibida! El equipo de Tefi se contactará para validar tu comercio en la red Solana.',

    // Passbook / Libreta
    totalConsumptions: 'Total de consumos en la libreta',
    feeNotice: 'Al abonar, se calcula la comisión mínima (1%) por costo de red Solana y mantenimiento de la app.',
    activeFiadosTitle: 'Compras al Fiado Activas',
    payNow: 'Pagar Ahora',
    viewTicketPhoto: 'Ver foto del ticket',
    inStoreBanner: '¿En el Almacén?',
    inStoreScanDesc: 'Escaneá el QR de Don Tito para recibir y firmar tu fiado',
    scanQrBtn: 'Escanear QR',
    allSettled: '¡Estás al día!',
    noActiveFiados: 'No tienes consumos pendientes en tu libreta.',

    // Credit Score
    creditScoreTitle: 'Score de Crédito On-Chain',
    abundanceTitle: 'Fuente de la Abundancia',
    howScoreWorks: '¿Cómo funciona tu Score Tefi?',
    howScoreWorksDesc: 'A diferencia del Veraz bancario que solo castiga, Tefi premia tu lealtad barrial. Cada vez que compras al fiado y pagas dentro del plazo:',

    // A11y labels
    closeModal: 'Cerrar ventana',
    cameraAria: 'Abrir escáner o cámara'
  },
  en: {
    // Header & Global
    store: 'Store',
    neighbor: 'Neighbor',
    wallet: 'Wallet',
    copied: 'Copied',
    copyWallet: 'Copy public key',
    viewSolanaExplorer: 'View on Solana Explorer',
    liveOracle: 'Live Oracle',
    airdropTitle: 'Request 1 free SOL for gas on Devnet',
    resetDemo: 'Reset demo data',
    toggleTheme: 'Toggle light / dark theme',
    toggleLang: 'Change language (Spanish / English)',
    accessibility: 'Accessibility',
    highContrast: 'High contrast',
    textSize: 'Text size',
    largeText: 'Large text',
    normalText: 'Normal text',

    // Navigation
    navStore: 'Store',
    navFiar: 'Credit',
    navInsurance: 'Insurance & Risk',
    navLibreta: 'My Passbook',
    navScore: 'Credit Score',
    navLoyalty: 'Loyalty',

    // Loyalty View
    loyaltyTitle: 'Neighborhood Loyalty Program',
    loyaltySubtitle: 'Points accumulated by paying on time',
    loyaltyTier: 'Tier',
    loyaltyPerksTitle: 'Perks by Compliance Level',
    points: 'pts',
    redeemable: 'Redeemable',
    historyTitle: 'Repayment History',
    pointsEarnedBadge: '20 pts per USDC repaid',
    noPastFiados: 'No repaid credits yet.',
    noPastFiadosSub: 'Every credit you pay on time earns redeemable points here.',
    viewOnDevnet: 'View on Devnet',

    // Partner Stores & Promos
    promosTitle: 'Promotions & Partner Stores',
    promosSubtitle: 'Take advantage of exclusive discounts paying with your Tefi passbook',
    partnerStoresTitle: 'Affiliated Neighborhood Stores',
    partnerStoresSubtitle: 'Local merchants accepting the Tefi credit passbook',
    activeInTefi: 'Tefi Verified',
    joinNetworkBtn: 'Add your Store to the Tefi Network',
    joinModalTitle: 'Merchant Affiliation to Tefi Network',
    joinModalDesc: 'Digitize your neighborhood store credit book with instant micropayments, on-chain credit score, and default insurance on Solana.',
    storeNamePlaceholder: 'Store or business name',
    addressPlaceholder: 'Address or neighborhood (e.g. Brooklyn / Queens)',
    phonePlaceholder: 'WhatsApp or contact phone',
    categoryPlaceholder: 'Category (Grocery, Bakery, Deli, etc.)',
    submitJoin: 'Request Free Affiliation',
    joinSuccess: 'Request received! The Tefi team will reach out to verify your store on the Solana network.',

    // Passbook / Libreta
    totalConsumptions: 'Total passbook consumptions',
    feeNotice: 'When paying, a minimum 1% fee is included for Solana network cost and app maintenance.',
    activeFiadosTitle: 'Active Store Credits',
    payNow: 'Pay Now',
    viewTicketPhoto: 'View receipt photo',
    inStoreBanner: 'At the Store?',
    inStoreScanDesc: 'Scan Don Tito\'s QR to receive and sign your credit purchase',
    scanQrBtn: 'Scan QR',
    allSettled: 'You are all caught up!',
    noActiveFiados: 'No pending consumptions in your passbook.',

    // Credit Score
    creditScoreTitle: 'On-Chain Credit Score',
    abundanceTitle: 'Abundance Fountain',
    howScoreWorks: 'How does your Tefi Score work?',
    howScoreWorksDesc: 'Unlike banking credit bureaus that only penalize, Tefi rewards neighborhood loyalty. Every time you buy on credit and repay on time:',

    // A11y labels
    closeModal: 'Close modal',
    cameraAria: 'Open scanner or camera'
  }
};
