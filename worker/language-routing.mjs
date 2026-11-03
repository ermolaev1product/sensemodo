// Country is supplied by the existing hosting edge. No IP address is read,
// stored or sent to an external geolocation provider.
export const languages = ['en', 'ru', 'sr', 'es', 'de', 'pt-BR'];
export function countryLanguage(country) {
  return ({ RU: 'ru', GE: 'ru', AM: 'ru', RS: 'sr', ES: 'es', DE: 'de', BR: 'pt-BR' })[String(country || '').toUpperCase()] || 'en';
}
export function preferenceCookie(language) {
  return `sensemodo_lang=${language}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}
export function languageRedirect(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const neutral = new Map([['/', false], ['/index.html', false], ['/referral', true], ['/referral/', true], ['/referral.html', true]]);
  if (!neutral.has(url.pathname)) return null; // Explicit localized links win.
  const query = url.searchParams.get('lang');
  const saved = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith('sensemodo_lang='))?.slice(15);
  const country = request.cf?.country || request.headers.get('cf-ipcountry');
  const language = languages.includes(query) ? query : languages.includes(saved) ? saved : countryLanguage(country);
  url.pathname = `/${language}${neutral.get(url.pathname) ? '/referral' : '/'}`;
  url.searchParams.delete('lang');
  const headers = new Headers({ Location: url.href, 'Cache-Control': 'private, no-store', Vary: 'Cookie, CF-IPCountry' });
  if (languages.includes(query)) headers.set('Set-Cookie', preferenceCookie(language));
  return new Response(null, { status: 302, headers });
}

// Static assets may be served before a Worker on the production host. This
// same-origin endpoint supplies only a language code, never the visitor IP.
export function entryLanguageResponse(request) {
  if (new URL(request.url).pathname !== '/api/entry-language') return null;
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
  const language = countryLanguage(request.cf?.country || request.headers.get('cf-ipcountry'));
  return Response.json({language}, {headers:{'Cache-Control':'private, no-store'}});
}
