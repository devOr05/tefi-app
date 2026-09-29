# 🥩 Tefi.app ("Te Fío") — El Fiado Digital en Solana

> **Proyecto desarrollado para el Superteam Argentina Hackathon | Road to Colosseum (Crypto World's Fair)**  
> *Track Oficial de Superteam Argentina — 10.000 USD en Premios.*

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-50E3C2?style=flat)](https://anchor-lang.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-00A650?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🏛️ 1. El Problema Real en Argentina y Latinoamérica

En cada barrio de Argentina existe **"el fiado"** (la libreta del almacenero, la panadería o la fiambrería). Es la principal fuente de microcrédito para millones de personas que no califican para tarjetas bancarias ni créditos formales.

Sin embargo, el sistema tradicional en papel está roto por 3 razones críticas:
1. **La Inflación:** Si el almacenero fía en pesos hoy y cobra en 30 días, la devaluación destruye su margen de ganancia.
2. **El Riesgo de Incobrabilidad:** Cuando un cliente no paga, el almacenero asume el 100% de la pérdida y muchas veces se funde.
3. **Disputas por falta de registro:** *"Che, Tito, yo no me llevé ese queso que me anotaste"*. La libreta de papel genera desconfianza.

---

## ⚡ 2. La Solución: Tefi.app

**Tefi** digitaliza la histórica libreta del almacén sobre **Solana** a través de una **Progressive Web App (PWA)** mobile-first sin fricción:

* 📸 **Comprobante Fotográfico On-Chain:** Al fiar, el comerciante toma una foto del ticket o de la mercadería sobre el mostrador en un tap. Queda registrada de forma inmutable, eliminando disputas.
* 💵 **Fiar en Stablecoins (USDC):** El precio se calcula en el momento y la deuda se pacta en dólares digitales, blindando el capital del comercio contra la inflación.
* 📈 **Score Crediticio On-Chain:** Cada pago a término otorga **+5 puntos** en el score y expande el límite de crédito disponible del vecino en **+$5 USDC**. La reputación es transparente y portable.
* 🛡️ **Pool de Seguro Mutuo con Riesgo Actuarial:** Los comercios aportan a una bóveda en Solana (Vault PDA). Si un cliente entra en mora (30 días), el comercio ejecuta el seguro y recupera el costo de su mercadería.
  * **La Regla de Riesgo:** Si un comercio fía de manera irresponsable y ejecuta muchos reclamos, su prima de seguro **aumenta automáticamente** (de 2.5% hasta 12%), previniendo el fraude y la selección adversa.
* 🎁 **Programa de Fidelidad Barrial:** Los vecinos cumplidores acumulan "Puntos Tefi" canjeables por descuentos en los comercios de su barrio.

---

## 🎯 3. La Pregunta de Colosseum: ¿Por qué Solana?

> *"Tefi habilita un mercado de microcréditos de confianza y seguro mancomunado P2P que no puede existir en el sistema bancario tradicional: las comisiones de fracción de centavo de Solana ($0.00025) y su velocidad de 400ms hacen viables micropagos diarios de $2 o $5 USD, mientras que los contratos en Anchor garantizan un fondo de cobertura actuarial sin intermediarios corporativos."*

---

## 🏗️ 4. Arquitectura Técnica

```
┌────────────────────────────────────────────────────────┐
│                   Tefi.app (PWA)                       │
│        React 18 + Vite + Tailwind + Lucide             │
│                                                        │
│  • PWA Service Worker (Instalable en Android & iOS)    │
│  • Acceso nativo a cámara (HTML5 / Environment stream) │
│  • Modo Almacén (Vendedor) & Modo Vecino (Cliente)    │
│  • Generador y lector de QR                            │
└──────────────────────────┬─────────────────────────────┘
                           │ RPC Devnet (Solana Web3)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Smart Contract en Anchor (Rust)            │
│                 Programa: TefiProg11...                │
│                                                        │
│  • initialize_merchant: Registro y tasa base 2.5%      │
│  • issue_fiado: Validación de límite + hash de foto    │
│  • repay_fiado: Saldo de deuda + aumento de score      │
│  • claim_insurance: Pago de indemnización + ajuste de  │
│    prima actuarial por mora del comercio               │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 5. Cómo Ejecutar Localmente

### Prerrequisitos
* Node.js v18+ o v24+
* Git

```bash
# 1. Clonar el repositorio
git clone https://github.com/devOr05/tefi-app.git
cd tefi-app

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La app estará corriendo en `http://localhost:5173`. Abrila en tu celular o en el modo responsivo móvil de las DevTools del navegador para experimentar la PWA.

---

## 📱 6. Cómo Instalar la PWA en el Celular
1. Abrí la URL en Google Chrome (Android) o Safari (iOS).
2. Toca el menú de opciones (o el botón de Compartir en Safari).
3. Selecciona **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
4. ¡Listo! Tefi se abrirá como una aplicación nativa a pantalla completa.

---

## 🎬 7. Guión Sugerido para el Video de Pitch (3 Minutos)

1. **Minuto 0:00 - 0:45 (El Problema):**
   * Mostrar una libreta de almacén real de papel.
   * *"En Argentina el 60% de los vecinos compra al fiado, pero los almaceneros se funden por la inflación y los clientes que no pagan."*
2. **Minuto 0:45 - 2:00 (La Demo en Vivo de Tefi):**
   * Mostrar la PWA en el celular.
   * **Paso 1:** Don Tito ingresa $15.000 ARS (12 USDC), saca una foto a la yerba y al queso sobre el mostrador y genera el QR.
   * **Paso 2:** El vecino escanea con su PWA, ve la foto de lo que lleva y confirma con su score disponible.
   * **Paso 3:** Mostrar cómo al pagar la deuda, el score del vecino sube en vivo en Solana Devnet.
   * **Paso 4:** Mostrar cómo si un comercio tiene incobrables, el seguro le paga pero su tasa de riesgo sube.
3. **Minuto 2:00 - 3:00 (Mercado, Por qué Solana y Cierre):**
   * Explicar el modelo de negocio (1% por fiado + cuota de seguro).
   * Destacar el potencial de escala en almacenes, ferias y comercios de toda Latinoamérica.

---

## 📄 Licencia
Distribuido bajo la licencia MIT. Creado con ❤️ por builders argentinos para el ecosistema Solana.
