import { moduleConfig, siteConfig } from '../config';

const endpoint = siteConfig.contact.formEndpoint.trim();
const audioPath = siteConfig.audio.src.trim();

if (endpoint && !/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
  throw new Error('contact.formEndpoint must be a Formspree HTTPS /f/ endpoint.');
}
if (audioPath && !/^\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(audioPath)) {
  throw new Error('audio.src must be a local /audio/ MP3, OGG or WAV path.');
}

export const formEndpoint = moduleConfig.features.contactForm ? endpoint : '';
export const audioSource = moduleConfig.features.audioIntro ? audioPath : '';
