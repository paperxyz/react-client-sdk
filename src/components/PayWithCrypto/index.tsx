import { Transition } from '@headlessui/react';
import { PayWithCryptoErrorCode } from '@paperxyz/js-client-sdk';
import React, { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
} from '../../interfaces/CustomContract';
import {
  onWalletConnectedType,
  WalletType,
} from '../../interfaces/WalletTypes';
import { ConnectWallet } from '../common/ConnectWallet';
import {
  ViewPricingDetails,
  ViewPricingDetailsProps,
} from './ViewPricingDetails';
import {
  commonTransitionProps,
  transitionContainer,
} from '../../lib/utils/styles';

export enum PayWithCryptoPage {
  ConnectWallet,
  PaymentDetails,
}

type PayWithCryptoProps<T extends ContractType> = CustomContractArgWrapper<
  {
    onWalletConnected?: onWalletConnectedType;
    onPageChange?: (currentPage: PayWithCryptoPage) => void;
  } & Omit<ViewPricingDetailsProps, 'setIsTryingToChangeWallet'>,
  T
>;

/**
 * @deprecated see {@link CheckoutWithEth} instead
 * @param param0
 * @returns
 */
export const PayWithCrypto = <T extends ContractType>({
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  eligibilityMethod,
  mintMethod,
  suppressErrorToast,
  signer,
  setUpSigner,
  walletType,
  showConnectWalletOptions = true,
  options,
  onError,
  // This is fired when the transaction is sent to chain, the transaction might still fail there for whatever reason.
  onSuccess,
  onWalletConnected,
  onPageChange,
  locale,
  ...contractSpecificArgs
}: PayWithCryptoProps<T>): React.ReactElement => {
  const { data: _signer } = useSigner();
  const [isClientSide, setIsClientSide] = useState(false);
  const [isTryingToChangeWallet, setIsTryingToChangeWallet] = useState(false);
  const actualSigner = signer || _signer;
  const isJsonRpcSignerPresent = !!actualSigner;
  const customContractArgs =
    fetchCustomContractArgsFromProps(contractSpecificArgs);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    if (onPageChange) {
      if (
        (isJsonRpcSignerPresent && !isTryingToChangeWallet) ||
        !showConnectWalletOptions
      ) {
        onPageChange(PayWithCryptoPage.PaymentDetails);
      } else if (
        showConnectWalletOptions &&
        (!isJsonRpcSignerPresent || isTryingToChangeWallet)
      ) {
        onPageChange(PayWithCryptoPage.ConnectWallet);
      }
    }
  }, [
    showConnectWalletOptions,
    isJsonRpcSignerPresent,
    isTryingToChangeWallet,
  ]);

  return (
    <div className={transitionContainer}>
      {isClientSide && (
        <>
          {showConnectWalletOptions && (
            <Transition
              show={!isJsonRpcSignerPresent || isTryingToChangeWallet}
              {...commonTransitionProps}
            >
              <ConnectWallet
                onWalletConnected={({ userAddress, chainId }) => {
                  setIsTryingToChangeWallet(false);
                  if (onWalletConnected) {
                    onWalletConnected({ userAddress, chainId });
                  }
                }}
                onWalletConnectFail={({
                  walletType,
                  currentUserWalletType,
                  error,
                }) => {
                  // coinbase will fail if we try to go back and connect again. because we never disconnected.
                  // we'll get the error of "user already connected". We simply ignore it here.
                  if (
                    walletType === WalletType.CoinbaseWallet &&
                    currentUserWalletType === walletType
                  ) {
                    setIsTryingToChangeWallet(false);
                    return;
                  }
                  if (onError) {
                    onError({
                      code: PayWithCryptoErrorCode.ErrorConnectingToWallet,
                      error,
                    });
                  }
                }}
              />
            </Transition>
          )}
          <Transition
            show={
              (isJsonRpcSignerPresent && !isTryingToChangeWallet) ||
              !showConnectWalletOptions
            }
            {...commonTransitionProps}
          >
            <ViewPricingDetails
              checkoutId={checkoutId}
              recipientWalletAddress={recipientWalletAddress}
              emailAddress={emailAddress}
              quantity={quantity}
              metadata={metadata}
              {...customContractArgs}
              eligibilityMethod={eligibilityMethod}
              mintMethod={mintMethod}
              showConnectWalletOptions={showConnectWalletOptions}
              signer={signer}
              setUpSigner={setUpSigner}
              walletType={walletType}
              onError={onError}
              onSuccess={(transactionResponse) => {
                if (onSuccess) {
                  onSuccess(transactionResponse);
                }
              }}
              suppressErrorToast={suppressErrorToast}
              options={options}
              setIsTryingToChangeWallet={setIsTryingToChangeWallet}
              locale={locale}
            />
          </Transition>
        </>
      )}
    </div>
  );
};
