import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_BRAND_OPTIONS,
  PAPER_APP_URL,
  PAPER_APP_URL_ALT,
} from '../constants/settings';
import { ICustomizationOptions } from '../interfaces/Customization';
import { Locale } from '../interfaces/Locale';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { ReviewResult } from '../interfaces/ReviewResult';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { resizeIframeToExpandedHeight } from '../lib/utils/resizeIframe';
import { usePaperSDKContext } from '../Provider';
import { IFrameWrapper } from './common/IFrameWrapper';
import { Modal } from './common/Modal';
import { Spinner } from './common/Spinner';

interface CheckoutWithCardProps {
  sdkClientSecret: string;
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
  locale?: Locale;
}

export const CheckoutWithCard = ({
  sdkClientSecret,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onReview,
  onError,
  locale,
  experimentalUseAltDomain = true,
}: CheckoutWithCardProps): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    // causes a double refresh
    setIsCardDetailIframeLoading(false);
  }, []);

  const CheckoutWithCardIframeRef = useRef<HTMLIFrameElement>(null);

  const [modalUrl, setModalUrl] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => {
    if (!CheckoutWithCardIframeRef.current) {
      return;
    }
    postMessageToIframe(
      CheckoutWithCardIframeRef.current,
      'checkoutWithCardCloseModal',
      {},
    );
    setIsOpen(false);
  };

  const paperDomain = experimentalUseAltDomain
    ? PAPER_APP_URL_ALT
    : PAPER_APP_URL;

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('event', event);
      if (!event.origin.startsWith(paperDomain)) {
        return;
      }

      const data = event.data;
      if (!CheckoutWithCardIframeRef.current) {
        console.log('undefine CheckoutWithCardRef');
        return;
      }

      switch (data.eventType) {
        case 'checkoutWithCardError':
          console.error('Error in Paper SDK CheckoutWithCard', data.error);
          if (onError) {
            onError({
              code: data.code as PaperSDKErrorCode,
              error: data.error,
            });
          }
          postMessageToIframe(
            CheckoutWithCardIframeRef.current,
            data.eventType,
            data,
          );
          break;

        case 'paymentSuccess':
          postMessageToIframe(
            CheckoutWithCardIframeRef.current,
            data.eventType,
            data,
          );

          if (onPaymentSuccess) {
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
          resizeIframeToExpandedHeight(CheckoutWithCardIframeRef.current);
          break;

        case 'openModalWithUrl':
          setModalUrl(data.url);
          setIsOpen(true);
          break;

        case 'completedSDKModal':
          closeModal();
          console.log('data', data);

          if (data.postToIframe) {
            postMessageToIframe(
              CheckoutWithCardIframeRef.current,
              data.eventType,
              data,
            );
          }
          break;
        case 'sizing': {
          if (CheckoutWithCardIframeRef.current) {
            CheckoutWithCardIframeRef.current.style.height = data.height + 'px';
            CheckoutWithCardIframeRef.current.style.maxHeight =
              data.height + 'px';
          }
          break;
        }
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
  const CheckoutWithCardUrl = useMemo(() => {
    const CheckoutWithCardUrl = new URL(
      '/sdk/2022-08-12/checkout-with-card',
      paperDomain,
    );

    CheckoutWithCardUrl.searchParams.append('sdkClientSecret', sdkClientSecret);
    if (appName) {
      CheckoutWithCardUrl.searchParams.append('appName', appName);
    }
    if (options.colorPrimary) {
      CheckoutWithCardUrl.searchParams.append(
        'colorPrimary',
        options.colorPrimary,
      );
    }
    if (options.colorBackground) {
      CheckoutWithCardUrl.searchParams.append(
        'colorBackground',
        options.colorBackground,
      );
    }
    if (options.colorText) {
      CheckoutWithCardUrl.searchParams.append('colorText', options.colorText);
    }
    if (options.borderRadius !== undefined) {
      CheckoutWithCardUrl.searchParams.append(
        'borderRadius',
        options.borderRadius.toString(),
      );
    }
    if (options.fontFamily) {
      CheckoutWithCardUrl.searchParams.append('fontFamily', options.fontFamily);
    }

    const localeToUse = locale === Locale.FR ? 'fr' : 'en';
    CheckoutWithCardUrl.searchParams.append('locale', localeToUse);

    return CheckoutWithCardUrl;
  }, [
    appName,
    sdkClientSecret,
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
          ref={CheckoutWithCardIframeRef}
          id='checkout-with-card-iframe'
          src={CheckoutWithCardUrl.href}
          onLoad={onCardDetailLoad}
          className='mx-auto h-36 w-full transition-all'
          allowTransparency
        />
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        bgColor={options.colorBackground || '#ffffff'}
      >
        {modalUrl && (
          <iframe
            id='review-card-payment-iframe'
            src={modalUrl}
            className='h-[700px] max-h-full w-96 max-w-full'
          />
        )}
      </Modal>
    </>
  );
};
