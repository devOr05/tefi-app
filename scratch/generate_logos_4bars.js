import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// =========================================================================
// OPCIÓN 4A: PROGRESIÓN ASCENDENTE LIMPIA (4 Barras + 3 Monedas en Cascada)
// Proporciones perfectas: Barra superior amplia de 380px donde la forma 'T'
// es 100% visible con sus alas cian Solana, y las 3 monedas se posan armónicas.
// =========================================================================
const svg4A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Gradientes de las 4 Barras: Transición ascendente de Púrpura a Cian Neón -->
    <linearGradient id="bar4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D287"/>
    </linearGradient>

    <linearGradient id="bar3Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>

    <linearGradient id="bar2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>

    <linearGradient id="bar1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6B21A8"/>
    </linearGradient>

    <!-- Tallo central con gradiente vertical ascendente -->
    <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#0EA5E9" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#14F195" stop-opacity="0.65"/>
    </linearGradient>

    <!-- Gradiente Monedas de Oro Oficiales -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <!-- Sombras para fondo blanco -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>

    <filter id="coinShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#78350F" flood-opacity="0.28"/>
    </filter>

    <filter id="glowCyan" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#14F195" flood-opacity="0.40"/>
    </filter>
  </defs>

  <!-- FONDO BLANCO PURO SQUIRCLE -->
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- TALLO VERTICAL DE LA 'T' (Eje conector que une las 4 barras) -->
  <g filter="url(#softShadow)">
    <rect x="238" y="170" width="36" height="270" rx="18" fill="url(#stemGrad)"/>
  </g>

  <!-- LAS 4 BARRAS HORIZONTALES ESTILO SOLANA (Progresión de tamaño y color que sube) -->
  <g filter="url(#softShadow)">
    <!-- BARRA 1: Base inferior (110px de ancho) -->
    <path d="M210 445 L292 445 C301 445 307 438 309 430 L314 410 C316 402 310 395 302 395 H220 C211 395 205 402 203 410 L198 430 C196 438 202 445 210 445 Z" fill="url(#bar1Grad)"/>

    <!-- BARRA 2: Media inferior (150px de ancho) -->
    <path d="M190 372 L322 372 C331 372 338 365 340 357 L346 337 C348 329 342 322 334 322 H202 C193 322 186 329 184 337 L178 357 C176 365 182 372 190 372 Z" fill="url(#bar2Grad)"/>

    <!-- BARRA 3: Media superior (205px de ancho) -->
    <path d="M162 296 L350 296 C360 296 368 289 370 280 L376 260 C378 251 372 243 363 243 H175 C165 243 157 250 155 259 L149 279 C147 288 153 296 162 296 Z" fill="url(#bar3Grad)"/>

    <!-- BARRA 4: SUPERIOR, LA MÁS GRANDE (350px de ancho - Travesaño principal de la 'T') -->
    <path d="M100 205 L388 205 C402 205 412 195 416 182 L426 148 C430 134 420 120 405 120 L117 120 C103 120 93 130 89 143 L79 177 C75 191 85 205 100 205 Z" fill="url(#bar4Grad)" filter="url(#glowCyan)"/>
  </g>

  <!-- LAS TRES MONEDAS DE LA ABUNDANCIA EN LA BARRA SUPERIOR (Con signo + cada una) -->

  <!-- Moneda Izquierda (+) -->
  <g filter="url(#coinShadow)">
    <circle cx="172" cy="158" r="34" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="2.5"/>
    <circle cx="172" cy="158" r="27" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M159 158 H185 M172 145 V171" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M159 158 H185 M172 145 V171" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <!-- Moneda Derecha (+) -->
  <g filter="url(#coinShadow)">
    <circle cx="340" cy="158" r="34" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="2.5"/>
    <circle cx="340" cy="158" r="27" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M327 158 H353 M340 145 V171" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M327 158 H353 M340 145 V171" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <!-- Moneda Central Principal al Frente (Cúspide con Signo + más grande) -->
  <g filter="url(#coinShadow)">
    <circle cx="256" cy="148" r="44" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="3.5"/>
    <circle cx="256" cy="148" r="35" fill="none" stroke="#78350F" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.4"/>
    <path d="M238 148 H274 M256 130 V166" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
    <path d="M238 148 H274 M256 130 V166" stroke="#FFFFFF" stroke-width="4.8" stroke-linecap="round"/>
  </g>

  <!-- Destello sutil en el ala derecha de Solana -->
  <circle cx="418" cy="128" r="5" fill="#14F195"/>
</svg>`;

// =========================================================================
// OPCIÓN 4B: INCLINACIÓN DINÁMICA ASCENDENTE ("Efecto que sube" de 6.5°)
// Toda la estructura de 4 barras tiene una suave inclinación hacia arriba (alza bursátil / crecimiento)
// Las 3 monedas se posan sobre la barra más grande siguiendo el vuelo ascendente.
// =========================================================================
const svg4B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bar4Grad4B" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="60%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D287"/>
    </linearGradient>

    <linearGradient id="bar3Grad4B" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <linearGradient id="bar2Grad4B" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>

    <linearGradient id="bar1Grad4B" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#7E22CE"/>
    </linearGradient>

    <linearGradient id="stemGrad4B" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7E22CE" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#14F195" stop-opacity="0.65"/>
    </linearGradient>

    <linearGradient id="goldGrad4B" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <filter id="softShadow4B" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>

    <filter id="coinShadow4B" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#78350F" flood-opacity="0.28"/>
    </filter>

    <filter id="glowCyan4B" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#14F195" flood-opacity="0.40"/>
    </filter>
  </defs>

  <!-- FONDO BLANCO PURO SQUIRCLE -->
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- GRUPO INCLINADO ASCENDENTE (-5.5 GRADOS PARA EFECTO QUE SUBE DINÁMICAMENTE) -->
  <g transform="rotate(-5.5 256 256)">
    <!-- Tallo central de la 'T' -->
    <g filter="url(#softShadow4B)">
      <rect x="238" y="170" width="36" height="270" rx="18" fill="url(#stemGrad4B)"/>
    </g>

    <!-- 4 BARRAS HORIZONTALES SOLANA ASCENDIENDO -->
    <g filter="url(#softShadow4B)">
      <!-- Barra 1 Base (110px) -->
      <path d="M210 445 L292 445 C301 445 307 438 309 430 L314 410 C316 402 310 395 302 395 H220 C211 395 205 402 203 410 L198 430 C196 438 202 445 210 445 Z" fill="url(#bar1Grad4B)"/>

      <!-- Barra 2 (150px) -->
      <path d="M190 372 L322 372 C331 372 338 365 340 357 L346 337 C348 329 342 322 334 322 H202 C193 322 186 329 184 337 L178 357 C176 365 182 372 190 372 Z" fill="url(#bar2Grad4B)"/>

      <!-- Barra 3 (205px) -->
      <path d="M162 296 L350 296 C360 296 368 289 370 280 L376 260 C378 251 372 243 363 243 H175 C165 243 157 250 155 259 L149 279 C147 288 153 296 162 296 Z" fill="url(#bar3Grad4B)"/>

      <!-- Barra 4 Superior Grande (350px) -->
      <path d="M100 205 L388 205 C402 205 412 195 416 182 L426 148 C430 134 420 120 405 120 L117 120 C103 120 93 130 89 143 L79 177 C75 191 85 205 100 205 Z" fill="url(#bar4Grad4B)" filter="url(#glowCyan4B)"/>
    </g>

    <!-- 3 MONEDAS EN LA BARRA SUPERIOR -->
    <g filter="url(#coinShadow4B)">
      <!-- Moneda Izquierda -->
      <circle cx="172" cy="158" r="34" fill="url(#goldGrad4B)" stroke="#FEF08A" stroke-width="2.5"/>
      <circle cx="172" cy="158" r="27" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
      <path d="M159 158 H185 M172 145 V171" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M159 158 H185 M172 145 V171" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
    </g>

    <g filter="url(#coinShadow4B)">
      <!-- Moneda Derecha -->
      <circle cx="340" cy="158" r="34" fill="url(#goldGrad4B)" stroke="#FEF08A" stroke-width="2.5"/>
      <circle cx="340" cy="158" r="27" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
      <path d="M327 158 H353 M340 145 V171" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M327 158 H353 M340 145 V171" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
    </g>

    <g filter="url(#coinShadow4B)">
      <!-- Moneda Central Principal -->
      <circle cx="256" cy="148" r="44" fill="url(#goldGrad4B)" stroke="#FEF08A" stroke-width="3.5"/>
      <circle cx="256" cy="148" r="35" fill="none" stroke="#78350F" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.4"/>
      <path d="M238 148 H274 M256 130 V166" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
      <path d="M238 148 H274 M256 130 V166" stroke="#FFFFFF" stroke-width="4.8" stroke-linecap="round"/>
    </g>

    <circle cx="418" cy="128" r="5" fill="#14F195"/>
  </g>
</svg>`;

// =========================================================================
// OPCIÓN 4C: CORONA DE ABUNDANCIA ELEVADA (Monedas descansando sobre el borde superior)
// La barra superior funciona como un pedestal tecnológico que sostiene las 3 monedas,
// permitiendo apreciar el 100% de la barra Solana con sus 4 niveles limpios.
// =========================================================================
const svg4C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bar4Grad4C" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D287"/>
    </linearGradient>

    <linearGradient id="bar3Grad4C" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>

    <linearGradient id="bar2Grad4C" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>

    <linearGradient id="bar1Grad4C" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6B21A8"/>
    </linearGradient>

    <linearGradient id="stemGrad4C" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#06B6D4" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#14F195" stop-opacity="0.65"/>
    </linearGradient>

    <linearGradient id="goldGrad4C" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <filter id="softShadow4C" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>

    <filter id="coinShadow4C" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#78350F" flood-opacity="0.30"/>
    </filter>

    <filter id="glowCyan4C" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#14F195" flood-opacity="0.40"/>
    </filter>
  </defs>

  <!-- FONDO BLANCO PURO SQUIRCLE -->
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- TALLO VERTICAL ASCENDENTE -->
  <g filter="url(#softShadow4C)">
    <rect x="238" y="215" width="36" height="240" rx="18" fill="url(#stemGrad4C)"/>
  </g>

  <!-- LAS 4 BARRAS HORIZONTALES SOLANA -->
  <g filter="url(#softShadow4C)">
    <!-- Barra 1 Base (110px) -->
    <path d="M210 455 L292 455 C301 455 307 448 309 440 L314 420 C316 412 310 405 302 405 H220 C211 405 205 412 203 420 L198 440 C196 448 202 455 210 455 Z" fill="url(#bar1Grad4C)"/>

    <!-- Barra 2 (150px) -->
    <path d="M190 385 L322 385 C331 385 338 378 340 370 L346 350 C348 342 342 335 334 335 H202 C193 335 186 342 184 350 L178 370 C176 378 182 385 190 385 Z" fill="url(#bar2Grad4C)"/>

    <!-- Barra 3 (205px) -->
    <path d="M162 312 L350 312 C360 312 368 305 370 296 L376 276 C378 267 372 259 363 259 H175 C165 259 157 266 155 275 L149 295 C147 304 153 312 162 312 Z" fill="url(#bar3Grad4C)"/>

    <!-- Barra 4 Superior Grande (350px) -->
    <path d="M100 235 L388 235 C402 235 412 225 416 212 L426 178 C430 164 420 150 405 150 L117 150 C103 150 93 160 89 173 L79 207 C75 221 85 235 100 235 Z" fill="url(#bar4Grad4C)" filter="url(#glowCyan4C)"/>
  </g>

  <!-- 3 MONEDAS EN LA CÚSPIDE (Efecto Corona descansando sobre la barra más grande) -->
  <g filter="url(#coinShadow4C)">
    <!-- Moneda Izquierda -->
    <circle cx="168" cy="140" r="36" fill="url(#goldGrad4C)" stroke="#FEF08A" stroke-width="2.6"/>
    <circle cx="168" cy="140" r="29" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M154 140 H182 M168 126 V154" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
    <path d="M154 140 H182 M168 126 V154" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
  </g>

  <g filter="url(#coinShadow4C)">
    <!-- Moneda Derecha -->
    <circle cx="344" cy="140" r="36" fill="url(#goldGrad4C)" stroke="#FEF08A" stroke-width="2.6"/>
    <circle cx="344" cy="140" r="29" fill="none" stroke="#78350F" stroke-width="1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M330 140 H358 M344 126 V154" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
    <path d="M330 140 H358 M344 126 V154" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
  </g>

  <g filter="url(#coinShadow4C)">
    <!-- Moneda Central Principal al Frente -->
    <circle cx="256" cy="122" r="46" fill="url(#goldGrad4C)" stroke="#FEF08A" stroke-width="3.6"/>
    <circle cx="256" cy="122" r="37" fill="none" stroke="#78350F" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.4"/>
    <path d="M236 122 H276 M256 102 V142" stroke="#78350F" stroke-width="8.5" stroke-linecap="round"/>
    <path d="M236 122 H276 M256 102 V142" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  </g>

  <circle cx="418" cy="158" r="5" fill="#14F195"/>
</svg>`;

// =========================================================================
// OPCIÓN 4D: DINÁMICA DE CRECIMIENTO EXPONENCIAL (Vector Ascendente & Bóveda)
// El tallo vertical culmina en un haz ascendente de luz que eleva la gran barra
// y las 3 monedas hacia la cima del éxito financiero descentralizado.
// =========================================================================
const svg4D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bar4Grad4D" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00C48C"/>
    </linearGradient>

    <linearGradient id="bar3Grad4D" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>

    <linearGradient id="bar2Grad4D" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>

    <linearGradient id="bar1Grad4D" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#581C87"/>
    </linearGradient>

    <linearGradient id="stemGrad4D" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#581C87" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#0284C7" stop-opacity="0.45"/>
      <stop offset="90%" stop-color="#14F195" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="#00FFA3" stop-opacity="1"/>
    </linearGradient>

    <linearGradient id="goldGrad4D" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <filter id="softShadow4D" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>

    <filter id="coinShadow4D" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#78350F" flood-opacity="0.30"/>
    </filter>
  </defs>

  <!-- FONDO BLANCO PURO SQUIRCLE -->
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- TALLO VERTICAL CON FLECHA/VECTOR DE CRECIMIENTO ASCENDENTE (Efecto que sube) -->
  <g filter="url(#softShadow4D)">
    <!-- Tallo que se afina y asciende enérgicamente -->
    <path d="M236 445 L236 185 L256 165 L276 185 L276 445 Z" fill="url(#stemGrad4D)"/>
  </g>

  <!-- LAS 4 BARRAS HORIZONTALES SOLANA CON ESPACIADO EXPONENCIAL -->
  <g filter="url(#softShadow4D)">
    <!-- Barra 1 Base (105px) -->
    <path d="M212 445 L288 445 C297 445 303 438 305 430 L310 412 C312 404 306 397 298 397 H222 C214 397 207 404 205 412 L200 430 C198 438 204 445 212 445 Z" fill="url(#bar1Grad4D)"/>

    <!-- Barra 2 (148px) -->
    <path d="M192 375 L320 375 C329 375 336 368 338 360 L344 342 C346 334 340 327 332 327 H204 C195 327 188 334 186 342 L180 360 C178 368 184 375 192 375 Z" fill="url(#bar2Grad4D)"/>

    <!-- Barra 3 (205px) -->
    <path d="M162 300 L350 300 C360 300 368 293 370 284 L376 264 C378 255 372 247 363 247 H175 C165 247 157 254 155 263 L149 283 C147 292 153 300 162 300 Z" fill="url(#bar3Grad4D)"/>

    <!-- Barra 4 Superior Gigante (350px) -->
    <path d="M100 215 L388 215 C402 215 412 205 416 192 L426 158 C430 144 420 130 405 130 L117 130 C103 130 93 140 89 153 L79 187 C75 201 85 215 100 215 Z" fill="url(#bar4Grad4D)"/>
  </g>

  <!-- 3 MONEDAS OFICIALES EN LA BARRA SUPERIOR -->
  <g filter="url(#coinShadow4D)">
    <!-- Moneda Izquierda (+) -->
    <circle cx="170" cy="165" r="35" fill="url(#goldGrad4D)" stroke="#FEF08A" stroke-width="2.6"/>
    <circle cx="170" cy="165" r="28" fill="none" stroke="#78350F" stroke-width="1.1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M157 165 H183 M170 152 V178" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M157 165 H183 M170 152 V178" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <g filter="url(#coinShadow4D)">
    <!-- Moneda Derecha (+) -->
    <circle cx="342" cy="165" r="35" fill="url(#goldGrad4D)" stroke="#FEF08A" stroke-width="2.6"/>
    <circle cx="342" cy="165" r="28" fill="none" stroke="#78350F" stroke-width="1.1" stroke-dasharray="3 2" opacity="0.35"/>
    <path d="M329 165 H355 M342 152 V178" stroke="#78350F" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M329 165 H355 M342 152 V178" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <g filter="url(#coinShadow4D)">
    <!-- Moneda Central Principal al Frente (+) -->
    <circle cx="256" cy="148" r="45" fill="url(#goldGrad4D)" stroke="#FEF08A" stroke-width="3.6"/>
    <circle cx="256" cy="148" r="36" fill="none" stroke="#78350F" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.4"/>
    <path d="M238 148 H274 M256 130 V166" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
    <path d="M238 148 H274 M256 130 V166" stroke="#FFFFFF" stroke-width="4.8" stroke-linecap="round"/>
  </g>

  <circle cx="418" cy="138" r="5" fill="#14F195"/>
</svg>`;

async function run() {
  const options = [
    { id: 'Opcion_4A_T_Cuatro_Barras_Progresion', svg: svg4A },
    { id: 'Opcion_4B_T_Cuatro_Barras_Inclinacion_Sube', svg: svg4B },
    { id: 'Opcion_4C_T_Cuatro_Barras_Boveda_Corona', svg: svg4C },
    { id: 'Opcion_4D_T_Cuatro_Barras_Vector_Ascendente', svg: svg4D }
  ];

  for (const opt of options) {
    const svgPath = path.join(outputDir, `${opt.id}.svg`);
    const pngPath = path.join(outputDir, `${opt.id}.png`);

    fs.writeFileSync(svgPath, opt.svg, 'utf8');
    await sharp(Buffer.from(opt.svg))
      .resize(1024, 1024)
      .png()
      .toFile(pngPath);

    console.log(`Creado con éxito: ${opt.id}`);
  }
}

run().catch(console.error);
