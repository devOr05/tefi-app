import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

function makeCoin(cx, cy, r, filter = 'url(#coinShadow)') {
  const dashR = Math.round(r * 0.8);
  const plusLen = Math.round(r * 0.45);
  const strokeW1 = Math.max(2.2, r * 0.20);
  const strokeW2 = Math.max(1.3, r * 0.12);
  const strokeBorder = Math.max(1.4, r * 0.08);
  return `
  <g filter="${filter}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${dashR}" fill="none" stroke="#78350F" stroke-width="0.75" stroke-dasharray="2 1.5" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  </g>`;
}

const defs = `
  <defs>
    <linearGradient id="bar4Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D287"/>
    </linearGradient>

    <linearGradient id="bar3Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>

    <linearGradient id="bar2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>

    <linearGradient id="bar1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#581C87"/>
    </linearGradient>

    <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#581C87" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#0284C7" stop-opacity="0.45"/>
      <stop offset="90%" stop-color="#14F195" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="#00FFA3" stop-opacity="1"/>
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
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.28"/>
    </filter>

    <filter id="bigCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#78350F" flood-opacity="0.32"/>
    </filter>
  </defs>
`;

const baseT = `
  <rect width="512" height="512" rx="128" fill="#FFFFFF"/>
  <rect width="508" height="508" x="2" y="2" rx="126" stroke="#E2E8F0" stroke-width="2"/>
  <g filter="url(#softShadow)">
    <path d="M238 445 L238 185 L256 165 L274 185 L274 445 Z" fill="url(#stemGrad)"/>
  </g>
  <g filter="url(#softShadow)">
    <path d="M212 445 L288 445 C297 445 303 438 305 430 L310 412 C312 404 306 397 298 397 H222 C214 397 207 404 205 412 L200 430 C198 438 204 445 212 445 Z" fill="url(#bar1Grad)"/>
    <path d="M192 375 L320 375 C329 375 336 368 338 360 L344 342 C346 334 340 327 332 327 H204 C195 327 188 334 186 342 L180 360 C178 368 184 375 192 375 Z" fill="url(#bar2Grad)"/>
    <path d="M162 300 L350 300 C360 300 368 293 370 284 L376 264 C378 255 372 247 363 247 H175 C165 247 157 254 155 263 L149 283 C147 292 153 300 162 300 Z" fill="url(#bar3Grad)"/>
    <path d="M100 215 L388 215 C402 215 412 205 416 192 L426 158 C430 144 420 130 405 130 L117 130 C103 130 93 140 89 153 L79 187 C75 201 85 215 100 215 Z" fill="url(#bar4Grad)"/>
  </g>
  <circle cx="418" cy="138" r="5" fill="#14F195"/>
`;

// =========================================================================
// OPCIÓN 10A: DIAGONAL MATEMÁTICA PURA (20% más chicas: r=10.5, 14.5, 19, 27)
// Los 4 centros están perfectamente colineales sobre una recta exacta y=f(x)
// =========================================================================
// Puntos en recta: (256, 421) ➔ (285, 351) ➔ (315, 274) ➔ (354, 172)
const svg10A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Barra 1: Moneda 1 (r=10.5) -->
  ${makeCoin(256, 421, 10.5)}

  <!-- Barra 2: Moneda 2 (r=14.5) -->
  ${makeCoin(285, 351, 14.5)}

  <!-- Barra 3: Moneda 3 (r=19) -->
  ${makeCoin(315, 274, 19)}

  <!-- Barra 4: Moneda 4 (r=27) - 20% más chica que los 34 de la 9C -->
  ${makeCoin(354, 172, 27, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 10B: DIAGONAL EQUIDISTANTE CON PASO CONSTANTE (Δx = 32px constante)
// Puntos: 256 ➔ 288 ➔ 320 ➔ 352 (Ritmo de avance perfectamente parejo)
// Monedas: r=11, r=14.5, r=19.5, r=27
// =========================================================================
const svg10B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Barra 1 (x=256, y=421, r=11) -->
  ${makeCoin(256, 421, 11)}

  <!-- Barra 2 (x=288, y=351, r=14.5) -->
  ${makeCoin(288, 351, 14.5)}

  <!-- Barra 3 (x=320, y=274, r=19.5) -->
  ${makeCoin(320, 274, 19.5)}

  <!-- Barra 4 (x=352, y=172, r=27) -->
  ${makeCoin(352, 172, 27, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 10C: DIAGONAL PARALELA AL ÁNGULO DE CORTE SOLANA (Inclinación ~18° idéntica al bisel)
// Se alinea con la arista de corte dinámica de la 'T' para máxima armonía formal
// Puntos: x=256, 282, 310, 344
// =========================================================================
const svg10C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Barra 1 (r=10) -->
  ${makeCoin(256, 421, 10)}

  <!-- Barra 2 (r=14) -->
  ${makeCoin(282, 351, 14)}

  <!-- Barra 3 (r=18.5) -->
  ${makeCoin(310, 274, 18.5)}

  <!-- Barra 4 (r=26) -->
  ${makeCoin(344, 172, 26, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 10D: DIAGONAL RECTA CON GUÍA SUTIL DE LUZ ASCENDENTE (Vector de Crecimiento)
// =========================================================================
const svg10D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- Trazo sutil de trayectoria de crecimiento -->
  <line x1="256" y1="421" x2="352" y2="172" stroke="#14F195" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.45"/>

  <!-- Barra 1 (r=10.5) -->
  ${makeCoin(256, 421, 10.5)}

  <!-- Barra 2 (r=14.5) -->
  ${makeCoin(288, 351, 14.5)}

  <!-- Barra 3 (r=19) -->
  ${makeCoin(320, 274, 19)}

  <!-- Barra 4 (r=27) -->
  ${makeCoin(352, 172, 27, 'url(#bigCoinShadow)')}
</svg>`;

async function run() {
  const options = [
    { id: 'Opcion_10A_Diagonal_Recta_Matematica_20Menos', svg: svg10A },
    { id: 'Opcion_10B_Diagonal_Paso_Equidistante_Armonica', svg: svg10B },
    { id: 'Opcion_10C_Diagonal_Paralela_Angulo_Solana', svg: svg10C },
    { id: 'Opcion_10D_Diagonal_Con_Guia_Vectorial', svg: svg10D }
  ];

  for (const opt of options) {
    const svgPath = path.join(baseDir, `${opt.id}.svg`);
    const pngPath = path.join(baseDir, `${opt.id}.png`);

    fs.writeFileSync(svgPath, opt.svg, 'utf8');
    await sharp(Buffer.from(opt.svg)).resize(1024, 1024).png().toFile(pngPath);

    // Copiar tambien en Imagenes_De_Hoy
    fs.copyFileSync(svgPath, path.join(hoyDir, `${opt.id}.svg`));
    fs.copyFileSync(pngPath, path.join(hoyDir, `${opt.id}.png`));

    console.log(`Generado y guardado en hoy: ${opt.id}`);
  }
}

run().catch(console.error);
