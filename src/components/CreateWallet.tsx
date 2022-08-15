import React, { useEffect, useState } from 'react';
import { PAPER_APP_URL } from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaperUser } from '../interfaces/PaperUser';
import { usePaperSDKContext } from '../Provider';
import { Button } from './common/Button';

interface CreateWalletProps {
  emailAddress: string;
  onSuccess: (user: PaperUser) => void;
  onEmailVerificationInitiated?: () => void;
  onError?: (error: PaperSDKError) => void;
  children?: React.ReactNode;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({
  emailAddress,
  onSuccess,
  onEmailVerificationInitiated,
  onError,
  children,
}) => {
  const [verifyEmailExecuted, setVerifyEmailExecuted] =
    useState<boolean>(false);
  const { chainName } = usePaperSDKContext();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (event.origin !== PAPER_APP_URL) return;

      const data = event.data;

      if (data.eventType === 'verifyEmailEmailVerificationInitiated') {
        if (onEmailVerificationInitiated) {
          onEmailVerificationInitiated();
        } else {
          // TODO: Default modal if onEmailVerificationInitiated is not set
        }
      } else if (data.eventType === 'verifyEmailError') {
        console.error('Error in Paper SDK VerifyEmail', data.error);
        if (onError) {
          onError({
            code: PaperSDKErrorCode.EmailNotVerified,
            error: data.error,
          });
        }
      } else if (data.eventType === 'verifyEmailSuccess') {
        onSuccess({
          emailAddress: data.emailAddress,
          walletAddress: data.walletAddress,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const executeVerifyEmail = () => {
    setVerifyEmailExecuted(true);
  };

  return (
    <>
      {emailAddress && verifyEmailExecuted && (
        <>
          <iframe
            src={`${PAPER_APP_URL}/sdk/v1/verify-email?email=${encodeURIComponent(
              emailAddress,
            )}&chainName=${chainName}&date=${Date.now().toString()}`}
            style={{
              width: '0px',
              height: '0px',
              visibility: 'hidden',
            }}
          ></iframe>
        </>
      )}
      {children ? (
        <a onClick={executeVerifyEmail}>{children}</a>
      ) : (
        <Button onClick={executeVerifyEmail}>Verify Email</Button>
      )}
    </>
  );
};
