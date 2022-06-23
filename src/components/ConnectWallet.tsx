import { Dialog } from '@headlessui/react';
import React, { useState } from 'react';
import { Connector, useAccount, useConnect } from 'wagmi';
import { CoinbaseWalleticon } from '../icons/CoinbaseWalleticon';

import { IconProps, MetaMaskIcon } from '../icons/MetaMaskIcon';
import { WalletConnectIcon } from '../icons/WalletConnectIcon';
import { Button } from './common/Button';

const enum WalletType {
  MetaMask = 'metaMask',
  CoinbaseWallet = 'coinbaseWallet',
  WalletConnect = 'walletConnect',
}
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

export const ConnectWallet = (): React.ReactElement => {
  const {
    connect,
    connectors,
    error,
    isConnecting: _isConnecting,
    pendingConnector,
  } = useConnect();
  const [isUpdatingMetaMaskAccount, setIsUpdatingMetaMaskAccount] =
    useState(false);
  const isConnecting = _isConnecting || isUpdatingMetaMaskAccount;

  const { data: user } = useAccount();

  const connectWallet = (connector: Connector) => {
    return async () => {
      if (
        user?.connector?.id === WalletType.MetaMask &&
        connector.id === WalletType.MetaMask
      ) {
        setIsUpdatingMetaMaskAccount(true);
        await window.ethereum?.request({
          //@ts-ignore
          method: 'wallet_requestPermissions',
          //@ts-ignore
          params: [{ eth_accounts: {} }],
        });
        setIsUpdatingMetaMaskAccount(false);
      } else {
        connect(connector);
      }
    };
  };
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
              isLoading={isConnecting && connector.id === pendingConnector?.id}
              loadingText='Connecting'
              key={connector.id}
              onClick={connectWallet(connector)}
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
