import { Transition } from '@headlessui/react';
import { createCheckoutWithEthElement } from '@paperxyz/js-client-sdk';
import { ethers } from 'ethers';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_BRAND_OPTIONS } from '../../constants/settings';
import { ICustomizationOptions } from '../../interfaces/Customization';
import { Locale } from '../../interfaces/Locale';
import {
  PaperSDKError,
  PayWithCryptoErrorCode,
} from '../../interfaces/PaperSDKError';
import { useResolvedSigner } from '../../lib/hooks/useSigner';
import { useSwitchNetwork } from '../../lib/hooks/useSwitchNetwork';
import { usePaperSDKContext } from '../../Provider';
import { Spinner } from '../common/Spinner';

export interface PayWithCryptoChildrenProps {
  openModal: () => void;
}

export interface ViewPricingDetailsProps {
  onSuccess?: ({
    transactionResponse,
    transactionId,
  }: {
    transactionResponse: ethers.providers.TransactionResponse;
    transactionId: string;
  }) => void;
  onError?: (error: PaperSDKError) => void;
  suppressErrorToast?: boolean;

  sdkClientSecret: string;

  setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
  setUpUserPayingWalletSigner?: (args: {
    chainId: number;
    chainName?: string;
  }) => void | Promise<void>;
  payingWalletSigner?: ethers.Signer;
  receivingWalletType?:
    | 'WalletConnect'
    | 'MetaMask'
    | 'Coinbase Wallet'
    | string;
  showConnectWalletOptions?: boolean;
  options?: ICustomizationOptions;
  locale?: Locale;
}

export const ViewPricingDetails = ({
  setIsTryingToChangeWallet,
  onSuccess,
  onError,
  suppressErrorToast = false,
  showConnectWalletOptions = true,
  payingWalletSigner,
  receivingWalletType,
  setUpUserPayingWalletSigner,
  locale,
  sdkClientSecret,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
}: ViewPricingDetailsProps) => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();
  const { signer } = useResolvedSigner({ signer: payingWalletSigner });

  const { switchNetworkAsync } = useSwitchNetwork({
    signer: payingWalletSigner,
  });

  const onLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.startsWith(PAPER_APP_URL_ALT)) {
        return;
      }
      const data = event.data;
      switch (data.eventType) {
        case 'goBackToChoosingWallet':
          setIsTryingToChangeWallet(true);
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setIsTryingToChangeWallet]);

  useEffect(() => {
    if (!signer || !iframeContainerRef.current) {
      return;
    }
    createCheckoutWithEthElement({
      payingWalletSigner: signer,
      sdkClientSecret,
      suppressErrorToast,
      appName,
      locale,
      options,
      showConnectWalletOptions,
      elementOrId: iframeContainerRef.current,
      onLoad,
      receivingWalletType,
      onError,
      onSuccess,
      async setUpUserPayingWalletSigner({ chainId, chainName }) {
        console.log('chainId make sure signer is on', chainId);
        // Allows Dev's to inject any chain switching for their custom signer here.
        if (payingWalletSigner && setUpUserPayingWalletSigner) {
          try {
            console.log('setting up signer');
            await setUpUserPayingWalletSigner({ chainId, chainName });
          } catch (error) {
            console.log('error setting up signer', error);
            throw error;
          }
        }

        // try switching network first if needed or supported
        try {
          if (switchNetworkAsync) {
            console.log('switching signer network');
            await switchNetworkAsync(chainId);
          } else if (chainId !== chainId) {
            throw {
              isErrorObject: true,
              title: PayWithCryptoErrorCode.WrongChain,
              description: `Please change to ${chainName} to proceed.`,
            };
          }
        } catch (error) {
          console.log('error switching network');
          throw error;
        }
      },
    });
  }, [signer]);

  return (
    <>
      <Transition
        appear={true}
        show={isIframeLoading}
        as={React.Fragment}
        enter='transition-opacity duration-75'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity duration-150'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <Spinner className='!h-8 !w-8 !text-black' />
        </div>
      </Transition>
      <div ref={iframeContainerRef} />
    </>
  );
};
