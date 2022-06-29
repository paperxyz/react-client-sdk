import React, { useEffect, useRef } from 'react';
import { DEFAULT_BRAND_OPTIONS } from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { ReviewResult } from '../interfaces/ReviewResult';
import { TransferSuccessResult } from '../interfaces/TransferSuccessResult';
import { openCenteredPopup } from '../lib/utils/popup';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../Provider';

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
  onReview?: (result: ReviewResult) => void;
  onClose?: () => void;
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
  onReview,
  onClose,
  onError,
}) => {
  const { chainName } = usePaperSDKContext();
  const reviewPaymentPopupWindowRef = useRef<Window | null>(null);

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (!event.origin.startsWith(PAPER_APP_URL)) {
      //   return;
      // }
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
          postMessageToIframe(payWithCardIframe, data.eventType, data);
          break;

        case 'paymentSuccess':
          if (onPaymentSuccess) {
            // If onPaymentSuccess is defined, close the popup and assume the caller wants to own the buyer experience after payment.
            if (reviewPaymentPopupWindowRef.current) {
              reviewPaymentPopupWindowRef.current.close();
            }
            onPaymentSuccess({ id: data.id });
          }
          postMessageToIframe(payWithCardIframe, data.eventType, data);
          break;

        case 'transferSuccess':
          if (onTransferSuccess) {
            // @ts-ignore
            onTransferSuccess({
              id: data.id,
              // ...
            });
          }
          postMessageToIframe(payWithCardIframe, data.eventType, data);
          break;

        case 'review':
          if (onReview) {
            onReview({ id: data.id });
          }
          break;

        case 'openReviewPaymentPopupWindow':
          reviewPaymentPopupWindowRef.current = openCenteredPopup({
            url: data.url,
            win: window,
            windowName: 'Paper Checkout',
            w: data.width,
            h: data.height,
          });
          if (onClose) {
            addOnCloseListener({
              window: reviewPaymentPopupWindowRef.current,
              contentWindow: payWithCardIframe?.contentWindow,
              onClose,
              contentWindowData: data,
            });
          }
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
  payWithCardUrl.searchParams.append('chainName', chainName);
  payWithCardUrl.searchParams.append(
    'recipientWalletAddress',
    recipientWalletAddress,
  );
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

const addOnCloseListener = ({
  window,
  onClose,
  contentWindow,
  contentWindowData,
}: {
  window?: any;
  onClose: () => void;
  contentWindow?: any;
  contentWindowData?: any;
}) => {
  if (!window) return;

  const CHECK_CLOSED_INTERVAL_MILLISECONDS = 500;
  const checkWindowClosedInterval = setInterval(function () {
    if (window.closed) {
      clearInterval(checkWindowClosedInterval);
      if (onClose) {
        onClose();
      }
      contentWindow?.postMessage({ ...contentWindowData }, '*');
    }
  }, CHECK_CLOSED_INTERVAL_MILLISECONDS);
};
