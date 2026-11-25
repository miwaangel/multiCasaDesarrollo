/**
 * Optimiza las fotos de los seeders (backend/uploads/seed/*.jpg) en su lugar:
 * máximo 1280 px por lado, JPEG progresivo (mozjpeg, calidad 72) y sin metadatos.
 * Conserva los nombres, así que no hay que volver a correr los seeders.
 * Solo reemplaza una foto si la versión nueva pesa menos.
 *
 *   npm run optimizar:seed
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '../uploads/seed');
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const fotos = fs.readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f)).sort();
  let antes = 0;
  let despues = 0;

  for (const foto of fotos) {
    const ruta = path.join(DIR, foto);
    const original = fs.readFileSync(ruta);
    const optimizada = await sharp(original)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true, progressive: true })
      .toBuffer();

    const final = optimizada.length < original.length ? optimizada : original;
    if (final === optimizada) fs.writeFileSync(ruta, optimizada);
    antes += original.length;
    despues += final.length;
    console.log(`${foto.padEnd(16)} ${kb(original.length).padStart(7)} → ${kb(final.length).padStart(7)}`);
  }

  console.log(`\n${fotos.length} fotos: ${kb(antes)} → ${kb(despues)} (${Math.round((1 - despues / antes) * 100)}% menos)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
