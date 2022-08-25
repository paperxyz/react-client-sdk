export const PAPER_APP_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://paper.xyz'
    : 'http://localhost:3000';

export const PAPER_APP_URL_ALT =
  process.env.NODE_ENV === 'production'
    ? 'https://papercheckout.com'
    : 'http://localhost:3000';

export const DEFAULT_BRAND_OPTIONS = {
  colorPrimary: '#cf3781',
  colorBackground: '#ffffff',
  colorText: '#1a202c',
  borderRadius: 12,
  fontFamily: 'Open Sans',
};
