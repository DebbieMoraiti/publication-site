export interface ContactConfig {
  email: string;
  formEndpoint: string;
  honeypotField: string;
}

const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i;

export function validateContactConfig(config: ContactConfig): ContactConfig {
  const email = config.email.trim();
  const formEndpoint = config.formEndpoint.trim();
  const honeypotField = config.honeypotField.trim();
  if (email && !emailPattern.test(email)) {
    throw new Error('contact.email must be a single public editorial email address.');
  }
  if (formEndpoint) {
    try {
      const url = new URL(formEndpoint);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    } catch {
      throw new Error('contact.formEndpoint must be a public HTTPS POST endpoint without credentials, query parameters or a fragment.');
    }
  }
  if (!/^[a-z_][a-z0-9_-]{0,63}$/i.test(honeypotField) || ['name', 'email', 'subject', 'message'].includes(honeypotField)) {
    throw new Error('contact.honeypotField must be a separate, valid form field name.');
  }
  return { email, formEndpoint, honeypotField };
}

export function contactMailto(email: string, fields: { name: string; email: string; subject: string; message: string }): string {
  if (!emailPattern.test(email)) throw new Error('A public editorial email is required.');
  const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
  const body = `Name: ${oneLine(fields.name)}\r\nEmail: ${oneLine(fields.email)}\r\n\r\n${fields.message.trim()}`;
  const recipient = encodeURIComponent(email).replace(/%40/gi, '@');
  return `mailto:${recipient}?subject=${encodeURIComponent(oneLine(fields.subject))}&body=${encodeURIComponent(body)}`;
}
