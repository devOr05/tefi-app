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

// Moneda cortada a la mitad exacta (50% adentro de la T, 50% afuera) SIN NINGUNA RANURA
function makeHalfCoinClean(cx, cy, r, cutY, filter = 'url(#coinShadow)', clipId = 'clipClean') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.0, r * 0.20);
  const strokeW2 = Math.max(1.2, r * 0.12);
  const strokeBorder = Math.max(1.3, r * 0.08);
  return `
  <!-- Moneda entrando por la mitad al ras de la barra SIN ranura -->
  <g filter="${filter}" clip-path="url(#${clipId})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.8" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

const defs = `
  <defs>
    <!-- Clips al ras de la superficie de la barra verde (Y = 150) -->
    <clipPath id="clipFlushL_150">
      <rect x="100" y="50" width="200" height="100" />
    </clipPath>
    <clipPath id="clipFlushR_150">
      <rect x="250" y="50" width="200" height="100" />
    </clipPath>

    <!-- Clips un poquito más abajo (Y = 154) -->
    <clipPath id="clipFlushL_154">
      <rect x="100" y="50" width="200" height="104" />
    </clipPath>
    <clipPath id="clipFlushR_154">
      <rect x="250" y="50" width="200" height="104" />
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
// OPCIÓN 13A: ENTRADA FLUIDA Y DESPEJADA (Sin ranuras, monedas más bajas y 0.5cm más chicas)
// - Moneda grande intacta en el centro (cx=256, cy=115, r=44)
// - Monedas laterales bajadas a cy=145 y achicadas a r=26 (0.5cm menos), cx=148 y 364
// - Monedas chiquitas (r=16) en cx=193 y 319, centradas en el espacio libre
//   sumergidas al 50% al ras de la barra (cy=150) SIN ranuras
// =========================================================================
const svg13A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- Monedas chiquitas entrando al 50% al ras del borde verde (sin ranura) -->
  ${makeHalfCoinClean(193, 150, 16, 150, 'url(#coinShadow)', 'clipFlushL_150')}
  ${makeHalfCoinClean(319, 150, 16, 150, 'url(#coinShadow)', 'clipFlushR_150')}

  <!-- Monedas laterales bajadas y proporcionadas (r=26) -->
  ${makeCoinFull(148, 145, 26)}
  ${makeCoinFull(364, 145, 26)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 13B: DETRÁS DE LA BARRA (Emergiendo al 50% con profundidad natural)
// - Las dos monedas chiquitas se dibujan DETRÁS de la barra 4, por lo que la barra
//   tapa la mitad inferior limpiamente sin necesidad de ningún corte artificial ni ranura
// - Monedas laterales en cy=146, r=27, cx=150 y 362
// - Monedas chiquitas en cx=194 y 318, cy=150, r=16
// =========================================================================
const svg13B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}

  <!-- Monedas chiquitas dibujadas detrás de la barra (emergen 50% naturalmente) -->
  ${makeCoinFull(194, 150, 16)}
  ${makeCoinFull(318, 150, 16)}

  <!-- Barra 4 que oculta el 50% inferior -->
  ${bar4}

  <!-- Monedas laterales -->
  ${makeCoinFull(150, 146, 27)}
  ${makeCoinFull(362, 146, 27)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 13C: COMPRESIÓN MÁS PRÓXIMA (Espaciado más compacto y armónico)
// - Monedas laterales traídas un poco más hacia adentro (cx=156 y 356, cy=147, r=26)
// - Monedas chiquitas (r=15, cx=200 y 312, cy=150)
// - Cortadas al 50% limpio
// =========================================================================
const svg13C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}
  ${bar4}

  <!-- Monedas chiquitas al 50% entrando a la T -->
  ${makeHalfCoinClean(200, 150, 15, 150, 'url(#coinShadow)', 'clipFlushL_150')}
  ${makeHalfCoinClean(312, 150, 15, 150, 'url(#coinShadow)', 'clipFlushR_150')}

  <!-- Monedas laterales compactas -->
  ${makeCoinFull(156, 147, 26)}
  ${makeCoinFull(356, 147, 26)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 13D: DESCANSO EN LA BÓVEDA (Monedas ligeramente más hundidas 60% adentro)
// - Monedas laterales en cy=150, r=25, cx=152 y 360
// - Monedas chiquitas en cy=155 (asoman el 40% superior, dando mayor efecto de inmersión)
// - Todo sin ranuras, súper limpio y vectorial
// =========================================================================
const svg13D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${stemAndLowerBars}

  <!-- Monedas chiquitas emergiendo sutilmente detrás de la barra (cy=154, r=16) -->
  ${makeCoinFull(195, 154, 16)}
  ${makeCoinFull(317, 154, 16)}

  <!-- Barra 4 -->
  ${bar4}

  <!-- Monedas laterales descansando en la barra -->
  ${makeCoinFull(152, 150, 25)}
  ${makeCoinFull(360, 150, 25)}

  <!-- Gran Moneda Central Intacta -->
  ${makeCoinFull(256, 115, 44, 'url(#bigCoinShadow)')}
</svg>`;

const options = [
  { name: 'Opcion_13A_Fuente_Abundancia_SinRanuras_Despejada', svg: svg13A },
  { name: 'Opcion_13B_Fuente_Abundancia_DetrasDeBarra', svg: svg13B },
  { name: 'Opcion_13C_Fuente_Abundancia_Compacta_Armonica', svg: svg13C },
  { name: 'Opcion_13D_Fuente_Abundancia_Inmersion_Sutil', svg: svg13D }
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
