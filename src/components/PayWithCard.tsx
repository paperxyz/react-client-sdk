import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_BRAND_OPTIONS,
  PAPER_APP_URL,
  PAPER_APP_URL_ALT,
} from '../constants/settings';
import {
  ContractType,
  CustomContractArgWrapper,
  fetchCustomContractArgsFromProps,
  ReadMethodCallType,
  WriteMethodCallType,
} from '../interfaces/CustomContract';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { ReviewResult } from '../interfaces/ReviewResult';
import { TransferSuccessResult } from '../interfaces/TransferSuccessResult';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../Provider';
import { IFrameWrapper } from './common/IFrameWrapper';
import { Modal } from './common/Modal';
import { Spinner } from './common/Spinner';

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  emailAddress: string;
  mintMethod?: WriteMethodCallType;
  eligibilityMethod?: ReadMethodCallType;
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

  /**
   * If true, uses the papercheckout.com instead of paper.xyz domain.
   * This setting is useful if your users are unable to access the paper.xyz domain.
   *
   * Note: This setting is not meant for long term use. It may be removed at a future time in a minor version update.
   */
  experimentalUseAltDomain?: boolean;
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
  onTransferSuccess,
  onReview,
  onClose,
  onError,
  experimentalUseAltDomain,
  ...props
}: CustomContractArgWrapper<PayWithCardProps, T>): React.ReactElement => {
  const { appName } = usePaperSDKContext();
  const [isCardDetailIframeLoading, setIsCardDetailIframeLoading] =
    useState<boolean>(true);
  const onCardDetailLoad = useCallback(() => {
    // causes a double refresh
    setIsCardDetailIframeLoading(false);
  }, []);

  const [reviewPaymentUrl, setReviewPaymentUrl] = useState<
    string | undefined
  >();
  const [isOpen, setIsOpen] = useState(false);
  const { contractType, contractArgs } =
    fetchCustomContractArgsFromProps(props);

  const closeModal = () => {
    setIsOpen(false);
    const payWithCardIframe = document.getElementById(
      'payWithCardIframe',
    ) as HTMLIFrameElement;
    postMessageToIframe(payWithCardIframe, 'payWithCardCloseModal', {});

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
            // If onPaymentSuccess is defined, close the modal and assume the caller wants to own the buyer experience after payment.
            closeModal();
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

        case 'openReviewPaymentPopupWindow':
          setReviewPaymentUrl(new URL(data.url).href);
          setIsOpen(true);
          if (onReview) {
            onReview({
              id: data.id,
              cardholderName: data.cardholderName,
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

  const metadataStringified = JSON.stringify(metadata);
  const mintMethodStringified = JSON.stringify(mintMethod);
  const eligibilityMethodStringified = JSON.stringify(eligibilityMethod);
  const contractArgsStringified = JSON.stringify(contractArgs);
  // Build iframe URL with query params.
  const payWithCardUrl = useMemo(() => {
    const payWithCardUrl = new URL('/sdk/v1/pay-with-card', paperDomain);

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
