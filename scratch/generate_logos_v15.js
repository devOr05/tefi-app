import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

function makeCoinFull(cx, cy, r, filter = 'url(#coinShadow)') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(1.8, r * 0.20);
  const strokeW2 = Math.max(1.1, r * 0.12);
  const strokeBorder = Math.max(1.2, r * 0.08);
  return `
  <g filter="${filter}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

// Moneda cortada a la mitad exacta al ras de la barra verde (como 14A)
function makeHalfCoinClean(cx, cy, r, cutY, filter = 'url(#coinShadow)', clipId = 'clipClean') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.0, r * 0.20);
  const strokeW2 = Math.max(1.2, r * 0.12);
  const strokeBorder = Math.max(1.3, r * 0.08);
  return `
  <!-- Moneda entrando por la mitad al ras de la barra SIN ranura (estilo 14A) -->
  <g filter="${filter}" clip-path="url(#${clipId})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy - 3} H${cx + plusLen} M${cx} ${cy - plusLen - 3} V${cy + 1}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy - 3} H${cx + plusLen} M${cx} ${cy - plusLen - 3} V${cy + 1}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

const defs = `
  <defs>
    <!-- Clip limpio exactamente al ras del borde horizontal superior de la T (Y = 150) -->
    <clipPath id="clipTopFlushL">
      <rect x="150" y="50" width="100" height="100" />
    </clipPath>
    <clipPath id="clipTopFlushR">
      <rect x="260" y="50" width="100" height="100" />
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

    <filter id="upperCoinShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.25"/>
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

// Base 14A elements:
// - Monedas pequeñas al 50%: cx=196, 316, cy=150, r=16
// - Monedas laterales: cx=148, 364, cy=146, r=27
// - Gran moneda central: cx=256, cy=115, r=44

// =========================================================================
// OPCIÓN 15A: TAMAÑO PEQUEÑO ARMÓNICO (r=14)
// - Dos nuevas monedas en cx=210, cy=92 y cx=302, cy=92 con r=14
// - Ubicadas exactamente en las marcas rojas, detrás de la gran moneda
// =========================================================================
const svg15A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- 2 Monedas inferiores al 50% al ras de la barra (estilo 14A) -->
  ${makeHalfCoinClean(196, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushL')}
  ${makeHalfCoinClean(316, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushR')}

  <!-- 2 NUEVAS MONEDAS EN LAS MARCAS ROJAS (r=14, tamaño pequeño equilibrado) -->
  ${makeCoinFull(210, 92, 14, 'url(#upperCoinShadow)')}
  ${makeCoinFull(302, 92, 14, 'url(#upperCoinShadow)')}

  <!-- Monedas Laterales (estilo 14A) -->
  ${makeCoinFull(148, 146, 27)}
  ${makeCoinFull(364, 146, 27)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 15B: TAMAÑO MEDIANO NOTABLE (r=18)
// - Dos nuevas monedas más protagónicas en cx=208, cy=90 y cx=304, cy=90 con r=18
// - Crean un arco continuo de 7 monedas muy denso y lleno de abundancia
// =========================================================================
const svg15B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- 2 Monedas inferiores al 50% al ras (14A) -->
  ${makeHalfCoinClean(196, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushL')}
  ${makeHalfCoinClean(316, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushR')}

  <!-- 2 NUEVAS MONEDAS EN LAS MARCAS ROJAS (r=18, medianas) -->
  ${makeCoinFull(207, 88, 18, 'url(#upperCoinShadow)')}
  ${makeCoinFull(305, 88, 18, 'url(#upperCoinShadow)')}

  <!-- Monedas Laterales -->
  ${makeCoinFull(148, 146, 27)}
  ${makeCoinFull(364, 146, 27)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 15C: TAMAÑO MICRO / DESTELLOS DE LA FUENTE (r=11)
// - Dos nuevas monedas sutiles y delicadas en cx=212, cy=94 y cx=300, cy=94 con r=11
// - Parecen gotas o monedas nacientes que brotan de la fuente hacia la gran moneda
// =========================================================================
const svg15C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- 2 Monedas inferiores al 50% al ras (14A) -->
  ${makeHalfCoinClean(196, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushL')}
  ${makeHalfCoinClean(316, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushR')}

  <!-- 2 NUEVAS MONEDAS EN LAS MARCAS ROJAS (r=11, micro brotes) -->
  ${makeCoinFull(212, 94, 11, 'url(#upperCoinShadow)')}
  ${makeCoinFull(300, 94, 11, 'url(#upperCoinShadow)')}

  <!-- Monedas Laterales -->
  ${makeCoinFull(148, 146, 27)}
  ${makeCoinFull(364, 146, 27)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 15D: TAMAÑO GRADUAL (r=15) FLOTANDO AL FRENTE DE LA CORONA
// - Dos nuevas monedas en cx=210, cy=92 y cx=302, cy=92 con r=15
// - Renderizadas por encima de las monedas laterales pero con sombra integrada
// =========================================================================
const svg15D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- Monedas Laterales -->
  ${makeCoinFull(148, 146, 27)}
  ${makeCoinFull(364, 146, 27)}

  <!-- 2 Monedas inferiores al 50% al ras (14A) -->
  ${makeHalfCoinClean(196, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushL')}
  ${makeHalfCoinClean(316, 150, 16, 150, 'url(#coinShadow)', 'clipTopFlushR')}

  <!-- 2 NUEVAS MONEDAS EN LAS MARCAS ROJAS (r=15, flotando al frente) -->
  ${makeCoinFull(210, 92, 15, 'url(#coinShadow)')}
  ${makeCoinFull(302, 92, 15, 'url(#coinShadow)')}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

const options = [
  { name: 'Opcion_15A_Fuente_Abundancia_MarcasRojas_Pequenas_r14', svg: svg15A },
  { name: 'Opcion_15B_Fuente_Abundancia_MarcasRojas_Medianas_r18', svg: svg15B },
  { name: 'Opcion_15C_Fuente_Abundancia_MarcasRojas_Micro_r11', svg: svg15C },
  { name: 'Opcion_15D_Fuente_Abundancia_MarcasRojas_Frente_r15', svg: svg15D }
];

async function run() {
  for (const opt of options) {
    fs.writeFileSync(path.join(hoyDir, `${opt.name}.svg`), opt.svg);
    fs.writeFileSync(path.join(baseDir, `${opt.name}.svg`), opt.svg);

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
