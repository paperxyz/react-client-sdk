import ethers from 'ethers';
import React, { useEffect, useState } from 'react';
import { PAPER_APP_URL } from '../constants/settings';
import { Button } from './base/Button';
import { Modal } from './base/Modal';

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
  signer?: ethers.Signer;
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
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => {
    setIsOpen(true);
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

  return (
    <>
      {children && isChildrenFunction ? (
        children({ openModal })
      ) : children ? (
        <button onClick={openModal}>{children}</button>
      ) : (
        <div>
          <Button className={className} onClick={openModal}>
            Pay With ETH{' '}
            <span
              className='text-6xl text-red-400'
              style={{
                color: 'gray',
              }}
            >
              on Ethereum
            </span>
          </Button>
        </div>
      )}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            if (onModalClose) {
              onModalClose();
            }
          }}
        >
          <button>close</button>
        </Modal>
      )}
    </>
  );
};
