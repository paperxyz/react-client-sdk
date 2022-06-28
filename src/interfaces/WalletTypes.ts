export const enum WalletType {
  PRESET = 'Preset',
  MetaMask = 'metaMask',
  CoinbaseWallet = 'coinbaseWallet',
  WalletConnect = 'walletConnect',
}

export type onWalletConnectFailType = (
  walletType: WalletType,
  currentUserWalletType: WalletType,
  error: Error,
) => void;
