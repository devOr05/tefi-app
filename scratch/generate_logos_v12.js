import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

function makeCoinFull(cx, cy, r, filter = 'url(#coinShadow)') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.2, r * 0.20);
  const strokeW2 = Math.max(1.3, r * 0.12);
  const strokeBorder = Math.max(1.4, r * 0.08);
  return `
  <g filter="${filter}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

// Moneda cortada a la mitad SIN ranura (se corta al ras del horizonte o de la barra)
function makeHalfEnteringCoinNoSlot(cx, cy, r, cutY, filter = 'url(#coinShadow)', clipId = 'halfClip') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.2, r * 0.20);
  const strokeW2 = Math.max(1.3, r * 0.12);
  const strokeBorder = Math.max(1.4, r * 0.08);
  return `
  <!-- Moneda entrando por la mitad SIN ranura -->
  <g filter="${filter}" clip-path="url(#${clipId})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

const defs = `
  <defs>
    <!-- ClipPath para cortar las monedas pequeñas exactamente a la mitad sin ranura -->
    <clipPath id="clipHalfL_12A">
      <rect x="150" y="80" width="100" height="78" />
    </clipPath>
    <clipPath id="clipHalfR_12A">
      <rect x="260" y="80" width="100" height="78" />
    </clipPath>

    <clipPath id="clipHalfL_12B">
      <rect x="150" y="80" width="100" height="75" />
    </clipPath>
    <clipPath id="clipHalfR_12B">
      <rect x="260" y="80" width="100" height="75" />
    </clipPath>

    <clipPath id="clipHalfL_12C">
      <rect x="150" y="80" width="100" height="80" />
    </clipPath>
    <clipPath id="clipHalfR_12C">
      <rect x="260" y="80" width="100" height="80" />
    </clipPath>

    <clipPath id="clipHalfL_12D">
      <rect x="150" y="80" width="100" height="82" />
    </clipPath>
    <clipPath id="clipHalfR_12D">
      <rect x="260" y="80" width="100" height="82" />
    </clipPath>

    <linearGradient id="bar4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D287"/>
    </linearGradient>

    <linearGradient id="bar3Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>

    <linearGradient id="bar2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>

    <linearGradient id="bar1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6B21A8"/>
    </linearGradient>

    <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#06B6D4" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#14F195" stop-opacity="0.65"/>
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>

    <filter id="coinShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#78350F" flood-opacity="0.28"/>
    </filter>

    <filter id="bigCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#78350F" flood-opacity="0.35"/>
    </filter>

    <filter id="glowCyan" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#14F195" flood-opacity="0.40"/>
    </filter>
  </defs>
`;

const stemAndLowerBars = `
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- TALLO VERTICAL ASCENDENTE -->
  <g filter="url(#softShadow)">
    <rect x="238" y="215" width="36" height="240" rx="18" fill="url(#stemGrad)"/>
  </g>

  <!-- BARRAS 1, 2, 3 (Idénticas a la Opción 4C) -->
  <g filter="url(#softShadow)">
    <!-- Barra 1 Base (110px) -->
    <path d="M210 455 L292 455 C301 455 307 448 309 440 L314 420 C316 412 310 405 302 405 H220 C211 405 205 412 203 420 L198 440 C196 448 202 455 210 455 Z" fill="url(#bar1Grad)"/>

    <!-- Barra 2 (150px) -->
    <path d="M190 385 L322 385 C331 385 338 378 340 370 L346 350 C348 342 342 335 334 335 H202 C193 335 186 342 184 350 L178 370 C176 378 182 385 190 385 Z" fill="url(#bar2Grad)"/>

    <!-- Barra 3 (205px) -->
    <path d="M162 312 L350 312 C360 312 368 305 370 296 L376 276 C378 267 372 259 363 259 H175 C165 259 157 266 155 275 L149 295 C147 304 153 312 162 312 Z" fill="url(#bar3Grad)"/>
  </g>
`;

const bar4 = `
  <g filter="url(#softShadow)">
    <!-- Barra 4 Superior Grande (350px) -->
    <path d="M100 235 L388 235 C402 235 412 225 416 212 L426 178 C430 164 420 150 405 150 L117 150 C103 150 93 160 89 173 L79 207 C75 221 85 235 100 235 Z" fill="url(#bar4Grad)" filter="url(#glowCyan)"/>
  </g>
  <circle cx="418" cy="158" r="5" fill="#14F195"/>
`;

// =========================================================================
// OPCIÓN 12A: COMPRESIÓN HORIZONTAL + MONEDAS DETRÁS DE LA BARRA (SIN RANURA)
// - Moneda grande intacta (cx=256, cy=115, r=44)
// - Monedas laterales comprimidas ~22px hacia adentro y bajadas 12px (cx=160, 352, cy=147, r=32)
// - Monedas chiquitas (r=20) en cx=206 y 306, entrando por la mitad (cy=150)
//   emergiendo naturalmente detrás de la barra superior sin ninguna ranura artificial
// =========================================================================
const svg12A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}

  <!-- Monedas chiquitas renderizadas detrás de la barra superior (entrando por la mitad limpia) -->
  ${makeCoinFull(206, 150, 20)}
  ${makeCoinFull(306, 150, 20)}

  <!-- Barra 4 Superior que cubre la mitad inferior naturalmente -->
  ${bar4}

  <!-- Monedas laterales bajadas y comprimidas -->
  ${makeCoinFull(160, 147, 32)}
  ${makeCoinFull(352, 147, 32)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 12B: COMPRESIÓN DE ESCALA Y ESPACIO (PROPORCIÓN ÁUREA)
// - Moneda grande intacta (cx=256, cy=115, r=44)
// - Monedas laterales comprimidas 0.5cm (r=28, cx=166, 346, cy=150)
// - Monedas chiquitas (r=17, cx=211, 301, cy=150) cortadas al 50% al ras de la barra
// =========================================================================
const svg12B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- Monedas chiquitas entrando al 50% cortadas al ras (sin ranuras) -->
  ${makeHalfEnteringCoinNoSlot(211, 150, 17, 150, 'url(#coinShadow)', 'clipHalfL_12B')}
  ${makeHalfEnteringCoinNoSlot(301, 150, 17, 150, 'url(#coinShadow)', 'clipHalfR_12B')}

  <!-- Monedas laterales comprimidas 0.5cm y más bajas -->
  ${makeCoinFull(166, 150, 28)}
  ${makeCoinFull(346, 150, 28)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 12C: MONEDAS SUPERPUESTAS AL FRENTE CON ENTRADA SUAVE
// - Moneda grande intacta (cx=256, cy=115, r=44)
// - Monedas laterales bajadas (cx=156, 356, cy=152, r=30)
// - Monedas chiquitas (r=18, cx=206, 306, cy=160) entrando a la mitad dentro de la barra
//   renderizadas al frente con recorte limpio al 50%
// =========================================================================
const svg12C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- Monedas chiquitas al 50% entrando a la T -->
  ${makeHalfEnteringCoinNoSlot(206, 160, 19, 160, 'url(#coinShadow)', 'clipHalfL_12C')}
  ${makeHalfEnteringCoinNoSlot(306, 160, 19, 160, 'url(#coinShadow)', 'clipHalfR_12C')}

  <!-- Monedas laterales bajadas y armoniosas -->
  ${makeCoinFull(156, 152, 30)}
  ${makeCoinFull(356, 152, 30)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 12D: MÁXIMA COMPACTACIÓN Y EQUILIBRIO ORGÁNICO
// - Moneda grande intacta (cx=256, cy=115, r=44)
// - Monedas laterales más compactas y contenidas (cx=172, 340, cy=154, r=27)
// - Monedas chiquitas (r=16, cx=214, 298, cy=152) entrando por la mitad detrás de la barra
// - Mayor sensación de unidad arquitectónica
// =========================================================================
const svg12D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}

  <!-- Monedas chiquitas emergiendo desde atrás de la barra -->
  ${makeCoinFull(214, 152, 16)}
  ${makeCoinFull(298, 152, 16)}

  <!-- Barra 4 -->
  ${bar4}

  <!-- Monedas laterales compactas -->
  ${makeCoinFull(172, 154, 27)}
  ${makeCoinFull(340, 154, 27)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

const options = [
  { name: 'Opcion_12A_Fuente_Abundancia_Sin_Ranuras_Detras', svg: svg12A },
  { name: 'Opcion_12B_Fuente_Abundancia_Comprimida_Aurea', svg: svg12B },
  { name: 'Opcion_12C_Fuente_Abundancia_Entrada_Limpia', svg: svg12C },
  { name: 'Opcion_12D_Fuente_Abundancia_Compacta_Organica', svg: svg12D }
];

async function run() {
  for (const opt of options) {
    // 1. Guardar SVG en hoyDir y baseDir
    fs.writeFileSync(path.join(hoyDir, `${opt.name}.svg`), opt.svg);
    fs.writeFileSync(path.join(baseDir, `${opt.name}.svg`), opt.svg);

    // 2. Renderizar PNG 1024x1024
    const pngBuffer = await sharp(Buffer.from(opt.svg))
      .resize(1024, 1024)
      .png({ quality: 100 })
      .toBuffer();

    fs.writeFileSync(path.join(hoyDir, `${opt.name}.png`), pngBuffer);
    fs.writeFileSync(path.join(baseDir, `${opt.name}.png`), pngBuffer);

    console.log(`Generado: ${opt.name}`);
  }
}

run().catch(console.error);
