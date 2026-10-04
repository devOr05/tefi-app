import fs from 'fs';
import sharp from 'sharp';

const sourceSvgPath = 'C:/Users/kavay/Desktop/Opciones_Logo_Tefi/Opcion_10A_Diagonal_Recta_Matematica_20Menos.svg';
const svgContent = fs.readFileSync(sourceSvgPath, 'utf8');

// Target paths
const publicIconSvg = 'C:/Users/kavay/.gemini/antigravity/scratch/tefi-app/public/icon.svg';
const publicPwaPng = 'C:/Users/kavay/.gemini/antigravity/scratch/tefi-app/public/pwa-512x512.png';
const publicLogoJpg = 'C:/Users/kavay/.gemini/antigravity/scratch/tefi-app/public/logo.jpg';

const desktopSvg = 'C:/Users/kavay/Desktop/Tefi_Logo_Oficial.svg';
const desktopPng = 'C:/Users/kavay/Desktop/Tefi_Logo_Oficial.png';

async function updateAll() {
  // 1. Write SVG to public/icon.svg
  fs.writeFileSync(publicIconSvg, svgContent, 'utf8');
  console.log('Actualizado public/icon.svg');

  // 2. Write SVG to Desktop
  fs.writeFileSync(desktopSvg, svgContent, 'utf8');
  console.log('Actualizado Desktop/Tefi_Logo_Oficial.svg');

  // 3. Generate pwa-512x512.png
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(publicPwaPng);
  console.log('Actualizado public/pwa-512x512.png');

  // 4. Generate logo.jpg (512x512, white background)
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: 95 })
    .toFile(publicLogoJpg);
  console.log('Actualizado public/logo.jpg');

  // 5. Generate high-res 1024x1024 PNG on Desktop
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile(desktopPng);
  console.log('Actualizado Desktop/Tefi_Logo_Oficial.png');
}

updateAll().catch(console.error);
