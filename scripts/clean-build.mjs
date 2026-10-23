import { rm } from 'node:fs/promises';

// Removed and inactive routes must not survive a subsequent build.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
