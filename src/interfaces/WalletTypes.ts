export const enum WalletType {
  PRESET = 'Preset',
  MetaMask = 'metaMask',
  CoinbaseWallet = 'coinbaseWallet',
  WalletConnect = 'walletConnect',
}

export interface ConnectWalletProps {
  onWalletConnected: onWalletConnectedType;
  onWalletConnectFail: onWalletConnectFailType;
}

export type onWalletConnectFailType = (
  walletType: WalletType,
  currentUserWalletType: WalletType,
  error: Error,
) => void;
export type onWalletConnectedType = (
  userAddress: string,
  chainId: number,
) => void;
