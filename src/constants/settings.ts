export const PAPER_APP_URL =
  process.env.NEXT_PUBLIC_NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://paper.xyz';

export const PAPER_APP_URL_ALT =
  process.env.NEXT_PUBLIC_NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://papercheckout.com';

export const DEFAULT_BRAND_OPTIONS = {
  colorPrimary: '#cf3781',
  colorBackground: '#ffffff',
  colorText: '#1a202c',
  borderRadius: 12,
  fontFamily: 'Open Sans',
};
