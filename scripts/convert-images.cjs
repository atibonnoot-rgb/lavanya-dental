const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

const images = [
  // public folder (served directly)
  { input: 'public/clinic-hero.png', output: 'public/clinic-hero.webp', quality: 82 },
  { input: 'public/logo.png', output: 'public/logo.webp', quality: 90 },
  // src/assets (bundled by Vite)
  { input: 'src/assets/logo.png', output: 'src/assets/logo.webp', quality: 90 },
];

async function convert() {
  for (const img of images) {
    const inputPath = path.join(root, img.input);
    const outputPath = path.join(root, img.output);
    if (!fs.existsSync(inputPath)) {
      console.warn('Skipping (not found):', inputPath);
      continue;
    }
    const before = fs.statSync(inputPath).size;
    await sharp(inputPath)
      .webp({ quality: img.quality, effort: 6 })
      .toFile(outputPath);
    const after = fs.statSync(outputPath).size;
    const saved = ((before - after) / before * 100).toFixed(1);
    console.log(`✓ ${img.output}  ${(before/1024).toFixed(0)} KiB → ${(after/1024).toFixed(0)} KiB  (-${saved}%)`);
  }
}

convert().catch(err => { console.error(err); process.exit(1); });
