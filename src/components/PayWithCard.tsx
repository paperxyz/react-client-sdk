import React, { useEffect, useRef } from 'react';
import { DEFAULT_BRAND_OPTIONS, PAPER_APP_URL } from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { TransferSuccessResult } from '../interfaces/TransferSuccessResult';
import { usePaperSDKContext } from '../Provider';

/**
 * Opens a popup centered on the parent page and returns a reference to the window.
 * The caller can close the popup with `popupWindow.close()`.
 * @returns The Window that was popped up
 */
export const openCenteredPopup = ({
  url,
  title = 'Paper Checkout',
  width,
  height,
}: {
  url: string;
  title?: string;
  width: number;
  height: number;
}): Window | null => {
  if (!window?.top) {
    return null;
  }

  const y = window.top.outerHeight / 2 + window.top.screenY - height / 2;
  const x = window.top.outerWidth / 2 + window.top.screenX - width / 2;
  return window.open(
    url,
    title,
    `toolbar=no,
    location=no,
    status=no,
    menubar=no,
    scrollbars=yes,
    resizable=yes,
    width=${width},
    height=${height},
    top=${y},
    left=${x}`,
  );
};

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  emailAddress: string;
  quantity?: number;
  metadata?: Record<string, any>;
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
  emailAddress,
  quantity,
  metadata,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onTransferSuccess,
  onCancel,
  onError,
}) => {
  const { chainName } = usePaperSDKContext();
  const reviewPaymentPopupWindowRef = useRef<Window | null>(null);

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.startsWith(PAPER_APP_URL)) {
        return;
      }
      const data = event.data;
      const payWithCardIframe = document.getElementById(
        'payWithCardIframe',
      ) as HTMLIFrameElement;

      switch (data.eventType) {
        case 'payWithCardError':
          console.error('Error in Paper SDK PayWithCard', data.error);
          if (onError) {
            onError({
              code: data.code as PaperSDKErrorCode,
              error: data.error,
            });
          }
          payWithCardIframe?.contentWindow?.postMessage(
            {
              ...data,
            },
            '*',
          );
          break;

        case 'payWithCardCancel':
          console.error('Paper SDK PayWithCard cancelled');
          if (onCancel) {
            onCancel();
          }
          payWithCardIframe?.contentWindow?.postMessage(
            {
              ...data,
            },
            '*',
          );
          break;

        case 'paymentSuccess':
          if (onPaymentSuccess) {
            // If onPaymentSuccess is defined, close the popup and assume the caller wants to own the buyer experience after payment.
            if (reviewPaymentPopupWindowRef.current) {
              reviewPaymentPopupWindowRef.current.close();
            }
            onPaymentSuccess({ id: data.id });
          }
          payWithCardIframe?.contentWindow?.postMessage(
            {
              ...data,
            },
            '*',
          );
          break;

        case 'transferSuccess':
          if (onTransferSuccess) {
            // @ts-ignore
            onTransferSuccess({
              id: data.id,
              // ...
            });
          }
          payWithCardIframe?.contentWindow?.postMessage(
            {
              ...data,
            },
            '*',
          );
          break;

        case 'openReviewPaymentPopupWindow':
          reviewPaymentPopupWindowRef.current = openCenteredPopup({
            url: data.url,
            width: data.width,
            height: data.height,
          });
          break;

        default:
        // Ignore unrecognized event
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Build iframe URL with query params.
  const payWithCardUrl = new URL('/sdk/v1/pay-with-card', PAPER_APP_URL);

  payWithCardUrl.searchParams.append('checkoutId', checkoutId);
  payWithCardUrl.searchParams.append(
    'recipientWalletAddress',
    recipientWalletAddress,
  );
  payWithCardUrl.searchParams.append('chainName', chainName);
  if (emailAddress) {
    payWithCardUrl.searchParams.append('emailAddress', emailAddress);
  }
  if (quantity) {
    payWithCardUrl.searchParams.append('quantity', quantity.toString());
  }
  if (metadata) {
    payWithCardUrl.searchParams.append(
      'metadata',
      encodeURIComponent(JSON.stringify(metadata)),
    );
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

  // Add timestamp to prevent loading a cached page.
  payWithCardUrl.searchParams.append('date', Date.now().toString());

  return (
    <iframe
      id='payWithCardIframe'
      src={payWithCardUrl.href}
      width='100%'
      height='100%'
      allowTransparency
    />
  );
};
