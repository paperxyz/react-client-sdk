import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaperUser } from '../interfaces/PaperUser';
import React, { useState, useEffect } from 'react';
import { usePaperSDKContext } from '../Provider';

interface VerifyEmailProps {
  emailAddress: string;
  onSuccess: (user: PaperUser) => void;
  onEmailVerificationInitiated?: () => void;
  onError?: (error: PaperSDKError) => void;
  children?: React.ReactNode;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
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
      // if (event.origin !== "https://paper.xyz") return;

      const data = event.data;
      console.log('data is ', data);

      if (data.eventType === 'verifyEmailEmailVerificationInitiated') {
        if (onEmailVerificationInitiated) {
          onEmailVerificationInitiated();
        } else {
          // TODO: Default modal if onEmailVerificationInitiated is not set
        }
      } else if (data.eventType === 'verifyEmailError') {
        console.error('Error in Paper SDK VerifyEmail', data.error);
        if (onError) {
          onError({ code: PaperSDKErrorCode.EmailNotVerified });
        }
      } else if (data.eventType === 'verifyEmailSuccess') {
        onSuccess({
          emailAddress: data.emailAddress,
          walletAddress: data.walletAddress,
        });
      }
    };

    window.addEventListener('message', handleMessage);
  }, []);

  const executeVerifyEmail = () => {
    setVerifyEmailExecuted(true);
  };

  return (
    <>
      {emailAddress && verifyEmailExecuted && (
        <>
          {emailAddress}
          <iframe
            src={`http://localhost:3000/sdk/v1/verify-email?email=${encodeURIComponent(
              emailAddress,
            )}&chainName=${chainName}`}
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
        <button onClick={executeVerifyEmail}>Verify Email</button>
      )}
    </>
  );
};
