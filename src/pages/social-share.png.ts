import type { APIRoute } from 'astro';
import sharp from 'sharp';
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
    <rect x="84" y="92" width="120" height="9" rx="4" fill="${escapeXml(themeConfig.colors.accent)}" />
    <text x="84" y="310" font-family="Arial, DejaVu Sans, sans-serif" font-size="${fontSize}" font-weight="700" fill="${escapeXml(themeConfig.colors.text)}"${fitName}>${escapeXml(name)}</text>
    <text x="84" y="408" font-family="Arial, DejaVu Sans, sans-serif" font-size="30" fill="${escapeXml(themeConfig.colors.textMuted)}">${escapeXml(tagline.slice(0, 65))}</text>
    <rect x="84" y="532" width="1032" height="1" fill="${escapeXml(themeConfig.colors.border)}" />
  </svg>`;
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/png' },
  });
};
