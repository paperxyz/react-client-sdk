import { useState } from 'react';
import { Connector, useAccount, useConnect, useDisconnect } from 'wagmi';
import {
  onWalletConnectedType,
  onWalletConnectFailType,
  WalletType,
} from '../../interfaces/WalletTypes';

export function useConnectWallet() {
  const [isUpdatingMetaMaskAccount, setIsUpdatingMetaMaskAccount] =
    useState(false);
  const {
    connectAsync,
    connectors,
    error,
    isLoading,
    pendingConnector: _pendingConnector,
  } = useConnect();
  const isConnecting = isLoading || isUpdatingMetaMaskAccount;
  const { disconnectAsync } = useDisconnect();
  const pendingConnector = isUpdatingMetaMaskAccount
    ? { id: WalletType.MetaMask }
    : _pendingConnector;

  const connectWallet = (
    connector: Connector,
    onWalletConnected: onWalletConnectedType,
    onWalletConnectFail: onWalletConnectFailType,
  ) => {
    const { connector: userConnector } = useAccount();

    return async () => {
      if (
        userConnector?.id === WalletType.MetaMask &&
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

          onWalletConnected({
            userAddress: await userConnector.getAccount(),
            chainId: await userConnector.getChainId(),
          });
        } catch (e) {
          // user cancel request, don't need to do anything.
          onWalletConnectFail({
            walletType: WalletType.MetaMask,
            currentUserWalletType: connector?.id as WalletType,
            error: e as Error,
          });
        }
        setIsUpdatingMetaMaskAccount(false);
      } else {
        try {
          if (connector?.id === WalletType.WalletConnect) {
            // coinbase wallet refreshes the whole page when disconnected so we avoid that
            // Metamask should not be disconnected bc we call another method once connected to
            // allow easy connection to other accounts
            await disconnectAsync();
          }
          const connected = await connectAsync({ connector });
          onWalletConnected({
            userAddress: connected.account,
            chainId: connected.chain.id,
          });
        } catch (e) {
          // user Cancel request, don't need to do anything
          onWalletConnectFail({
            currentUserWalletType: connector.id as WalletType,
            walletType: userConnector?.id as WalletType,
            error: e as Error,
          });
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
