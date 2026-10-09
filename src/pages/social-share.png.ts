import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { siteConfig, themeConfig } from '../config';
import type { LanguageCode } from '../i18n/routes';

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]!);

export const GET: APIRoute = async () => {
  const name = siteConfig.identity.name.trim();
  const tagline = siteConfig.identity.tagline?.[siteConfig.localization.defaultLanguage as LanguageCode]?.trim() ?? '';
  const fontSize = Math.max(36, Math.min(96, Math.floor(1700 / Math.max(name.length, 10))));
  const fitName = name.length > 22 ? ' textLength="1032" lengthAdjust="spacingAndGlyphs"' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${escapeXml(themeConfig.colors.background)}" />
    <path d="M84 126H1116 M84 132H1116 M84 498H1116 M84 504H1116" stroke="${escapeXml(themeConfig.colors.text)}" stroke-width="1" />
    <text x="600" y="94" text-anchor="middle" font-family="Georgia, DejaVu Serif, serif" font-size="18" letter-spacing="4" fill="${escapeXml(themeConfig.colors.textMuted)}">INDEPENDENT PUBLICATION</text>
    ${siteConfig.branding.logo ? '' : `<text x="600" y="310" text-anchor="middle" font-family="Georgia, DejaVu Serif, serif" font-size="${fontSize}" font-weight="700" fill="${escapeXml(themeConfig.colors.text)}"${fitName}>${escapeXml(name)}</text>`}
    <text x="600" y="421" text-anchor="middle" font-family="Georgia, DejaVu Serif, serif" font-size="28" font-style="italic" fill="${escapeXml(themeConfig.colors.textMuted)}">${escapeXml(tagline.slice(0, 65))}</text>
    <text x="600" y="550" text-anchor="middle" font-family="Georgia, DejaVu Serif, serif" font-size="18" letter-spacing="2" fill="${escapeXml(themeConfig.colors.textMuted)}">${escapeXml(new URL(siteConfig.seo.siteUrl).hostname.toUpperCase())}</text>
  </svg>`;
  const canvas = sharp(Buffer.from(svg));
  if (siteConfig.branding.logo) {
    const logoPath = path.join('public', siteConfig.branding.logo.replace(/^\/+/, ''));
    const wordmark = await sharp(await readFile(logoPath)).resize({ width: 1032 }).png().toBuffer();
    canvas.composite([{ input: wordmark, left: 84, top: 215 }]);
  }
  const image = await canvas.png().toBuffer();
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/png' },
  });
};
