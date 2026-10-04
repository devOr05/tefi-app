import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sourceSvgPath = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi\\Imagenes_De_Hoy\\Opcion_17B_Fuente_Abundancia_Centrada_PuntoRojo_r19.svg';
const svgContent = fs.readFileSync(sourceSvgPath, 'utf8');

const appPublicDir = path.resolve('public');
const desktopDir = 'C:\\Users\\kavay\\Desktop';
const opcionesDir = path.join(desktopDir, 'Opciones_Logo_Tefi');
const hoyDir = path.join(opcionesDir, 'Imagenes_De_Hoy');

async function applyOfficialLogo() {
  console.log('1. Guardando SVGs oficiales...');
  fs.writeFileSync(path.join(appPublicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(desktopDir, 'Tefi_Logo_Oficial.svg'), svgContent);
  fs.writeFileSync(path.join(opcionesDir, 'Tefi_Logo_Oficial.svg'), svgContent);
  fs.writeFileSync(path.join(hoyDir, 'Tefi_Logo_Oficial_17B.svg'), svgContent);

  console.log('2. Renderizando PNGs y JPGs oficiales...');
  const svgBuffer = Buffer.from(svgContent);

  // 1024x1024 Desktop PNG
  const png1024 = await sharp(svgBuffer).resize(1024, 1024).png({ quality: 100 }).toBuffer();
  fs.writeFileSync(path.join(desktopDir, 'Tefi_Logo_Oficial.png'), png1024);
  fs.writeFileSync(path.join(opcionesDir, 'Tefi_Logo_Oficial.png'), png1024);
  fs.writeFileSync(path.join(hoyDir, 'Tefi_Logo_Oficial_17B.png'), png1024);

  // 512x512 PWA Icon
  const png512 = await sharp(svgBuffer).resize(512, 512).png({ quality: 100 }).toBuffer();
  fs.writeFileSync(path.join(appPublicDir, 'pwa-512x512.png'), png512);

  // 512x512 JPEG for logo.jpg
  const jpg512 = await sharp(svgBuffer).resize(512, 512).flatten({ background: '#FFFFFF' }).jpeg({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(appPublicDir, 'logo.jpg'), jpg512);

  console.log('3. Sincronizando todas las imágenes de hoy en Imagenes_De_Hoy...');
  const allOpciones = fs.readdirSync(opcionesDir);
  for (const file of allOpciones) {
    if (file.endsWith('.png') || file.endsWith('.svg')) {
      const src = path.join(opcionesDir, file);
      const dst = path.join(hoyDir, file);
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
  }

  console.log('¡Logo oficial 17B aplicado con éxito en todos los destinos!');
}

applyOfficialLogo().catch(console.error);
