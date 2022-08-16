import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_BRAND_OPTIONS,
  PAPER_APP_URL,
  PAPER_APP_URL_ALT,
} from '../../constants/settings';
import { ICustomizationOptions } from '../../interfaces/Customization';
import {
  PaperSDKError,
  PaperSDKErrorCode,
} from '../../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../../interfaces/PaymentSuccessResult';
import { ReviewResult } from '../../interfaces/ReviewResult';
import { postMessageToIframe } from '../../lib/utils/postMessageToIframe';
import { resizeIframeToExpandedHeight } from '../../lib/utils/resizeIframe';
import { usePaperSDKContext } from '../../Provider';
import { IFrameWrapper } from '../common/IFrameWrapper';
import { Spinner } from '../common/Spinner';

interface CheckoutWithCardProps {
  checkoutSdkIntent: string;
  onPaymentSuccess: (result: PaymentSuccessResult) => void;
  options?: ICustomizationOptions;
  onReview?: (result: ReviewResult) => void;
  onError?: (error: PaperSDKError) => void;

  /**
   * If true, uses the papercheckout.com instead of paper.xyz domain.
   * This setting is useful if your users are unable to access the paper.xyz domain.
   *
   * Note: This setting is not meant for long term use. It may be removed at a future time in a minor version update.
   */
  experimentalUseAltDomain?: boolean;
}

export const PayWithCard = ({
  checkoutSdkIntent,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onReview,
  onError,
  experimentalUseAltDomain,
}: CheckoutWithCardProps): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    // causes a double refresh
    setIsCardDetailIframeLoading(false);
  }, []);

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
          postMessageToIframe(payWithCardIframe, data.eventType, data);

          if (onPaymentSuccess) {
            console.log('onPaymentSuccess is set.');
            // If onPaymentSuccess is defined, close the modal and assume the caller wants to own the buyer experience after payment.
            onPaymentSuccess({ id: data.id });
          }
          break;

        case 'reviewComplete':
          if (onReview) {
            onReview({
              id: data.id,
              cardholderName: data.cardholderName,
            });
          }
          resizeIframeToExpandedHeight(payWithCardIframe);
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
    const payWithCardUrl = new URL(
      '/sdk/2022-08-12/checkout-with-card',
      paperDomain,
    );

    payWithCardUrl.searchParams.append('checkoutSdkIntent', checkoutSdkIntent);
    if (appName) {
      payWithCardUrl.searchParams.append('appName', appName);
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
    appName,
    checkoutSdkIntent,
    options.colorPrimary,
    options.colorBackground,
    options.colorText,
    options.borderRadius,
    options.fontFamily,
  ]);

  return (
    <>
      <div className='relative h-full w-full'>
        {isCardDetailIframeLoading && (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
            <Spinner className='!h-8 !w-8 !text-black' />
          </div>
        )}
        <IFrameWrapper
          id='payWithCardIframe'
          src={payWithCardUrl.href}
          onLoad={onCardDetailLoad}
          width='100%'
          height='100%'
          allowTransparency
        />
      </div>
    </>
  );
};
