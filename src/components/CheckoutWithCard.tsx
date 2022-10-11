import {
  createCheckoutWithCardElement,
  DEFAULT_BRAND_OPTIONS,
} from '@paperxyz/js-client-sdk';
import type {
  ICustomizationOptions,
  Locale,
  ReviewResult,
  PaperSDKError,
} from '@paperxyz/js-client-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { usePaperSDKContext } from '../Provider';
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
   * Defaults to true.
   */
  experimentalUseAltDomain?: boolean;

  /**
   * Sets the locale to a supported language.
   * NOTE: Localization is in early alpha and many languages are not yet supported.
   *
   * Defaults to English.
   */
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
  experimentalUseAltDomain,
  locale,
}: CheckoutWithCardProps): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    setIsCardDetailIframeLoading(false);
  }, []);

  // const CheckoutWithCardIframeRef = useRef<HTMLIFrameElement>(null);
  const CheckoutWithCardIframeContainerRef = useRef<HTMLDivElement>(null);

  const [modalUrl, setModalUrl] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => {
    setIsOpen(false);
  };

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    if (!CheckoutWithCardIframeContainerRef.current) {
      return;
    }
    createCheckoutWithCardElement({
      onCloseKycModal() {
        console.log('called close modal');
        closeModal();
      },
      onOpenKycModal({ iframeLink }) {
        setModalUrl(iframeLink);
        setIsOpen(true);
      },
      sdkClientSecret,
      appName,
      elementOrId: CheckoutWithCardIframeContainerRef.current,
      locale,
      onError,
      onLoad: onCardDetailLoad,
      onPaymentSuccess,
      onReview,
      options,
      useAltDomain: experimentalUseAltDomain,
    });
  }, [CheckoutWithCardIframeContainerRef.current]);

  return (
    <>
      <div
        className='relative h-full w-full'
        ref={CheckoutWithCardIframeContainerRef}
      >
        {isCardDetailIframeLoading && (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
            <Spinner className='!h-8 !w-8 !text-black' />
          </div>
        )}
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
            allow='camera'
          />
        )}
      </Modal>
    </>
  );
};
