// The beacon token is a public site identifier, not an account credential.
// Previews and local development must never contribute production statistics.
(() => {
  if (location.protocol !== 'https:' || !['storyfields.gr', 'www.storyfields.gr'].includes(location.hostname)) return;
  if (document.querySelector('script[data-cf-beacon]')) return;
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: 'aa17bcd1cab7417b93b1e127a7c56302' }));
  document.body.append(beacon);
})();
