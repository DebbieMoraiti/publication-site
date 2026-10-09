import assert from 'node:assert/strict';
import { contactMailto, validateContactConfig } from '../src/lib/contact.ts';

const empty = { email: '', formEndpoint: '', honeypotField: 'website' };
assert.deepEqual(validateContactConfig(empty), empty);
assert.deepEqual(validateContactConfig({ ...empty, email: ' editorial@example.invalid ' }), { ...empty, email: 'editorial@example.invalid' });
assert.equal(validateContactConfig({ ...empty, formEndpoint: 'https://forms.example.invalid/contact' }).formEndpoint, 'https://forms.example.invalid/contact');

for (const email of ['person@example.invalid\r\nBcc: other@example.invalid', 'one@example.invalid,two@example.invalid', 'mailto:person@example.invalid']) {
  assert.throws(() => validateContactConfig({ ...empty, email }), /public editorial email/);
}
for (const formEndpoint of ['http://forms.example.invalid/contact', 'https://secret@forms.example.invalid/contact', 'https://forms.example.invalid/contact?api_key=secret', 'https://forms.example.invalid/contact#secret', 'javascript:alert(1)']) {
  assert.throws(() => validateContactConfig({ ...empty, formEndpoint }), /public HTTPS POST endpoint/);
}
for (const honeypotField of ['email', 'message', 'subject', 'name', 'bad field']) {
  assert.throws(() => validateContactConfig({ ...empty, honeypotField }), /separate, valid form field/);
}

const draft = new URL(contactMailto('editorial+stories@example.invalid', {
  name: 'Reader\r\nAnother line', email: 'reader@example.invalid',
  subject: 'Θέμα & idea\r\nBcc: other@example.invalid', message: 'Hello & γεια!\nA second paragraph.',
}));
assert.equal(draft.protocol, 'mailto:');
assert.equal(decodeURIComponent(draft.pathname), 'editorial+stories@example.invalid');
assert.deepEqual([...draft.searchParams.keys()], ['subject', 'body']);
assert.equal(draft.searchParams.get('subject'), 'Θέμα & idea Bcc: other@example.invalid');
assert.equal(draft.searchParams.get('body'), 'Name: Reader Another line\r\nEmail: reader@example.invalid\r\n\r\nHello & γεια!\nA second paragraph.');
assert.throws(() => contactMailto('', { name: '', email: '', subject: '', message: '' }), /public editorial email/);
console.log('Contact configuration and mailto safety audit passed.');
