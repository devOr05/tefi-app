// Qué dice el sitio de sí mismo a quien no ejecuta la app: buscadores, asistentes de IA, la vista previa de un
// link en WhatsApp y un navegador sin JavaScript. Todo lo que se afirma acá es lo que la app y el programa hacen;
// las cifras de validación en la calle no van acá (están en el README y las decide el equipo).
import type { Language } from '../i18n/translations';

export const SITE = {
  name: 'Tefi.app',
  // Dirección pública. El build la toma de VITE_SITE_URL si está definida (ver vite.config.ts)
  url: 'https://tef-iapp.vercel.app',
  repository: 'https://github.com/devOr05/tefi-app',
  programId: '9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ',
  license: 'MIT'
};

export const PROGRAM_EXPLORER_URL = `https://explorer.solana.com/address/${SITE.programId}?cluster=devnet`;

export interface SiteCopy {
  /** Meta description y vista previa del link: entre 70 y 170 caracteres */
  description: string;
  imageAlt: string;
  heading: string;
  lead: string;
  howTitle: string;
  steps: string[];
  questionsTitle: string;
  questions: { question: string; answer: string }[];
  linksTitle: string;
  links: { label: string; url: string }[];
  otherLanguage: string;
  needsJavaScript: string;
  /** Lista de funciones para los datos estructurados (schema.org featureList) */
  features: string[];
}

export const SITE_COPY: Record<Language, SiteCopy> = {
  en: {
    description:
      'Corner store credit (el fiado) co-signed on Solana: store and neighbor each sign from their own phone, building a repayment history the neighbor can take anywhere.',
    imageAlt: 'Tefi.app: the corner store credit notebook, co-signed on Solana',
    heading: 'Tefi.app: the corner store credit notebook, co-signed on Solana',
    lead:
      'Tefi.app is a mobile web app that replaces the paper notebook where corner stores in Argentina write down what they sell on credit ("el fiado"). Every fiado and every repayment is a Solana transaction signed by both the store and the neighbor, each from their own phone. The repayments add up to a history that belongs to the neighbor and that any lender can read on-chain.',
    howTitle: 'How it works',
    steps: [
      'Each phone is set up as the store or as a neighbor and creates only the signing key of that role. There is no sign-up: the key is created on the phone and stays there.',
      'The store types the amount in Argentine pesos, takes a photo of the receipt and signs first. The request appears as a QR code.',
      'The neighbor scans the QR with their own phone, checks what the transaction says, adds the second signature and sends it to Solana.',
      "When the neighbor pays, the store confirms the repayment and the neighbor co-signs it the same way. Each on-time repayment raises the neighbor's on-chain score and credit limit."
    ],
    questionsTitle: 'Questions and answers',
    questions: [
      {
        question: 'What is el fiado?',
        answer:
          'In Argentina and across Latin America, corner stores let neighbors take their groceries and pay later, and write the debt down in a paper notebook. That informal credit is called el fiado.'
      },
      {
        question: 'Does Tefi.app move real money?',
        answer:
          'No. It runs on Solana devnet, a test network, and it is a prototype: do not use it for real money. It records the debt and its repayment in USDC units as a stable unit of account; the money itself changes hands between neighbor and store in cash or by transfer, as it does today.'
      },
      {
        question: 'Does the neighbor need crypto or SOL?',
        answer:
          "No. The store pays the network fee of every transaction, including the creation of the neighbor's profile in their first fiado."
      },
      {
        question: 'Can the store or the neighbor record a debt alone?',
        answer:
          "No. The program only accepts a fiado or a repayment that carries both signatures. The neighbor's phone rebuilds the transaction, verifies the store's signature over it and rejects anything that is not exactly a Tefi fiado or repayment for its own key."
      },
      {
        question: 'Where is the data stored?',
        answer:
          'Fiados, repayments and scores are accounts of the Tefi program on Solana devnet. Tefi has no server or database of its own: the signing keys and the receipt photos stay on the phones.'
      },
      {
        question: 'Is Tefi.app open source?',
        answer: 'Yes, under the MIT license. The Anchor program, the web app and the tests are in the GitHub repository.'
      }
    ],
    linksTitle: 'Links',
    links: [
      { label: 'Source code on GitHub', url: SITE.repository },
      { label: 'The Tefi program on Solana Explorer (devnet)', url: PROGRAM_EXPLORER_URL },
      { label: 'What changed in each version', url: `${SITE.repository}/blob/main/CHANGELOG.md` }
    ],
    otherLanguage: 'Versión en español',
    needsJavaScript: 'The app itself needs JavaScript: turn it on in your browser and reload this page to use it.',
    features: [
      'Credit and repayments co-signed by store and neighbor, each from their own phone',
      'Requests passed from phone to phone as a QR code or a link',
      'The store pays every network fee: the neighbor needs no SOL',
      'Repayment history, score and credit limit on-chain, readable by any lender',
      'English and Spanish'
    ]
  },
  es: {
    description:
      'El fiado del almacén, co-firmado en Solana: almacenero y vecino firman cada uno desde su teléfono y el vecino arma un historial de pago que se lleva a donde quiera.',
    imageAlt: 'Tefi.app: la libreta del fiado del almacén, co-firmada en Solana',
    heading: 'Tefi.app: la libreta del fiado del almacén, co-firmada en Solana',
    lead:
      'Tefi.app es una app web para el teléfono que reemplaza la libreta de papel donde los almacenes de barrio de Argentina anotan lo que venden fiado. Cada fiado y cada pago es una transacción de Solana firmada por el almacenero y por el vecino, cada uno desde su propio teléfono. Los pagos van armando un historial que es del vecino y que cualquier prestamista puede leer on-chain.',
    howTitle: 'Cómo funciona',
    steps: [
      'Cada teléfono se configura como almacén o como vecino y crea solo la clave de firma de ese rol. No hay registro: la clave se crea en el teléfono y queda ahí.',
      'El almacén escribe el monto en pesos, saca una foto del ticket y firma primero. El pedido aparece como un código QR.',
      'El vecino escanea el QR con su teléfono, revisa qué dice la transacción, agrega la segunda firma y la envía a Solana.',
      'Cuando el vecino paga, el almacén confirma el pago y el vecino lo co-firma de la misma manera. Cada pago en término sube el score y el límite de crédito on-chain del vecino.'
    ],
    questionsTitle: 'Preguntas y respuestas',
    questions: [
      {
        question: '¿Qué es el fiado?',
        answer:
          'En Argentina y en toda América Latina, los almacenes de barrio dejan que los vecinos se lleven la mercadería y paguen después, y anotan la deuda en una libreta de papel. Ese crédito informal es el fiado.'
      },
      {
        question: '¿Tefi.app mueve dinero real?',
        answer:
          'No. Funciona en devnet, la red de pruebas de Solana, y es un prototipo: no hay que usarlo con dinero real. Registra la deuda y su pago en unidades de USDC como unidad de cuenta estable; la plata cambia de manos entre vecino y almacén en efectivo o por transferencia, como hoy.'
      },
      {
        question: '¿El vecino necesita cripto o SOL?',
        answer:
          'No. El almacén paga la comisión de red de cada transacción, incluida la creación del perfil del vecino en su primer fiado.'
      },
      {
        question: '¿Puede el almacén o el vecino anotar una deuda por su cuenta?',
        answer:
          'No. El programa solo acepta un fiado o un pago que lleve las dos firmas. El teléfono del vecino rearma la transacción, verifica la firma del almacén y rechaza todo lo que no sea exactamente un fiado o un pago de Tefi para su propia clave.'
      },
      {
        question: '¿Dónde se guardan los datos?',
        answer:
          'Los fiados, los pagos y el score son cuentas del programa de Tefi en la devnet de Solana. Tefi no tiene servidor ni base de datos propios: las claves de firma y las fotos de los tickets quedan en los teléfonos.'
      },
      {
        question: '¿Tefi.app es de código abierto?',
        answer: 'Sí, con licencia MIT. El programa de Anchor, la app web y las pruebas están en el repositorio de GitHub.'
      }
    ],
    linksTitle: 'Enlaces',
    links: [
      { label: 'Código fuente en GitHub', url: SITE.repository },
      { label: 'El programa de Tefi en Solana Explorer (devnet)', url: PROGRAM_EXPLORER_URL },
      { label: 'Qué cambió en cada versión (en inglés)', url: `${SITE.repository}/blob/main/CHANGELOG.md` }
    ],
    otherLanguage: 'English version',
    needsJavaScript: 'La app necesita JavaScript: activalo en el navegador y volvé a cargar esta página para usarla.',
    features: [
      'Fiados y pagos co-firmados por almacenero y vecino, cada uno desde su teléfono',
      'Pedidos que pasan de un teléfono al otro como código QR o como link',
      'El almacén paga todas las comisiones de red: el vecino no necesita SOL',
      'Historial de pago, score y límite de crédito on-chain, que cualquier prestamista puede leer',
      'Español e inglés'
    ]
  }
};
