const RMS_IP = '134.122.73.65';
const RMS_TLS_PORT = '8443';

/**
 * Public origin for customer QR links.
 * Until dfoodie.et is live, IP URLs without :8443 hit hulesport on :443
 * (black cashier SPA) instead of DFoodie.
 */
export function getFrontendBase(frontendUrl = process.env.FRONTEND_URL): string {
  const raw = (frontendUrl || 'http://localhost:3000').trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.hostname === RMS_IP && (url.port === '' || url.port === '443' || url.port === '80')) {
      url.protocol = 'https:';
      url.port = RMS_TLS_PORT;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}
