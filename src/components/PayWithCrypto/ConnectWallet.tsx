import React, { useEffect } from 'react';
import { CoinbaseWalletIcon } from '../../icons/CoinbaseWalleticon';

import { IconProps, MetaMaskIcon } from '../../icons/MetaMaskIcon';
import { WalletConnectIcon } from '../../icons/WalletConnectIcon';
import { ConnectWalletProps, WalletType } from '../../interfaces/WalletTypes';
import { useConnectWallet } from '../../lib/hooks/useConnectWallet';
import { Button } from '../common/Button';

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
  onSelectWalletPageLoaded,
}: ConnectWalletProps): React.ReactElement => {
  const { connectWallet, connectors, isConnecting, pendingConnector } =
    useConnectWallet();

  useEffect(() => {
    if (onSelectWalletPageLoaded) {
      onSelectWalletPageLoaded();
    }
  }, []);

  return (
    <div className='flex flex-col py-5'>
      {connectors.map((connector) => {
        return connector.ready ? (
          <Button
            className='mb-4 mr-2 flex '
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
            {<WalletIcon walletType={connector.id} className='mr-2' />}
            {connector.name}
          </Button>
        ) : (
          <></>
        );
      })}
    </div>
  );
};
