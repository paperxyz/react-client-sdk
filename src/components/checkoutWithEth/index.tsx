import { Transition } from '@headlessui/react';
import { PayWithCryptoErrorCode } from '@paperxyz/js-client-sdk';
import React, { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import {
  onWalletConnectedType,
  WalletType,
} from '../../interfaces/WalletTypes';
import {
  commonTransitionProps,
  transitionContainer,
} from '../../lib/utils/styles';
import { ConnectWallet } from '../common/ConnectWallet';
import {
  ViewPricingDetails,
  ViewPricingDetailsProps,
} from './ViewPricingDetails';

var packageJson = require('../../../package.json');

export enum CheckoutWithEthPage {
  ConnectWallet,
  PaymentDetails,
}

type CheckoutWithEthProps = {
  onWalletConnected?: onWalletConnectedType;
  onPageChange?: (currentPage: CheckoutWithEthPage) => void;
} & Omit<ViewPricingDetailsProps, 'setIsTryingToChangeWallet'>;

export const CheckoutWithEth = ({
  sdkClientSecret,
  payingWalletSigner,
  setUpUserPayingWalletSigner,
  receivingWalletType,
  suppressErrorToast,
  showConnectWalletOptions = true,
  options,
  onError,
  // This is fired when the transaction is sent to chain, the transaction might still fail there for whatever reason.
  onSuccess,
  onWalletConnected,
  onPageChange,
  locale,
}: CheckoutWithEthProps): React.ReactElement => {
  const { data: _signer } = useSigner();
  const [isClientSide, setIsClientSide] = useState(false);
  const [isTryingToChangeWallet, setIsTryingToChangeWallet] = useState(false);
  const actualSigner = payingWalletSigner || _signer;
  const isJsonRpcSignerPresent = !!actualSigner;

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    if (onPageChange) {
      if (
        (isJsonRpcSignerPresent && !isTryingToChangeWallet) ||
        !showConnectWalletOptions
      ) {
        onPageChange(CheckoutWithEthPage.PaymentDetails);
      } else if (
        showConnectWalletOptions &&
        (!isJsonRpcSignerPresent || isTryingToChangeWallet)
      ) {
        onPageChange(CheckoutWithEthPage.ConnectWallet);
      }
    }
  }, [
    showConnectWalletOptions,
    isJsonRpcSignerPresent,
    isTryingToChangeWallet,
  ]);

  return (
    <div
      className={transitionContainer}
      data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
    >
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
              sdkClientSecret={sdkClientSecret}
              payingWalletSigner={actualSigner || undefined}
              receivingWalletType={receivingWalletType}
              setUpUserPayingWalletSigner={setUpUserPayingWalletSigner}
              onError={onError}
              onSuccess={(transactionResponse) => {
                if (onSuccess) {
                  onSuccess(transactionResponse);
                }
              }}
              showConnectWalletOptions={showConnectWalletOptions}
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
