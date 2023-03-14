import {
  DEFAULT_BRAND_OPTIONS,
  ICustomizationOptions,
  Locale,
  PaperSDKError,
  PaperSDKErrorCode,
  PAPER_APP_URL,
  ReviewResult,
} from '@paperxyz/js-client-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
  ReadMethodCallType,
  WriteMethodCallType,
} from '../interfaces/CustomContract';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import {
  FULL_SCREEN_IFRAME_STYLE,
  resizeIframeToExpandedHeight,
} from '../lib/utils/resizeIframe';
import { iframeContainer } from '../lib/utils/styles';
import { usePaperSDKContext } from '../Provider';
import { IFrameWrapper } from './common/IFrameWrapper';
import { Modal } from './common/Modal';
import { SpinnerWrapper } from './common/SpinnerWrapper';

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  emailAddress: string;
  onPaymentSuccess: (result: PaymentSuccessResult) => void;
  mintMethod?: WriteMethodCallType;
  eligibilityMethod?: ReadMethodCallType;
  quantity?: number;
  metadata?: Record<string, any>;
  options?: ICustomizationOptions;
  onReview?: (result: ReviewResult) => void;
  onError?: (error: PaperSDKError) => void;

  /**
   * @deprecated No longer used.
   */
  experimentalUseAltDomain?: boolean;
  locale?: Locale;
}

export const PayWithCard = <T extends ContractType>({
  checkoutId,
  recipientWalletAddress,
  emailAddress,
  quantity,
  metadata,
  eligibilityMethod,
  mintMethod,
  options = {
    ...DEFAULT_BRAND_OPTIONS,
  },
  onPaymentSuccess,
  onReview,
  onError,
  locale,
  ...props
}: CustomContractArgWrapper<PayWithCardProps, T>): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    // causes a double refresh
    setIsCardDetailIframeLoading(false);
  }, []);

  const [modalUrl, setModalUrl] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const { contractType, contractArgs } =
    fetchCustomContractArgsFromProps(props);

  const closeModal = () => {
    const payWithCardIframe = document.getElementById(
      'payWithCardIframe',
    ) as HTMLIFrameElement;
    postMessageToIframe(payWithCardIframe, 'payWithCardCloseModal', {});
    setIsOpen(false);
  };

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
          postMessageToIframe(payWithCardIframe, data.eventType, data);
          break;

        case 'paymentSuccess':
          postMessageToIframe(payWithCardIframe, data.eventType, data);

          if (onPaymentSuccess) {
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

        case 'openModalWithUrl':
          setModalUrl(data.url);
          setIsOpen(true);
          break;

        case 'completedSDKModal':
          closeModal();
          if (data.postToIframe) {
            postMessageToIframe(payWithCardIframe, data.eventType, data);
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

  const metadataStringified = JSON.stringify(metadata);
  const mintMethodStringified = JSON.stringify(mintMethod);
  const eligibilityMethodStringified = JSON.stringify(eligibilityMethod);
  const contractArgsStringified = JSON.stringify(contractArgs);
  // Build iframe URL with query params.
  const payWithCardUrl = useMemo(() => {
    const payWithCardUrl = new URL('/sdk/v2/pay-with-card', PAPER_APP_URL);

    payWithCardUrl.searchParams.append('checkoutId', checkoutId);
    payWithCardUrl.searchParams.append(
      'recipientWalletAddress',
      recipientWalletAddress,
    );
    payWithCardUrl.searchParams.append('emailAddress', emailAddress);

    if (appName) {
      payWithCardUrl.searchParams.append('appName', appName);
    }
    if (quantity) {
      payWithCardUrl.searchParams.append('quantity', quantity.toString());
    }
    if (metadata) {
      payWithCardUrl.searchParams.append('metadata', metadataStringified);
    }
    if (mintMethod) {
      payWithCardUrl.searchParams.append(
        'mintMethod',
        Buffer.from(mintMethodStringified, 'utf-8').toString('base64'),
      );
    }
    if (eligibilityMethod) {
      payWithCardUrl.searchParams.append(
        'eligibilityMethod',
        Buffer.from(eligibilityMethodStringified, 'utf-8').toString('base64'),
      );
    }
    if (contractType) {
      payWithCardUrl.searchParams.append('contractType', contractType);
    }
    if (contractArgs) {
      payWithCardUrl.searchParams.append(
        'contractArgs',
        // Base 64 encode
        Buffer.from(contractArgsStringified, 'utf-8').toString('base64'),
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
    if (locale) {
      payWithCardUrl.searchParams.append('locale', locale);
    }

    return payWithCardUrl;
  }, [
    appName,
    checkoutId,
    recipientWalletAddress,
    emailAddress,
    quantity,
    metadataStringified,
    mintMethodStringified,
    eligibilityMethodStringified,
    contractArgsStringified,
    options.colorPrimary,
    options.colorBackground,
    options.colorText,
    options.borderRadius,
    options.fontFamily,
  ]);

  return (
    <>
      <div className={iframeContainer}>
        {isCardDetailIframeLoading && <SpinnerWrapper />}
        <IFrameWrapper
          id='payWithCardIframe'
          src={payWithCardUrl.href}
          onLoad={onCardDetailLoad}
          width='100%'
          height='100%'
          allowTransparency
        />
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        bgColor={options.colorBackground || '#ffffff'}
        isFullScreen
        hasCloseButton={false}
      >
        {modalUrl && (
          <iframe
            id='review-card-payment-iframe'
            src={modalUrl}
            style={FULL_SCREEN_IFRAME_STYLE}
            allow='camera'
          />
        )}
      </Modal>
    </>
  );
};
