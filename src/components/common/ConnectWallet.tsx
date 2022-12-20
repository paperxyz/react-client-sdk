import React from 'react';
import { CoinbaseWalletIcon } from '../../icons/CoinbaseWalleticon';

import { IconProps, MetaMaskIcon } from '../../icons/MetaMaskIcon';
import { WalletConnectIcon } from '../../icons/WalletConnectIcon';
import { ConnectWalletProps, WalletType } from '../../interfaces/WalletTypes';
import { useConnectWallet } from '../../lib/hooks/useConnectWallet';
import { Button } from './Button';

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
    <div className='paper-flex paper-flex-col paper-py-5'>
      {connectors.map((connector) => {
        return connector.ready ? (
          <Button
            className='paper-mb-4 paper-mr-2 paper-flex '
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
            {<WalletIcon walletType={connector.id} className='paper-mr-2' />}
            {connector.name}
          </Button>
        ) : (
          <></>
        );
      })}
    </div>
  );
};
