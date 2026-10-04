import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const baseDir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi';
const hoyDir = path.join(baseDir, 'Imagenes_De_Hoy');

// Función que dibuja una moneda dorada amarilla con cruz blanca
function drawGoldCoin(cx, cy, r) {
  const plusLen = Math.max(1.5, Math.round(r * 0.45));
  const strokeW1 = Math.max(1.8, r * 0.22);
  const strokeW2 = Math.max(1.0, r * 0.14);
  const strokeBorder = Math.max(1.0, r * 0.10);
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#navGoldGrad)" stroke="#FEF08A" stroke-width="${strokeBorder}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="none" stroke="#78350F" stroke-width="0.5" stroke-dasharray="1 1" opacity="0.35"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#78350F" stroke-width="${strokeW1}" stroke-linecap="round"/>
    <path d="M${cx - plusLen} ${cy} H${cx + plusLen} M${cx} ${cy - plusLen} V${cy + plusLen}" stroke="#FFFFFF" stroke-width="${strokeW2}" stroke-linecap="round"/>
  `;
}

const defs = `
  <defs>
    <linearGradient id="navGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="45%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="navCoinShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#78350F" flood-opacity="0.25"/>
    </filter>
  </defs>
`;

// Opción 1: Alineadas por la base horizontal (y=18)
const groupOpt1 = `
  <g filter="url(#navCoinShadow)">
    ${drawGoldCoin(5, 14.5, 3.5)}
    ${drawGoldCoin(12.5, 13.0, 5.0)}
    ${drawGoldCoin(21, 11.2, 6.8)}
  </g>
`;

// Opción 2: Alineadas por el centro horizontal (cy=12)
const groupOpt2 = `
  <g filter="url(#navCoinShadow)">
    ${drawGoldCoin(5, 12, 3.5)}
    ${drawGoldCoin(12.5, 12, 5.0)}
    ${drawGoldCoin(21, 12, 6.8)}
  </g>
`;

// Opción 3: Con sutil solapamiento horizontal (stack)
const groupOpt3 = `
  <g filter="url(#navCoinShadow)">
    ${drawGoldCoin(6, 12.5, 3.8)}
    ${drawGoldCoin(12.5, 12, 5.2)}
    ${drawGoldCoin(20.5, 11.5, 6.8)}
  </g>
`;

// Opción 4: Separadas y compactas (cy=12, proporciones más definidas)
const groupOpt4 = `
  <g filter="url(#navCoinShadow)">
    ${drawGoldCoin(5, 12, 3.2)}
    ${drawGoldCoin(12.5, 12, 4.8)}
    ${drawGoldCoin(21, 12, 6.5)}
  </g>
`;

// Crear un panel comparativo de cómo se ven en la barra de navegación real
function createComparisonSvg() {
  return `
  <svg width="1000" height="700" viewBox="0 0 1000 700" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="1000" height="700" rx="32" fill="#F8FAFC"/>
    
    <text x="500" y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#0F172A">
      Opciones para el Botón "Score &amp; Límite" (Monedas Amarillas en Línea)
    </text>
    <text x="500" y="95" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#64748B">
      Tres monedas doradas creciendo de menor a mayor en la misma línea horizontal
    </text>

    <!-- CARD 1 -->
    <g transform="translate(60, 140)">
      <rect width="400" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="24" y="40" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#1E293B">
        Opción A: Base Alineada
      </text>
      <text x="24" y="65" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">
        Apoyadas sobre el mismo piso, crecen hacia arriba
      </text>
      
      <!-- Simulación Nav Item -->
      <g transform="translate(160, 95) scale(2.8)">
        ${groupOpt1}
      </g>
      <text x="200" y="195" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#2563EB">
        Score &amp; Límite
      </text>
    </g>

    <!-- CARD 2 -->
    <g transform="translate(540, 140)">
      <rect width="400" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="24" y="40" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#1E293B">
        Opción B: Centro Alineado (Equidistante) ⭐
      </text>
      <text x="24" y="65" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">
        Centradas en el mismo eje medio horizontal
      </text>
      
      <!-- Simulación Nav Item -->
      <g transform="translate(160, 95) scale(2.8)">
        ${groupOpt2}
      </g>
      <text x="200" y="195" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#2563EB">
        Score &amp; Límite
      </text>
    </g>

    <!-- CARD 3 -->
    <g transform="translate(60, 410)">
      <rect width="400" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="24" y="40" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#1E293B">
        Opción C: Solapamiento Dinámico (Stack)
      </text>
      <text x="24" y="65" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">
        Ligero relieve tridimensional superpuesto
      </text>
      
      <!-- Simulación Nav Item -->
      <g transform="translate(160, 95) scale(2.8)">
        ${groupOpt3}
      </g>
      <text x="200" y="195" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#2563EB">
        Score &amp; Límite
      </text>
    </g>

    <!-- CARD 4 -->
    <g transform="translate(540, 410)">
      <rect width="400" height="230" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <text x="24" y="40" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#1E293B">
        Opción D: Espaciadas Nítidas
      </text>
      <text x="24" y="65" font-family="system-ui, sans-serif" font-size="13" fill="#64748B">
        Separadas con claridad y alto contraste
      </text>
      
      <!-- Simulación Nav Item -->
      <g transform="translate(160, 95) scale(2.8)">
        ${groupOpt4}
      </g>
      <text x="200" y="195" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#2563EB">
        Score &amp; Límite
      </text>
    </g>
  </svg>
  `;
}

async function run() {
  const comparisonSvg = createComparisonSvg();
  const compPng = await sharp(Buffer.from(comparisonSvg)).png().toBuffer();

  const outSvg = path.join(hoyDir, 'Opciones_Boton_Score_Monedas_Amarillas.svg');
  const outPng = path.join(hoyDir, 'Opciones_Boton_Score_Monedas_Amarillas.png');

  fs.writeFileSync(outSvg, comparisonSvg);
  fs.writeFileSync(outPng, compPng);
  fs.writeFileSync(path.join(baseDir, 'Opciones_Boton_Score_Monedas_Amarillas.png'), compPng);

  console.log('Comparativa generada: Opciones_Boton_Score_Monedas_Amarillas.png');
}

run().catch(console.error);
