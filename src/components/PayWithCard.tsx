import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_BRAND_OPTIONS,
  PAPER_APP_URL,
  PAPER_APP_URL_ALT,
} from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { ReviewResult } from '../interfaces/ReviewResult';
import { TransferSuccessResult } from '../interfaces/TransferSuccessResult';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../Provider';
import { IFrameWrapper } from './common/IFrameWrapper';
import { Modal } from './common/Modal';

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  emailAddress: string;
  quantity?: number;
  metadata?: Record<string, any>;
  signatureArgs?: SignedPayload;
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

  /**
   * If true, uses the papercheckout.com instead of paper.xyz domain.
   * This setting is useful if your users are unable to access the paper.xyz domain.
   *
   * Note: This setting is not meant for long term use. It may be removed at a future time in a minor version update.
   */
  experimentalUseAltDomain?: boolean;
}

export type SignedPayload = {
  signedPayload: {
    payload: { [key: string]: any };
    signature: string;
  };
};

export const PayWithCard: React.FC<PayWithCardProps> = ({
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  signatureArgs,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onTransferSuccess,
  onReview,
  onClose,
  onError,
  experimentalUseAltDomain,
}) => {
  const { chainName } = usePaperSDKContext();
  const reviewPaymentPopupWindowRef = useRef<Window | null>(null);
  const [reviewPaymentUrl, setReviewPaymentUrl] = useState<
    string | undefined
  >();
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };
  const paperDomain = experimentalUseAltDomain
    ? PAPER_APP_URL_ALT
    : PAPER_APP_URL;

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.startsWith(paperDomain)) {
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
            onReview({
              id: data.id,
              cardholderName: data.cardholderName,
            });
          }
          break;

        case 'openReviewPaymentPopupWindow':
          setReviewPaymentUrl(new URL(data.url).href);
          setIsOpen(true);
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
  const payWithCardUrl = useMemo(() => {
    const payWithCardUrl = new URL('/sdk/v1/pay-with-card', paperDomain);

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
    if (signatureArgs) {
      payWithCardUrl.searchParams.append(
        'signatureArgs',
        // Base 64 encode
        btoa(JSON.stringify(signatureArgs)),
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
    return payWithCardUrl;
  }, [
    checkoutId,
    chainName,
    recipientWalletAddress,
    emailAddress,
    quantity,
    JSON.stringify(metadata),
    options.colorPrimary,
    options.colorBackground,
    options.colorText,
    options.borderRadius,
    options.fontFamily,
  ]);

  return (
    <>
      <IFrameWrapper
        id='payWithCardIframe'
        src={payWithCardUrl.href}
        width='100%'
        height='100%'
        allowTransparency
      />

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        bgColor={options.colorBackground || '#ffffff'}
      >
        {reviewPaymentUrl && (
          <iframe
            id='review-card-payment-iframe'
            src={reviewPaymentUrl}
            className='h-[700px] max-h-full w-96 max-w-full'
          />
        )}
      </Modal>
    </>
  );
};
