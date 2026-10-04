import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\kavay\\Desktop\\Opciones_Logo_Tefi\\Imagenes_De_Hoy';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

// Sort files to put latest options first
files.sort((a, b) => {
  return b.localeCompare(a);
});

const cards = files.map(f => {
  return `
    <div style="background: white; border-radius: 20px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; border: 1px solid #f1f5f9;">
      <div style="background: #f8fafc; border-radius: 16px; padding: 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; min-height: 220px;">
        <img src="${f}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 12px;" />
      </div>
      <div style="font-weight: 800; font-size: 13px; color: #0f172a; word-break: break-all; margin-bottom: 6px;">${f}</div>
      <a href="${f}" target="_blank" style="display: inline-block; padding: 6px 14px; background: #9945FF; color: white; border-radius: 10px; font-size: 11px; font-weight: bold; text-decoration: none; margin-top: 4px;">Abrir en Grande</a>
    </div>
  `;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Galería de Opciones de Logo - Tefi (Hoy)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 24px; color: #1e293b; }
    h1 { font-size: 26px; font-weight: 900; margin-bottom: 8px; color: #0f172a; }
    p { font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
  </style>
</head>
<body>
  <h1>🎨 Tefi • Catálogo Visual de Opciones de Logo</h1>
  <p>Todas las imágenes generadas hoy, organizadas para comparar fácilmente.</p>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(dir, 'Galeria_De_Hoy.html'), html, 'utf8');
console.log('Galeria_De_Hoy.html creada');
