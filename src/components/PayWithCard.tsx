import React, { useEffect } from 'react';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaymentSuccessResult } from '../interfaces/PaymentSuccessResult';
import { usePaperSDKContext } from '../Provider';

interface PayWithCardProps {
  checkoutId: string;
  recipientWalletAddress: string;
  onSuccess: (result: PaymentSuccessResult) => void;
  onCancel?: () => void;
  onError?: (error: PaperSDKError) => void;
}

export const PayWithCard: React.FC<PayWithCardProps> = ({
  checkoutId,
  recipientWalletAddress,
  onSuccess,
  onCancel,
  onError,
}) => {
  const { chainName } = usePaperSDKContext();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (event.origin !== "https://paper.xyz") return;

      const data = event.data;
      console.log('data is ', data);

      if (data.eventType === 'payWithCardError') {
        console.error('Error in Paper SDK PayWithCard', data.error);
        if (onError) {
          onError({ code: data.errorCode as PaperSDKErrorCode });
        }
      } else if (data.eventType === 'payWithCardCancel') {
        console.error('Paper SDK PayWithCard cancelled');
        if (onCancel) {
          onCancel();
        }
      } else if (data.eventType === 'payWithCardSuccess') {
        onSuccess({ id: 'TODO' });
      }
    };

    window.addEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {checkoutId && recipientWalletAddress && chainName && (
        <>
          <iframe
            src={`http://localhost:3000/sdk/v1/pay-with-card?checkoutId=${checkoutId}&recipientWalletAddress=${recipientWalletAddress}&chainName=${chainName}`}
          ></iframe>
        </>
      )}
    </>
  );
};
