import { Transition } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
} from '../../interfaces/CustomContract';
import { PayWithCryptoErrorCode } from '../../interfaces/PaperSDKError';
import {
  onWalletConnectedType,
  WalletType,
} from '../../interfaces/WalletTypes';
import { ConnectWallet } from './ConnectWallet';
import {
  ViewPricingDetails,
  ViewPricingDetailsProps,
} from './ViewPricingDetails';

type PayWithCryptoProps<T extends ContractType> = CustomContractArgWrapper<
  {
    onWalletConnected?: onWalletConnectedType;
  } & Omit<ViewPricingDetailsProps, 'setIsTryingToChangeWallet'>,
  T
>;

export const PayWithCrypto = <T extends ContractType>({
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  eligibilityMethod,
  mintMethod,
  suppressErrorToast,
  showConnectWalletOptions,
  options,
  onError,
  // This is fired when the transaction is sent to chain, the transaction might still fail there for whatever reason.
  onSuccess,
  onWalletConnected,
  ...props
}: PayWithCryptoProps<T>): React.ReactElement => {
  const { data: _signer } = useSigner();
  const [isClientSide, setIsClientSide] = useState(false);
  const [isTryingToChangeWallet, setIsTryingToChangeWallet] = useState(false);
  const signer = _signer;
  const isJsonRpcSignerPresent = !!signer;
  const customContractArgs = fetchCustomContractArgsFromProps(props);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  return (
    <div className='relative grid w-full'>
      {isClientSide && (
        <>
          {showConnectWalletOptions && (
            <Transition
              show={!isJsonRpcSignerPresent || isTryingToChangeWallet}
              className='col-start-1 row-start-1'
              enter='transition-opacity duration-75 delay-150'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='transition-opacity duration-150'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
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
            </Transition>
          )}
          <Transition
            show={
              (isJsonRpcSignerPresent && !isTryingToChangeWallet) ||
              !showConnectWalletOptions
            }
            className='bg-transparent/* */ col-start-1  row-start-1'
            enter='transition-opacity duration-75 delay-150'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='transition-opacity duration-150'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
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
            />
          </Transition>
        </>
      )}
    </div>
  );
};
