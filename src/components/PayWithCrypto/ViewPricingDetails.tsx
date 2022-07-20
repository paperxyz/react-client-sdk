import { ethers } from 'ethers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccount, useSendTransaction, useSwitchNetwork } from 'wagmi';
import { PAPER_APP_URL } from '../../constants/settings';
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
import { SignedPayload } from '../PayWithCard';

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
  setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
  signatureArgs?: SignedPayload;
}

export const ViewPricingDetails = ({
  checkoutId,
  setIsTryingToChangeWallet,
  emailAddress,
  metadata,
  signatureArgs,
  onError,
  suppressErrorToast = false,
  onSuccess,
  quantity,
  recipientWalletAddress,
}: ViewPricingDetailsProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();
  const { address, connector } = useAccount();
  const { sendTransactionAsync, isLoading: isSendingTransaction } =
    useSendTransaction();
  const { switchNetworkAsync } = useSwitchNetwork();
  const onLoad = useCallback(() => {
    // causes a double refresh
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
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isSendingTransaction]);

  const payWithCryptoUrl = useMemo(() => {
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
      payWithCryptoUrl.searchParams.append(
        'metadata',
        JSON.stringify(metadata),
      );
    }
    if (signatureArgs) {
      payWithCryptoUrl.searchParams.append(
        'signatureArgs',
        // Base 64 encode
        btoa(JSON.stringify(signatureArgs)),
      );
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
    JSON.stringify(metadata),
  ]);

  https: return (
    <>
      {isIframeLoading && (
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <Spinner className='!h-8 !w-8 !text-black' />
        </div>
      )}
      <IFrameWrapper
        ref={iframeRef}
        id='pay-with-crypto-iframe'
        className='mx-auto h-[700px] w-80'
        src={payWithCryptoUrl.href}
        onLoad={onLoad}
        scrolling='no'
      />
    </>
  );
};
