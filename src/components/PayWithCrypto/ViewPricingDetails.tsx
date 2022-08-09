import { Transition } from '@headlessui/react';
import { ethers } from 'ethers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccount, useSendTransaction, useSwitchNetwork } from 'wagmi';
import { DEFAULT_BRAND_OPTIONS, PAPER_APP_URL } from '../../constants/settings';
import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
  ReadMethodCallType,
  WriteMethodCallType,
} from '../../interfaces/CustomContract';
import { ICustomizationOptions } from '../../interfaces/Customization';
import {
  PaperSDKError,
  PayWithCryptoErrorCode,
} from '../../interfaces/PaperSDKError';
import { WalletType } from '../../interfaces/WalletTypes';
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
  }: {
    transactionResponse: ethers.providers.TransactionResponse;
  }) => void;
  onError?: (error: PaperSDKError) => void;
  suppressErrorToast?: boolean;
  checkoutId: string;
  recipientWalletAddress?: string;
  emailAddress?: string;
  quantity?: number;
  metadata?: Record<string, any>;
  mintMethod?: WriteMethodCallType;
  eligibilityMethod?: ReadMethodCallType;
  setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
  options?: ICustomizationOptions;
}

export const ViewPricingDetails = <T extends ContractType>({
  checkoutId,
  setIsTryingToChangeWallet,
  emailAddress,
  metadata,
  eligibilityMethod,
  mintMethod,
  onError,
  suppressErrorToast = false,
  onSuccess,
  quantity,
  recipientWalletAddress,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  ...props
}: CustomContractArgWrapper<ViewPricingDetailsProps, T>) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();
  const { address, connector } = useAccount();
  const { sendTransactionAsync, isLoading: isSendingTransaction } =
    useSendTransaction();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { contractType, contractArgs } =
    fetchCustomContractArgsFromProps(props);

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
          // try switching network first if needed or supported
          try {
            if (switchNetworkAsync) {
              await switchNetworkAsync(data.chainId);
            } else if (connector?.getChainId() !== data.chainId) {
              throw {
                isErrorObject: true,
                title: PayWithCryptoErrorCode.WrongChain,
                description: `Please change to ${data.chainName} to proceed.`,
              };
            }
          } catch (error) {
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
            const result = await sendTransactionAsync({
              chainId: data.chainId,
              request: {
                value: data.value,
                data: data.blob,
                to: data.paymentAddress,
              },
            });
            if (onSuccess) {
              onSuccess({ transactionResponse: result });
            }
            if (iframeRef.current) {
              postMessageToIframe(iframeRef.current, 'paymentSuccess', {
                suppressErrorToast,
                transactionHash: result.hash,
              });
            }
          } catch (error) {
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
  }, [isSendingTransaction]);

  const metadataStringified = JSON.stringify(metadata);
  const mintMethodStringified = JSON.stringify(mintMethod);
  const eligibilityMethodStringified = JSON.stringify(eligibilityMethod);
  const contractArgsStringified = JSON.stringify(contractArgs);

  const payWithCryptoUrl = useMemo(() => {
    // const payWithCryptoUrl = new URL('/sdk/v1/pay-with-crypto', PAPER_APP_URL);
    const payWithCryptoUrl = new URL('/sdk/v1/pay-with-crypto', PAPER_APP_URL);
    payWithCryptoUrl.searchParams.append('payerWalletAddress', address || '');
    payWithCryptoUrl.searchParams.append(
      'recipientWalletAddress',
      recipientWalletAddress || address || '',
    );
    payWithCryptoUrl.searchParams.append(
      'walletType',
      recipientWalletAddress ? WalletType.PRESET : connector?.name || '',
    );
    payWithCryptoUrl.searchParams.append('checkoutId', checkoutId);
    if (mintMethod) {
      payWithCryptoUrl.searchParams.append(
        'mintMethod',
        Buffer.from(mintMethodStringified, 'utf-8').toString('base64'),
      );
    }
    if (eligibilityMethod) {
      payWithCryptoUrl.searchParams.append(
        'eligibilityMethod',
        Buffer.from(eligibilityMethodStringified, 'utf-8').toString('base64'),
      );
    }
    if (appName) {
      payWithCryptoUrl.searchParams.append('appName', appName);
    }
    if (emailAddress) {
      payWithCryptoUrl.searchParams.append('emailAddress', emailAddress);
    }
    if (quantity) {
      payWithCryptoUrl.searchParams.append('quantity', quantity.toString());
    }
    if (metadata) {
      payWithCryptoUrl.searchParams.append('metadata', metadataStringified);
    }
    if (contractType) {
      payWithCryptoUrl.searchParams.append('contractType', contractType);
    }
    if (contractArgs) {
      payWithCryptoUrl.searchParams.append(
        'contractArgs',
        // Base 64 encode
        Buffer.from(contractArgsStringified, 'utf-8').toString('base64'),
      );
    }
    if (options.colorPrimary) {
      payWithCryptoUrl.searchParams.append(
        'colorPrimary',
        options.colorPrimary,
      );
    }
    if (options.colorBackground) {
      payWithCryptoUrl.searchParams.append(
        'colorBackground',
        options.colorBackground,
      );
    }
    if (options.colorText) {
      payWithCryptoUrl.searchParams.append('colorText', options.colorText);
    }
    if (options.borderRadius !== undefined) {
      payWithCryptoUrl.searchParams.append(
        'borderRadius',
        options.borderRadius.toString(),
      );
    }
    if (options.fontFamily) {
      payWithCryptoUrl.searchParams.append('fontFamily', options.fontFamily);
    }
    // Add timestamp to prevent loading a cached page.
    payWithCryptoUrl.searchParams.append('date', Date.now().toString());
    return payWithCryptoUrl;
  }, [
    recipientWalletAddress,
    address,
    checkoutId,
    appName,
    emailAddress,
    quantity,
    metadataStringified,
    mintMethodStringified,
    eligibilityMethodStringified,
    contractArgsStringified,
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
        id='pay-with-crypto-iframe'
        className=' mx-auto w-full transition-all'
        src={payWithCryptoUrl.href}
        onLoad={onLoad}
        scrolling='no'
        allowTransparency
      />
    </>
  );
};
