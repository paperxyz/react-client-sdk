import { useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect } from 'wagmi';
import { WalletType } from '../../interfaces/WalletTypes';

export function useConnectWallet() {
  const [isUpdatingMetaMaskAccount, setIsUpdatingMetaMaskAccount] =
    useState(false);
  const {
    connectAsync,
    connectors,
    error,
    isConnecting: _isConnecting,
    pendingConnector,
  } = useConnect();
  const isConnecting = _isConnecting || isUpdatingMetaMaskAccount;
  const { disconnectAsync } = useDisconnect();

  const connectWallet = (
    connector: Connector,
    onWalletConnected: () => void,
    onWalletConnectFail: (walletType: WalletType, error: Error) => void,
  ) => {
    const { data: user } = useAccount();
    console.log('user', user);
    return async () => {
      if (
        user?.connector?.id === WalletType.MetaMask &&
        connector.id === WalletType.MetaMask
      ) {
        setIsUpdatingMetaMaskAccount(true);
        try {
          await window.ethereum?.request({
            //@ts-ignore
            method: 'wallet_requestPermissions',
            //@ts-ignore
            params: [{ eth_accounts: {} }],
          });
          onWalletConnected();
        } catch (e) {
          // user cancel request, don't need to do anything.
          console.error('error connecting to user metamask', e);
          onWalletConnectFail(WalletType.MetaMask, e as Error);
        }
        setIsUpdatingMetaMaskAccount(false);
      } else {
        try {
          if (user?.connector?.id === WalletType.WalletConnect) {
            // coinbase wallet refreshes the whole page when disconnected so we avoid that
            // Metamask should not be disconnected bc we call another method once connected to
            // allow easy connection to other accounts
            await disconnectAsync();
          }
          await connectAsync(connector);
          onWalletConnected();
        } catch (e) {
          // user Cancel request, don't need to do anything
          console.error("Error connecting to user's wallet", e);
          onWalletConnectFail(connector.id as WalletType, e as Error);
        }
      }
    };
  };

  return {
    connectWallet,
    connectors,
    error,
    isConnecting,
    pendingConnector,
  };
}
