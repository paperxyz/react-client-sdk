import React, { useState } from 'react';
import { useSigner } from 'wagmi';
import { PayWithCryptoErrorCode } from '../../interfaces/PayWithCryptoError';
import { WalletType } from '../../interfaces/WalletTypes';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConnectWallet } from './ConnectWallet';
import {
  PayWithCryptoChildrenProps,
  ViewPricingDetails,
  ViewPricingDetailsProps,
} from './ViewPricingDetails';

type PayWithCardProps = {
  onModalClose?: () => void;
  onWalletConnected?: () => void;
  children?:
    | React.ReactNode
    | ((props: PayWithCryptoChildrenProps) => React.ReactNode);
  className?: string;
} & Omit<ViewPricingDetailsProps, 'setIsTryingToChangeWallet'>;

export const PayWithCrypto = ({
  children,
  className,
  checkoutId,
  recipientWalletAddress,
  appName,
  emailAddress,
  quantity,
  metadata,
  suppressErrorToast,
  onError,
  // This is fired when the transaction is sent to chain, it might still fail there for whatever reason.
  onSuccess,
  onWalletConnected,
  onModalClose,
}: PayWithCardProps): React.ReactElement => {
  const isChildrenFunction = typeof children === 'function';
  const { data: _signer } = useSigner();

  const [isTryingToChangeWallet, setIsTryingToChangeWallet] = useState(false);

  const signer = _signer;
  const isJsonRpcSignerPresent = !!signer;
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => {
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const ModalContents =
    isJsonRpcSignerPresent && !isTryingToChangeWallet ? (
      <ViewPricingDetails
        checkoutId={checkoutId}
        recipientWalletAddress={recipientWalletAddress}
        appName={appName}
        emailAddress={emailAddress}
        quantity={quantity}
        metadata={metadata}
        onError={onError}
        onSuccess={(transactionResponse) => {
          closeModal();
          if (onSuccess) {
            onSuccess(transactionResponse);
          }
        }}
        suppressErrorToast={suppressErrorToast}
        setIsTryingToChangeWallet={setIsTryingToChangeWallet}
      />
    ) : (
      <ConnectWallet
        onWalletConnected={() => {
          setIsTryingToChangeWallet(false);
          if (onWalletConnected) {
            onWalletConnected();
          }
        }}
        onWalletConnectFail={(walletType, userWalletType, error) => {
          // coinbase will fail if we try to go back and connect again. because we never disconnected.
          // we'll get the error of "user already connected". We simply ignore it here.
          if (
            walletType === WalletType.CoinbaseWallet &&
            userWalletType === walletType
          ) {
            setIsTryingToChangeWallet(false);
          }
          if (onError) {
            onError({
              code: PayWithCryptoErrorCode.ErrorConnectingToWallet,
              error,
            });
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
