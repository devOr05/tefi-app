import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

function makeCoinFull(cx, cy, r, filter = 'url(#coinShadow)') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.4, r * 0.20);
  const strokeW2 = Math.max(1.4, r * 0.12);
  const strokeBorder = Math.max(1.5, r * 0.08);
  return `
  <g filter="${filter}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

// Moneda cortada a la mitad (entrando por la ranura / superficie de la T)
function makeHalfEnteringCoin(cx, cy, r, filter = 'url(#coinShadow)', clipId = 'halfClip') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.4, r * 0.20);
  const strokeW2 = Math.max(1.4, r * 0.12);
  const strokeBorder = Math.max(1.5, r * 0.08);
  return `
  <!-- Moneda entrando por la mitad en la T -->
  <g filter="${filter}">
    <!-- Parte superior visible que sobresale de la ranura -->
    <g clip-path="url(#${clipId})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
      <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
      <path d="M${cx - plusLen} ${cy - 2} H${cx + plusLen} M${cx} ${cy - plusLen - 2} V${cy + plusLen - 2}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
      <path d="M${cx - plusLen} ${cy - 2} H${cx + plusLen} M${cx} ${cy - plusLen - 2} V${cy + plusLen - 2}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
    </g>
    <!-- Ranura / Slot horizontal donde entra la moneda -->
    <rect x="${cx - r - 4}" y="${cy - 1}" width="${(r + 4) * 2}" height="5" rx="2.5" fill="#064E3B" stroke="#A7F3D0" stroke-width="1" opacity="0.85"/>
  </g>`;
}

const defs = `
  <defs>
    <!-- Clip-path para mostrar solo la mitad superior de la moneda entrando -->
    <clipPath id="halfClipL">
      <rect x="150" y="100" width="100" height="66" />
    </clipPath>
    <clipPath id="halfClipR">
      <rect x="270" y="100" width="100" height="66" />
    </clipPath>

    <clipPath id="halfClipL_Deep">
      <rect x="150" y="110" width="100" height="68" />
    </clipPath>
    <clipPath id="halfClipR_Deep">
      <rect x="270" y="110" width="100" height="68" />
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
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#78350F" flood-opacity="0.30"/>
    </filter>

    <filter id="bigCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#78350F" flood-opacity="0.35"/>
    </filter>

    <filter id="glowCyan" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#14F195" flood-opacity="0.40"/>
    </filter>
  </defs>
`;

const baseT = `
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>

  <!-- TALLO VERTICAL ASCENDENTE -->
  <g filter="url(#softShadow)">
    <rect x="238" y="215" width="36" height="240" rx="18" fill="url(#stemGrad)"/>
  </g>

  <!-- LAS 4 BARRAS HORIZONTALES SOLANA (Idénticas a la Opción 4C) -->
  <g filter="url(#softShadow)">
    <!-- Barra 1 Base (110px) -->
    <path d="M210 455 L292 455 C301 455 307 448 309 440 L314 420 C316 412 310 405 302 405 H220 C211 405 205 412 203 420 L198 440 C196 448 202 455 210 455 Z" fill="url(#bar1Grad)"/>

    <!-- Barra 2 (150px) -->
    <path d="M190 385 L322 385 C331 385 338 378 340 370 L346 350 C348 342 342 335 334 335 H202 C193 335 186 342 184 350 L178 370 C176 378 182 385 190 385 Z" fill="url(#bar2Grad)"/>

    <!-- Barra 3 (205px) -->
    <path d="M162 312 L350 312 C360 312 368 305 370 296 L376 276 C378 267 372 259 363 259 H175 C165 259 157 266 155 275 L149 295 C147 304 153 312 162 312 Z" fill="url(#bar3Grad)"/>

    <!-- Barra 4 Superior Grande (350px) -->
    <path d="M100 235 L388 235 C402 235 412 225 416 212 L426 178 C430 164 420 150 405 150 L117 150 C103 150 93 160 89 173 L79 207 C75 221 85 235 100 235 Z" fill="url(#bar4Grad)" filter="url(#glowCyan)"/>
  </g>
  <circle cx="418" cy="158" r="5" fill="#14F195"/>
`;

// =========================================================================
// OPCIÓN 11A: FUENTE DE LA ABUNDANCIA • RANURAS DE DEPÓSITO
// - 3 Monedas de arriba más espaciadas (cx=142, 256, 370)
// - 2 Monedas chiquitas (r=21) entrando en la T por la mitad (cx=199 y 313)
// - Ranura tecnológica limpia con brillo verde neón
// =========================================================================
const svg11A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- LAS DOS MONEDAS CHIQUITAS ENTRANDO EN LA T POR LA MITAD -->
  ${makeHalfEnteringCoin(199, 166, 21, 'url(#coinShadow)', 'halfClipL')}
  ${makeHalfEnteringCoin(313, 166, 21, 'url(#coinShadow)', 'halfClipR')}

  <!-- LAS TRES MONEDAS DE ARRIBA CON MÁS ESPACIO ENTRE ELLAS -->
  <!-- Moneda Izquierda (cx=142, cy=135, r=33) -->
  ${makeCoinFull(142, 135, 33)}

  <!-- Moneda Derecha (cx=370, cy=135, r=33) -->
  ${makeCoinFull(370, 135, 33)}

  <!-- Gran Moneda Central en la Cima (cx=256, cy=115, r=44) -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 11B: FUENTE DE LA ABUNDANCIA • INMERSIÓN EN EL RESERVORIO (SEMI-TRANSLÚCIDA)
// - La mitad inferior de las dos monedas pequeñas se sumerge dentro de la barra verde/cian
//   con un sutil resplandor de liquidez
// =========================================================================
const svg11B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Fondo de las dos monedas entrando (parte sumergida con transparencia en la barra) -->
  <g opacity="0.45" filter="url(#glowCyan)">
    <circle cx="199" cy="170" r="20" fill="url(#goldGrad)" stroke="#14F195" stroke-width="1.5"/>
    <circle cx="313" cy="170" r="20" fill="url(#goldGrad)" stroke="#14F195" stroke-width="1.5"/>
  </g>

  <!-- Parte que sobresale y slot -->
  ${makeHalfEnteringCoin(199, 170, 20, 'url(#coinShadow)', 'halfClipL_Deep')}
  ${makeHalfEnteringCoin(313, 170, 20, 'url(#coinShadow)', 'halfClipR_Deep')}

  <!-- Las 3 monedas superiores con generosa separación -->
  ${makeCoinFull(144, 136, 32)}
  ${makeCoinFull(368, 136, 32)}
  ${makeCoinFull(256, 116, 43, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 11C: FUENTE DE LA ABUNDANCIA • LÍNEA DE ENTRADA CORRIDA (COMO TU DIBUJO ROJO)
// La línea horizontal en la barra con las dos monedas ingresando por la mitad
// =========================================================================
const svg11C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Línea horizontal de corte / ranura corrida en la barra superior (como dibujaste en rojo) -->
  <line x1="140" y1="166" x2="372" y2="166" stroke="#065F46" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <line x1="140" y1="167" x2="372" y2="167" stroke="#A7F3D0" stroke-width="1" stroke-linecap="round" opacity="0.8"/>

  <!-- Dos monedas chiquitas entrando por la mitad en la línea -->
  ${makeHalfEnteringCoin(199, 166, 22, 'url(#coinShadow)', 'halfClipL')}
  ${makeHalfEnteringCoin(313, 166, 22, 'url(#coinShadow)', 'halfClipR')}

  <!-- Las tres monedas arriba bien separadas -->
  ${makeCoinFull(140, 134, 34)}
  ${makeCoinFull(372, 134, 34)}
  ${makeCoinFull(256, 112, 45, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 11D: FUENTE DE LA ABUNDANCIA • ARMONÍA GEOMÉTRICA PURA
// - Monedas entrando ligeramente anguladas acompañando la dinámica de la T
// =========================================================================
const svg11D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Ranuras individuales esculpidas con precisión -->
  <g filter="url(#glowCyan)">
    <rect x="175" y="163" width="48" height="6" rx="3" fill="#047857" stroke="#6EE7B7" stroke-width="1.2"/>
    <rect x="289" y="163" width="48" height="6" rx="3" fill="#047857" stroke="#6EE7B7" stroke-width="1.2"/>
  </g>

  <!-- Dos monedas chiquitas entrando por la mitad -->
  <g clip-path="url(#halfClipL)">
    ${makeCoinFull(199, 164, 21, 'url(#coinShadow)')}
  </g>
  <g clip-path="url(#halfClipR)">
    ${makeCoinFull(313, 164, 21, 'url(#coinShadow)')}
  </g>

  <!-- 3 Monedas superiores amplias -->
  ${makeCoinFull(138, 134, 33)}
  ${makeCoinFull(374, 134, 33)}
  ${makeCoinFull(256, 114, 44, 'url(#bigCoinShadow)')}
</svg>`;

async function run() {
  const options = [
    { id: 'Opcion_11A_Fuente_Abundancia_Ranuras_Deposito', svg: svg11A },
    { id: 'Opcion_11B_Fuente_Abundancia_Inmersion_Reservorio', svg: svg11B },
    { id: 'Opcion_11C_Fuente_Abundancia_Ranura_Corrida', svg: svg11C },
    { id: 'Opcion_11D_Fuente_Abundancia_Armonia_Esculpida', svg: svg11D }
  ];

  for (const opt of options) {
    const svgPath = path.join(baseDir, `${opt.id}.svg`);
    const pngPath = path.join(baseDir, `${opt.id}.png`);

    fs.writeFileSync(svgPath, opt.svg, 'utf8');
    await sharp(Buffer.from(opt.svg)).resize(1024, 1024).png().toFile(pngPath);

    // Copiar tambien en Imagenes_De_Hoy
    fs.copyFileSync(svgPath, path.join(hoyDir, `${opt.id}.svg`));
    fs.copyFileSync(pngPath, path.join(hoyDir, `${opt.id}.png`));

    console.log(`Generado: ${opt.id}`);
  }
}

run().catch(console.error);
