import React, { useState } from 'react';
import { useSigner } from 'wagmi';
import {
  ContractType,
  CustomContractArgWrapper,
} from '../../interfaces/CustomContract';
import { PayWithCryptoErrorCode } from '../../interfaces/PaperSDKError';
import {
  onWalletConnectedType,
  WalletType,
} from '../../interfaces/WalletTypes';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConnectWallet } from './ConnectWallet';
import {
  PayWithCryptoChildrenProps,
  ViewPricingDetails,
  ViewPricingDetailsProps,
} from './ViewPricingDetails';

type PayWithCardProps<T extends ContractType> = CustomContractArgWrapper<
  {
    onClose?: () => void;
    onWalletConnected?: onWalletConnectedType;
    children?:
      | React.ReactNode
      | ((props: PayWithCryptoChildrenProps) => React.ReactNode);
    className?: string;
  } & Omit<ViewPricingDetailsProps, 'setIsTryingToChangeWallet'>,
  T
>;

export const PayWithCrypto = <T extends ContractType>({
  children,
  className,
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  suppressErrorToast,
  signatureArgs,
  onError,
  // This is fired when the transaction is sent to chain, it might still fail there for whatever reason.
  onSuccess,
  onWalletConnected,
  onClose,
}: PayWithCardProps<T>): React.ReactElement => {
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
    if (onClose) {
      onClose();
    }
  };

  const ModalContents =
    isJsonRpcSignerPresent && !isTryingToChangeWallet ? (
      <ViewPricingDetails
        checkoutId={checkoutId}
        recipientWalletAddress={recipientWalletAddress}
        emailAddress={emailAddress}
        quantity={quantity}
        metadata={metadata}
        signatureArgs={signatureArgs}
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
        onWalletConnected={(userAddress, chainId) => {
          setIsTryingToChangeWallet(false);
          if (onWalletConnected) {
            onWalletConnected(userAddress, chainId);
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
