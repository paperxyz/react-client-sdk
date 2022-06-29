import { ethers } from 'ethers';
import React, { useEffect, useRef } from 'react';
import { useAccount, useSwitchNetwork } from 'wagmi';
import { PAPER_APP_URL } from '../../constants/settings';
import { WalletType } from '../../interfaces/WalletTypes';
import { useSendEth } from '../../lib/hooks/useSendEth';
import { postMessageToIframe } from '../../lib/utils/postMessageToIframe';

export type PayWithCryptoError = {
  /**
   * An enum representing the error encountered.
   * The value is a human-readable, English message describing the error.
   */
  code: PayWithCryptoErrorCode;
  error: Error;
};

export enum PayWithCryptoErrorCode {
  ErrorConnectingToSigner = 'No wallet present',
  ErrorSendingTransaction = 'Something went wrong sending transaction',
}

export interface PayWithCryptoChildrenProps {
  openModal: () => void;
}

export interface ViewPricingDetailsProps {
  onSuccess?: (
    transactionResponse: ethers.providers.TransactionResponse,
  ) => void;
  onError?: (error: PayWithCryptoError) => void;
  suppressErrorToast?: boolean;
  checkoutId: string;
  appName?: string;
  recipientWalletAddress?: string;
  emailAddress?: string;
  quantity?: number;
  metadata?: Record<string, any>;
  setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ViewPricingDetails = ({
  checkoutId,
  setIsTryingToChangeWallet,
  appName,
  emailAddress,
  metadata,
  onError,
  suppressErrorToast = false,
  onSuccess,
  quantity,
  recipientWalletAddress,
}: ViewPricingDetailsProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { address, connector } = useAccount();
  const { sendTransaction } = useSendEth(
    async (data) => {
      if (onSuccess) {
        onSuccess(data);
      }
    },
    (error) => {
      if (onError) {
        onError({
          code: PayWithCryptoErrorCode.ErrorSendingTransaction,
          error,
        });
      }
      if (!suppressErrorToast) {
        if (error.message.includes('rejected')) {
          if (iframeRef.current) {
            postMessageToIframe(
              iframeRef.current,
              'userRejectedTransaction',
              {},
            );
          }
        } else if (error.message.includes('insufficient funds')) {
          if (iframeRef.current) {
            postMessageToIframe(iframeRef.current, 'insufficientBalance', {});
          }
        } else {
          if (iframeRef.current) {
            postMessageToIframe(iframeRef.current, 'errorSendingTransaction', {
              error: error.message,
            });
          }
        }
      }
    },
  );

  const { switchNetwork } = useSwitchNetwork({
    onError(error) {
      console.log('error switching chain', error);
      if (iframeRef.current) {
        postMessageToIframe(iframeRef.current, 'networkSwitchFailed', {});
      }
    },
    onSuccess() {
      if (iframeRef.current) {
        postMessageToIframe(iframeRef.current, 'networkSwitched', {});
      }
    },
  });

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
          console.log('data', data);
          sendTransaction({
            data: data.blob,
            chainId: data.chainId,
            value: data.value,
            paymentAddress: data.paymentAddress,
          });
          break;
        }
        case 'switchNetwork': {
          if (switchNetwork) {
            switchNetwork(data.chainId);
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
  }, []);
  const payWithCryptoUrl = new URL('/sdk/v1/pay-with-crypto', PAPER_APP_URL);

  payWithCryptoUrl.searchParams.append('payerWalletAddress', address || '');
  payWithCryptoUrl.searchParams.append(
    'recipientWalletAddress',
    recipientWalletAddress || address || '',
  );
  payWithCryptoUrl.searchParams.append(
    'walletType',
    recipientWalletAddress ? WalletType.PRESET : connector?.id || '',
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
    payWithCryptoUrl.searchParams.append('metadata', JSON.stringify(metadata));
  }
  // Add timestamp to prevent loading a cached page.
  payWithCryptoUrl.searchParams.append('date', Date.now().toString());

  return (
    <>
      {/* {isIframeLoading && (
    <Spinner className='absolute top-1/2 left-1/2 !h-8 !w-8 !text-black' />
  )} */}
      <iframe
        ref={iframeRef}
        id='payWithCardIframe'
        className='mx-auto h-[700px] w-80'
        src={payWithCryptoUrl.href}
        // onLoad={() => {
        // causes a double refresh
        // setIsIframeLoading(false);
        // }}
        scrolling='no'
      />
    </>
  );
};
