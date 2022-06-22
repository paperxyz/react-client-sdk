import React, { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import { PAPER_APP_URL } from '../constants/settings';
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
}

export interface PayWithCryptoChildrenProps {
  openModal: () => void;
}
interface PayWithCryptpIntrface {
  onSuccess?: (code: string) => void;
  onError?: (error: PayWithCryptoError) => void;
  onModalClose?: () => void;
  children?:
    | React.ReactNode
    | ((props: PayWithCryptoChildrenProps) => React.ReactNode);
  className?: string;
}

export const PayWithCrypto = ({
  children,
  className,
  onError,
  onSuccess,
  onModalClose,
}: PayWithCryptpIntrface): React.ReactElement => {
  const isChildrenFunction = typeof children === 'function';
  const { data: signer } = useSigner();
  const isJsonRpcSignerPresent = !!signer;

  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => {
    console.log('openModal isOpen', isOpen);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.startsWith(PAPER_APP_URL)) {
        return;
      }
      const data = event.data;
      switch (data.eventType) {
        case 'purchaseSuccess':
          if (onError) {
            onError({
              code: PayWithCryptoErrorCode.ErrorConnectingToSigner,
              error: new Error(''),
            });
          }
          if (onSuccess) {
            onSuccess('');
          }
          break;
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
    'http://localhost:3000',
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
            {isJsonRpcSignerPresent ? (
              <iframe
                id='payWithCardIframe'
                src={payWithCryptoUrl.href}
                width='100%'
                height='100%'
              />
            ) : (
              <ConnectWallet
                onWalletConnected={() => {
                  console.log('wallet connected');
                }}
              />
            )}
          </Modal>
        </>
      )}
    </>
  );
};
