import { Dialog } from '@headlessui/react';
import React from 'react';
import { useAccount } from 'wagmi';
import { CoinbaseWalleticon } from '../icons/CoinbaseWalleticon';

import { IconProps, MetaMaskIcon } from '../icons/MetaMaskIcon';
import { WalletConnectIcon } from '../icons/WalletConnectIcon';
import { WalletType } from '../interfaces/WalletTypes';
import { useConnectWallet } from '../lib/hooks/useConnectWallet';
import { Button } from './common/Button';

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
        <CoinbaseWalleticon
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
}: {
  onWalletConnected: () => void;
  onWalletConnectFail: (walletType: WalletType, error: Error) => void;
}): React.ReactElement => {
  const { connectWallet, connectors, error, isConnecting, pendingConnector } =
    useConnectWallet();
  const { data: user } = useAccount();

  return (
    <>
      <Dialog.Title
        as='h3'
        className='text-lg font-medium leading-6 text-gray-900'
      >
        Pay with ETH on Ethereum
      </Dialog.Title>
      <Dialog.Description className='text-sm text-gray-500'>
        Connect your wallet to get started
      </Dialog.Description>

      <div className='flex flex-col py-5'>
        {connectors.map((connector) => {
          return connector.ready ? (
            <Button
              className='mb-4 mr-2 flex '
              disabled={isConnecting}
              isLoading={
                isConnecting &&
                (connector.id === pendingConnector?.id ||
                  (user?.connector?.id === connector.id &&
                    connector.id === WalletType.MetaMask))
              }
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

        {error && <div>{error.message}</div>}
      </div>
    </>
  );
};
