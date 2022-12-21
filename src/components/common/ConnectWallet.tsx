import React from 'react';
import { CoinbaseWalletIcon } from '../../icons/CoinbaseWalleticon';

import { IconProps, MetaMaskIcon } from '../../icons/MetaMaskIcon';
import { WalletConnectIcon } from '../../icons/WalletConnectIcon';
import { ConnectWalletProps, WalletType } from '../../interfaces/WalletTypes';
import { useConnectWallet } from '../../lib/hooks/useConnectWallet';
import { Button } from './Button';
import { css } from '@emotion/css';

export function WalletIcon({
  walletType,
  className,
  onClick,
  size,
}: { walletType: string } & IconProps) {
  switch (walletType) {
    case WalletType.MetaMask:
      return (
        <MetaMaskIcon className={className} onClick={onClick} size={size} />
      );
    case WalletType.WalletConnect:
      return (
        <WalletConnectIcon
          className={className}
          onClick={onClick}
          size={size}
        />
      );
    case WalletType.CoinbaseWallet:
      return (
        <CoinbaseWalletIcon
          className={className}
          onClick={onClick}
          size={size}
        />
      );
    default:
      return <></>;
  }
}

export const ConnectWallet = ({
  onWalletConnected,
  onWalletConnectFail,
}: ConnectWalletProps): React.ReactElement => {
  const { connectWallet, connectors, isConnecting, pendingConnector } =
    useConnectWallet();

  return (
    <div
      className={css`
        display: flex;
        padding-top: 1.25rem;
        padding-bottom: 1.25rem;
        flex-direction: column;
      `}
    >
      {connectors.map((connector) => {
        return connector.ready ? (
          <Button
            className={css`
              display: flex;
              margin-right: 0.5rem;
              margin-bottom: 1rem;
            `}
            disabled={isConnecting}
            isLoading={isConnecting && connector.id === pendingConnector?.id}
            loadingText='Connecting'
            key={connector.id}
            onClick={connectWallet(
              connector,
              onWalletConnected,
              onWalletConnectFail,
            )}
          >
            {
              <WalletIcon
                walletType={connector.id}
                className={css`
                  margin-right: 0.5rem;
                `}
              />
            }
            {connector.name}
          </Button>
        ) : (
          <></>
        );
      })}
    </div>
  );
};
