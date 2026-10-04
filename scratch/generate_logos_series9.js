import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

function makeCoin(cx, cy, r, filter = 'url(#coinShadow)') {
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
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#78350F" flood-opacity="0.28"/>
    </filter>

    <filter id="bigCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#78350F" flood-opacity="0.35"/>
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
// OPCIÓN 9A: SÓLO LAS MONEDAS EN ESA LÍNEA CURVA (Mismo tamaño delicado r=16)
// =========================================================================
const svg9A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- 1. Moneda en Barra 1 (Base): Centro -->
  ${makeCoin(256, 421, 16)}

  <!-- 2. Moneda en Barra 2: Derecha -->
  ${makeCoin(292, 351, 16)}

  <!-- 3. Moneda en Barra 3: Más a la derecha -->
  ${makeCoin(324, 274, 16)}

  <!-- 4. Moneda en Barra 4: Ala derecha superior -->
  ${makeCoin(360, 172, 16)}
</svg>`;

// =========================================================================
// OPCIÓN 9B: EN ESA LÍNEA CURVA CON LA ÚLTIMA MONEDA MÁS GRANDE (r=35)
// =========================================================================
const svg9B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- 1. Moneda en Barra 1 (Base): Centro (r=15) -->
  ${makeCoin(256, 421, 15)}

  <!-- 2. Moneda en Barra 2: Derecha (r=15) -->
  ${makeCoin(292, 351, 15)}

  <!-- 3. Moneda en Barra 3: Más a la derecha (r=16) -->
  ${makeCoin(324, 274, 16)}

  <!-- 4. Moneda en Barra 4: LA ÚLTIMA MÁS GRANDE (r=35) -->
  ${makeCoin(356, 172, 35, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 9C: CRECIENDO EN CADA ESCALÓN DE MENOR A MAYOR (r=13 ➔ r=18 ➔ r=24 ➔ r=34)
// La moneda va expandiéndose progresivamente a medida que asciende por la curva
// =========================================================================
const svg9C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- 1. Barra 1 (r=13): Pequeño inicio -->
  ${makeCoin(256, 421, 13)}

  <!-- 2. Barra 2 (r=18): Creciendo -->
  ${makeCoin(292, 351, 18)}

  <!-- 3. Barra 3 (r=24): Mayor -->
  ${makeCoin(324, 274, 24)}

  <!-- 4. Barra 4 (r=34): La más grande en la cima -->
  ${makeCoin(356, 172, 34, 'url(#bigCoinShadow)')}
</svg>`;

// =========================================================================
// OPCIÓN 9D: DE MAYOR A MENOR (Literal "de mayor a menor" r=28 ➔ r=22 ➔ r=17 ➔ r=13)
// =========================================================================
const svg9D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  ${defs}
  ${baseT}

  <!-- 1. Barra 1: La mayor en la base (r=28) -->
  ${makeCoin(256, 421, 28, 'url(#bigCoinShadow)')}

  <!-- 2. Barra 2: Mediana (r=22) -->
  ${makeCoin(292, 351, 22)}

  <!-- 3. Barra 3: Menor (r=17) -->
  ${makeCoin(324, 274, 17)}

  <!-- 4. Barra 4: La más pequeña en la punta (r=13) -->
  ${makeCoin(360, 172, 13)}
</svg>`;

async function run() {
  const options = [
    { id: 'Opcion_9A_Linea_Curva_Monedas_Iguales', svg: svg9A },
    { id: 'Opcion_9B_Linea_Curva_Ultima_Mas_Grande', svg: svg9B },
    { id: 'Opcion_9C_Linea_Curva_Creciendo_Menor_A_Mayor', svg: svg9C },
    { id: 'Opcion_9D_Linea_Curva_De_Mayor_A_Menor', svg: svg9D }
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
