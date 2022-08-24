import { Transition } from '@headlessui/react';
import { ethers } from 'ethers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DEFAULT_BRAND_OPTIONS, PAPER_APP_URL } from '../../constants/settings';
import { ICustomizationOptions } from '../../interfaces/Customization';
import {
  PaperSDKError,
  PayWithCryptoErrorCode,
} from '../../interfaces/PaperSDKError';
import { WalletType } from '../../interfaces/WalletTypes';
import { useAccount } from '../../lib/hooks/useAccount';
import { useSendTransaction } from '../../lib/hooks/useSendTransaction';
import { useSwitchNetwork } from '../../lib/hooks/useSwitchNetwork';
import { handlePayWithCryptoError } from '../../lib/utils/handleError';
import { postMessageToIframe } from '../../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../../Provider';
import { IFrameWrapper } from '../common/IFrameWrapper';
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
  }) => void | Promise<void>;
  payingWalletSigner?: ethers.Signer;
  receivingWalletType?:
    | 'WalletConnect'
    | 'MetaMask'
    | 'Coinbase Wallet'
    | string;
  showConnectWalletOptions?: boolean;
  options?: ICustomizationOptions;
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
  sdkClientSecret,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
}: ViewPricingDetailsProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();

  const { address, chainId } = useAccount({
    signer: payingWalletSigner,
  });
  const { sendTransactionAsync, isSendingTransaction } = useSendTransaction({
    signer: payingWalletSigner,
  });
  const { switchNetworkAsync } = useSwitchNetwork({
    signer: payingWalletSigner,
  });

  const onLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.origin.startsWith(PAPER_APP_URL)) {
        return;
      }
      const data = event.data;
      switch (data.eventType) {
        case 'goBackToChoosingWallet':
          setIsTryingToChangeWallet(true);
          break;
        case 'payWithEth': {
          // Allows Dev's to inject any chain switching for their custom signer here.
          if (payingWalletSigner && setUpUserPayingWalletSigner) {
            try {
              console.log('setting up signer');
              await setUpUserPayingWalletSigner({ chainId: data.chainId });
            } catch (error) {
              console.log('error setting up signer', error);
              handlePayWithCryptoError(
                error as Error,
                onError,
                (errorObject) => {
                  if (iframeRef.current) {
                    postMessageToIframe(iframeRef.current, 'payWithEthError', {
                      error: errorObject,
                      suppressErrorToast,
                    });
                  }
                },
              );
              return;
            }
          }

          // try switching network first if needed or supported
          try {
            if (switchNetworkAsync) {
              console.log('switching signer network');
              await switchNetworkAsync(data.chainId);
            } else if (chainId !== data.chainId) {
              throw {
                isErrorObject: true,
                title: PayWithCryptoErrorCode.WrongChain,
                description: `Please change to ${data.chainName} to proceed.`,
              };
            }
          } catch (error) {
            console.log('error switching network');
            handlePayWithCryptoError(error as Error, onError, (errorObject) => {
              if (iframeRef.current) {
                postMessageToIframe(iframeRef.current, 'payWithEthError', {
                  error: errorObject,
                  suppressErrorToast,
                });
              }
            });
            return;
          }

          // send the transaction
          try {
            if (isSendingTransaction) {
              throw {
                title: PayWithCryptoErrorCode.PendingSignature,
                description: 'Check your wallet to confirm the transaction.',
                isErrorObject: true,
              };
            }
            console.log('sending funds');
            const result = await sendTransactionAsync?.({
              chainId: data.chainId,
              request: {
                value: data.value,
                data: data.blob,
                to: data.paymentAddress,
              },
            });
            if (onSuccess && result) {
              onSuccess({
                transactionResponse: result,
                transactionId: data.transactionId,
              });
            }
            if (iframeRef.current && result) {
              postMessageToIframe(iframeRef.current, 'paymentSuccess', {
                suppressErrorToast,
                transactionHash: result.hash,
              });
            }
          } catch (error) {
            console.log('error sending funds', error);
            handlePayWithCryptoError(error as Error, onError, (errorObject) => {
              if (iframeRef.current) {
                postMessageToIframe(iframeRef.current, 'payWithEthError', {
                  error: errorObject,
                  suppressErrorToast,
                });
              }
            });
          }
          break;
        }
        case 'sizing': {
          if (iframeRef.current) {
            iframeRef.current.style.height = data.height + 'px';
            iframeRef.current.style.maxHeight = data.height + 'px';
          }
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
  }, [
    isSendingTransaction,
    address,
    chainId,
    payingWalletSigner,
    setUpUserPayingWalletSigner,
  ]);

  const checkoutWithEthUrl = useMemo(() => {
    const checkoutWithEthUrl = new URL(
      '/sdk/2022-08-12/checkout-with-eth',
      PAPER_APP_URL,
    );
    checkoutWithEthUrl.searchParams.append(
      'showConnectWalletOptions',
      showConnectWalletOptions.toString(),
    );
    checkoutWithEthUrl.searchParams.append('payerWalletAddress', address || '');

    checkoutWithEthUrl.searchParams.append(
      'recipientWalletAddress',
      address || '',
    );

    checkoutWithEthUrl.searchParams.append('sdkClientSecret', sdkClientSecret);
    checkoutWithEthUrl.searchParams.append(
      'walletType',
      receivingWalletType || WalletType.Preset || '',
    );

    if (options.colorPrimary) {
      checkoutWithEthUrl.searchParams.append(
        'colorPrimary',
        options.colorPrimary,
      );
    }
    if (options.colorBackground) {
      checkoutWithEthUrl.searchParams.append(
        'colorBackground',
        options.colorBackground,
      );
    }
    if (options.colorText) {
      checkoutWithEthUrl.searchParams.append('colorText', options.colorText);
    }
    if (options.borderRadius !== undefined) {
      checkoutWithEthUrl.searchParams.append(
        'borderRadius',
        options.borderRadius.toString(),
      );
    }
    if (options.fontFamily) {
      checkoutWithEthUrl.searchParams.append('fontFamily', options.fontFamily);
    }
    // Add timestamp to prevent loading a cached page.
    checkoutWithEthUrl.searchParams.append('date', Date.now().toString());
    return checkoutWithEthUrl;
  }, [
    address,
    appName,
    sdkClientSecret,
    receivingWalletType,
    options.colorPrimary,
    options.colorBackground,
    options.colorText,
    options.borderRadius,
    options.fontFamily,
  ]);

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
      <IFrameWrapper
        ref={iframeRef}
        id='checkout-with-eth-iframe'
        className=' mx-auto h-[350px] w-full transition-all'
        src={checkoutWithEthUrl.href}
        onLoad={onLoad}
        scrolling='no'
        allowTransparency
      />
    </>
  );
};
