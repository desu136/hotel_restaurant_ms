import { getFrontendBase } from '../../src/lib/frontend-url';

describe('getFrontendBase', () => {
  test('forces RMS IP QR links onto :8443', () => {
    expect(getFrontendBase('https://134.122.73.65/rms')).toBe('https://134.122.73.65:8443/rms');
    expect(getFrontendBase('https://134.122.73.65:443/rms')).toBe('https://134.122.73.65:8443/rms');
    expect(getFrontendBase('http://134.122.73.65/rms')).toBe('https://134.122.73.65:8443/rms');
  });

  test('keeps an explicit :8443 origin', () => {
    expect(getFrontendBase('https://134.122.73.65:8443/rms')).toBe('https://134.122.73.65:8443/rms');
  });

  test('does not rewrite hostnames (dfoodie.et / localhost)', () => {
    expect(getFrontendBase('https://dfoodie.et/rms')).toBe('https://dfoodie.et/rms');
    expect(getFrontendBase('https://www.dfoodie.et/rms')).toBe('https://www.dfoodie.et/rms');
    expect(getFrontendBase('http://localhost:3000')).toBe('http://localhost:3000');
  });
});
