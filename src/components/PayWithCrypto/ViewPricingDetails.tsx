import { Transition } from '@headlessui/react';
import {
  DEFAULT_BRAND_OPTIONS,
  ICustomizationOptions,
  Locale,
  PaperSDKError,
  PAPER_APP_URL,
  PayWithCryptoErrorCode,
} from '@paperxyz/js-client-sdk';
import { ethers } from 'ethers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
  ReadMethodCallType,
  WriteMethodCallType,
} from '../../interfaces/CustomContract';
import { WalletType } from '../../interfaces/WalletTypes';
import { useAccount } from '../../lib/hooks/useAccount';
import { useSendTransaction } from '../../lib/hooks/useSendTransaction';
import { useSwitchNetwork } from '../../lib/hooks/useSwitchNetwork';
import { handlePayWithCryptoError } from '../../lib/utils/handleError';
import { postMessageToIframe } from '../../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../../Provider';
import { IFrameWrapper } from '../common/IFrameWrapper';
import { SpinnerWrapper } from '../common/SpinnerWrapper';
import { commonTransitionProps } from '../../lib/utils/styles';
import { css } from '@emotion/css';

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
  checkoutId: string;
  recipientWalletAddress?: string;
  emailAddress?: string;
  quantity?: number;
  metadata?: Record<string, any>;
  mintMethod?: WriteMethodCallType;
  eligibilityMethod?: ReadMethodCallType;
  setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
  setUpSigner?: (args: { chainId: number }) => void | Promise<void>;
  signer?: ethers.Signer;
  walletType?: 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet' | string;
  showConnectWalletOptions?: boolean;
  options?: ICustomizationOptions;
  locale?: Locale;
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
  showConnectWalletOptions = true,
  onSuccess,
  quantity,
  setUpSigner,
  signer,
  recipientWalletAddress,
  walletType,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  locale,
  ...props
}: CustomContractArgWrapper<ViewPricingDetailsProps, T>) => {
  const { contractType, contractArgs } =
    fetchCustomContractArgsFromProps(props);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();

  const { address, connector, chainId } = useAccount({ signer });
  const { sendTransactionAsync, isSendingTransaction } = useSendTransaction({
    signer,
  });
  const { switchNetworkAsync } = useSwitchNetwork({ signer });

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
          if (signer && setUpSigner) {
            try {
              console.log('setting up signer');
              await setUpSigner({ chainId: data.chainId });
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
              mode: 'recklesslyUnprepared',
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
  }, [isSendingTransaction, address, chainId, signer, setUpSigner]);

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
      recipientWalletAddress
        ? walletType || WalletType.Preset
        : connector?.name || '',
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
    if (!!showConnectWalletOptions) {
      payWithCryptoUrl.searchParams.append('showConnectWalletOptions', 'true');
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

    const localeToUse = locale === Locale.FR ? 'fr' : 'en';
    payWithCryptoUrl.searchParams.append('locale', localeToUse);

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
        {...commonTransitionProps}
      >
        <SpinnerWrapper />
      </Transition>
      <IFrameWrapper
        ref={iframeRef}
        id='pay-with-crypto-iframe'
        className={css`
          margin-left: auto;
          margin-right: auto;
          transition-property: all;
          width: 100%;
          height: 350px;
        `}
        src={payWithCryptoUrl.href}
        onLoad={onLoad}
        scrolling='no'
        allowTransparency
      />
    </>
  );
};
