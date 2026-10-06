import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('dist/uploads');
const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const maxPixels = 40_000_000;

async function sanitize(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      await sanitize(file);
      continue;
    }
    if (!entry.isFile() || !allowed.has(path.extname(entry.name).toLowerCase())) continue;

    const extension = path.extname(entry.name).toLowerCase();
    const format = extension === '.jpg' || extension === '.jpeg' ? 'jpeg' : extension.slice(1);
    const temporary = `${file}.metadata-clean`;

    try {
      await sharp(file, { limitInputPixels: maxPixels })
        .rotate()
        .toFormat(format)
        .toFile(temporary);
      await rename(temporary, file);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}

try {
  await mkdir(root, { recursive: false });
  await sanitize(root);
} catch (error) {
  if (error?.code !== 'EEXIST' && error?.code !== 'ENOENT') throw error;
  if (error?.code === 'EEXIST') await sanitize(root);
}

console.log('Sanitized deployed uploads: EXIF/GPS and other image metadata removed.');
