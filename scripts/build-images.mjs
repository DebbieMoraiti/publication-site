import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public/uploads');
const output = path.resolve('public/_generated-images');
const manifestPath = path.resolve('src/generated/images.json');
const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const widths = [480, 960, 1440];
const maxBytes = 12 * 1024 * 1024;
const maxPixels = 40_000_000;
const manifest = {};

// Generated files are build artifacts. Always discard old variants first.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

async function visit(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isSymbolicLink()) throw new Error(`Image uploads cannot contain symlinks: ${file}`);
    if (item.isDirectory()) { await visit(file); continue; }
    if (!item.isFile() || !allowed.has(path.extname(item.name).toLowerCase())) continue;

    const { size } = await stat(file);
    if (size > maxBytes) throw new Error(`Image exceeds 12 MB: ${file}`);
    const bytes = await readFile(file);
    const metadata = await sharp(bytes, { limitInputPixels: maxPixels }).metadata();
    if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp', 'avif'].includes(metadata.format)) {
      throw new Error(`Invalid image data: ${file}`);
    }
    const orientedWidth = [5, 6, 7, 8].includes(metadata.orientation ?? 1) ? metadata.height : metadata.width;
    const orientedHeight = [5, 6, 7, 8].includes(metadata.orientation ?? 1) ? metadata.width : metadata.height;
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const relative = path.relative(root, file).split(path.sep).join('/');
    const variants = {};
    for (const format of ['avif', 'webp']) {
      variants[format] = [];
      for (const width of [...new Set([...widths.filter((value) => value < orientedWidth), orientedWidth])]) {
        const name = `${hash}-${width}.${format}`;
        await sharp(bytes, { limitInputPixels: maxPixels })
          .rotate().resize({ width, withoutEnlargement: true })
          .toFormat(format, { quality: format === 'avif' ? 55 : 76 })
          .toFile(path.join(output, name));
        variants[format].push({ width, src: `/_generated-images/${name}` });
      }
    }
    manifest[`/uploads/${relative}`] = { width: orientedWidth, height: orientedHeight, ...variants };
  }
}

try { await visit(root); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${Object.keys(manifest).length} image(s).`);
