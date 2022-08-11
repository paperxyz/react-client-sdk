export const enum WalletType {
  Preset = 'Preset',
  MetaMask = 'metaMask',
  CoinbaseWallet = 'coinbaseWallet',
  WalletConnect = 'walletConnect',
  Phantom = 'Phantom',
}

export interface ConnectWalletProps {
  onWalletConnected: onWalletConnectedType;
  onSelectWalletPageLoaded?: () => void;
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
