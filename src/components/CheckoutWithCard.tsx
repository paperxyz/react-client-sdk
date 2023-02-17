import type {
  ICustomizationOptions,
  Locale,
  PaperSDKError,
  ReviewResult,
} from '@paperxyz/js-client-sdk';
import {
  createCheckoutWithCardElement,
  DEFAULT_BRAND_OPTIONS,
} from '@paperxyz/js-client-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { iframeContainer } from '../lib/utils/styles';
import { usePaperSDKContext } from '../Provider';
import { SpinnerWrapper } from './common/SpinnerWrapper';
var packageJson = require('../../package.json');

interface CheckoutWithCardProps {
  sdkClientSecret: string;
  onPaymentSuccess: (result: PaymentSuccessResult) => void;
  options?: ICustomizationOptions;
  onReview?: (result: ReviewResult) => void;
  onError?: (error: PaperSDKError) => void;

  /**
   * @deprecated No longer used.
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
  locale,
}: CheckoutWithCardProps): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    setIsCardDetailIframeLoading(false);
  }, []);
  const CheckoutWithCardIframeContainerRef = useRef<HTMLDivElement>(null);

  // Handle message events from the popup. Pass along the message to the iframe as well
  useEffect(() => {
    if (!CheckoutWithCardIframeContainerRef.current) {
      return;
    }
    createCheckoutWithCardElement({
      sdkClientSecret,
      appName,
      elementOrId: CheckoutWithCardIframeContainerRef.current,
      locale,
      onError,
      onLoad: onCardDetailLoad,
      onPaymentSuccess,
      onReview,
      options,
    });
  }, [CheckoutWithCardIframeContainerRef.current]);

  return (
    <>
      <div
        className={iframeContainer}
        ref={CheckoutWithCardIframeContainerRef}
        // Label the package version.
        data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
      >
        {isCardDetailIframeLoading && <SpinnerWrapper />}
      </div>
    </>
  );
};
