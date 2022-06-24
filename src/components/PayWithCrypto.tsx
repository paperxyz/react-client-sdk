import React, { useEffect, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { WalletType } from '../interfaces/WalletTypes';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { ConnectWallet } from './ConnectWallet';

export type PayWithCryptoError = {
  /**
   * An enum representing the error encountered.
   * The value is a human-readable, English message describing the error.
   */
  code: PayWithCryptoErrorCode;
  error: Error;
};

export enum PayWithCryptoErrorCode {
  ErrorConnectingToSigner = 'No wallet present',
  ErrorSendingTransaction = 'Something went wrong sending transaction',
}

export interface PayWithCryptoChildrenProps {
  openModal: () => void;
}

interface PayWithCardProps {
  onSuccess?: (code: string) => void;
  onError?: (error: PayWithCryptoError) => void;
  onModalClose?: () => void;
  checkoutId: string;
  recipientWalletAddress?: string;
  emailAddress?: string;
  quantity?: number;
  metadata?: Record<string, any>;
  children?:
    | React.ReactNode
    | ((props: PayWithCryptoChildrenProps) => React.ReactNode);
  className?: string;
}

export const PayWithCrypto = ({
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  children,
  className,
  onError,
  onSuccess,
  onModalClose,
}: PayWithCardProps): React.ReactElement => {
  const isChildrenFunction = typeof children === 'function';
  const { data: user } = useAccount();
  const { data: _signer } = useSigner();

  const [isTryingToChangeWallet, setIsTryingToChangeWallet] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const signer = _signer;
  const isJsonRpcSignerPresent = !!signer;

  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => {
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setIsIframeLoading(true);
    if (onModalClose) {
      onModalClose();
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.startsWith('https://f11d-65-200-105-218.ngrok.io')) {
        return;
      }
      const data = event.data;
      switch (data.eventType) {
        case 'goBackToChoosingWallet':
          setIsTryingToChangeWallet(true);
          setIsIframeLoading(true);

          // if (onError) {
          //   onError({
          //     code: PayWithCryptoErrorCode.ErrorConnectingToSigner,
          //     error: new Error(''),
          //   });
          // }
          // if (onSuccess) {
          //   onSuccess('');
          // }
          break;
        case 'payWithEthClick': {
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const payWithCryptoUrl = new URL(
    '/sdk/v1/pay-with-crypto',
    'https://f11d-65-200-105-218.ngrok.io',
  );

  payWithCryptoUrl.searchParams.append(
    'payerWalletAddress',
    user?.address || '',
  );
  payWithCryptoUrl.searchParams.append('walletType', user?.connector?.id || '');
  payWithCryptoUrl.searchParams.append('checkoutId', checkoutId);

  payWithCryptoUrl.searchParams.append(
    'recipientWalletAddress',
    recipientWalletAddress || user?.address || '',
  );
  if (emailAddress) {
    payWithCryptoUrl.searchParams.append('emailAddress', emailAddress);
  }
  if (quantity) {
    payWithCryptoUrl.searchParams.append('quantity', quantity.toString());
  }
  if (metadata) {
    payWithCryptoUrl.searchParams.append('metadata', JSON.stringify(metadata));
  }
  // Add timestamp to prevent loading a cached page.
  payWithCryptoUrl.searchParams.append('date', Date.now().toString());

  const ModalContents =
    isJsonRpcSignerPresent && !isTryingToChangeWallet ? (
      <>
        {/* {isIframeLoading && (
          <Spinner className='absolute top-1/2 left-1/2 !h-8 !w-8 !text-black' />
        )} */}
        <iframe
          id='payWithCardIframe'
          className='mx-auto h-[700px] w-80'
          src={payWithCryptoUrl.href}
          onLoad={() => {
            // causes a double refresh
            // setIsIframeLoading(false);
          }}
          scrolling='no'
        />
      </>
    ) : (
      <ConnectWallet
        onWalletConnected={() => {
          setIsTryingToChangeWallet(false);
        }}
        onWalletConnectFail={(walletType, userWalletType) => {
          // coinbase will fail if we try to go back and connect again. because we never disconnected.
          // we'll get the error of "user already connected". We simply ignore it here.
          if (
            walletType === WalletType.CoinbaseWallet &&
            userWalletType === walletType
          ) {
            setIsTryingToChangeWallet(false);
          }
        }}
      />
    );

  return (
    <>
      {children && isChildrenFunction ? (
        children({ openModal })
      ) : (
        <>
          {children ? (
            <button onClick={openModal}>{children}</button>
          ) : (
            <Button className={className} onClick={openModal}>
              Pay With ETH{' '}
              <span className='font-bold text-gray-500'>on Ethereum</span>
            </Button>
          )}
          <Modal isOpen={isOpen} onClose={closeModal}>
            {ModalContents}
          </Modal>
        </>
      )}
    </>
  );
};
