import React, { useEffect } from 'react';
import { DEFAULT_BRAND_OPTIONS, PAPER_APP_URL } from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { TransferSuccessResult } from '../interfaces/TransferSuccessResult';
import { usePaperSDKContext } from '../Provider';

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  email?: string;
  quantity?: number;
  options?: {
    colorPrimary?: string;
    colorBackground?: string;
    colorText?: string;
    borderRadius?: number;
    fontFamily?: string;
  };
  onPaymentSuccess?: (result: PaymentSuccessResult) => void;
  onTransferSuccess?: (result: TransferSuccessResult) => void;
  onCancel?: () => void;
  onError?: (error: PaperSDKError) => void;
}

export const PayWithCard: React.FC<PayWithCardProps> = ({
  checkoutId,
  recipientWalletAddress,
  email,
  quantity,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onTransferSuccess,
  onCancel,
  onError,
}) => {
  const { chainName } = usePaperSDKContext();

  // Handle message events from iframe.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      switch (data.eventType) {
        case 'payWithCardError':
          console.error('Error in Paper SDK PayWithCard', data.error);
          if (onError) {
            onError({ code: data.errorCode as PaperSDKErrorCode });
          }
          break;

        case 'payWithCardCancel':
          console.error('Paper SDK PayWithCard cancelled');
          if (onCancel) {
            onCancel();
          }
          break;

        case 'payWithCardPaymentSuccess':
          if (onPaymentSuccess) {
            onPaymentSuccess({ id: data.id });
          }
          break;

        case 'payWithCardTransferSuccess':
          if (onTransferSuccess) {
            // @ts-ignore
            onTransferSuccess({
              id: data.id,
              // ...
            });
          }
          break;

        default:
        // Ignore unrecognized event
      }
    };

    window.addEventListener('message', handleMessage);
  }, []);

  // Build iframe URL with query params.
  const payWithCardUrl = new URL('/sdk/v1/pay-with-card', PAPER_APP_URL);

  payWithCardUrl.searchParams.append('checkoutId', checkoutId);
  payWithCardUrl.searchParams.append(
    'recipientWalletAddress',
    recipientWalletAddress,
  );
  payWithCardUrl.searchParams.append('chainName', chainName);
  if (email) {
    payWithCardUrl.searchParams.append('email', email);
  }
  if (quantity) {
    payWithCardUrl.searchParams.append('quantity', quantity.toString());
  }
  if (options.colorPrimary) {
    payWithCardUrl.searchParams.append('colorPrimary', options.colorPrimary);
  }
  if (options.colorBackground) {
    payWithCardUrl.searchParams.append(
      'colorBackground',
      options.colorBackground,
    );
  }
  if (options.colorText) {
    payWithCardUrl.searchParams.append('colorText', options.colorText);
  }
  if (options.borderRadius !== undefined) {
    payWithCardUrl.searchParams.append(
      'borderRadius',
      options.borderRadius.toString(),
    );
  }
  if (options.fontFamily) {
    payWithCardUrl.searchParams.append('fontFamily', options.fontFamily);
  }

  return (
    <iframe
      src={payWithCardUrl.href}
      width='100%'
      height='100%'
      allowTransparency
    />
  );
};
