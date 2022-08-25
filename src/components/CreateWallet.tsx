import React, { useEffect, useRef } from 'react';
import { PAPER_APP_URL } from '../constants/settings';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaperUser } from '../interfaces/PaperUser';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../Provider';
import { Button } from './common/Button';

interface CreateWalletProps {
  emailAddress: string;
  onSuccess: (user: PaperUser) => void;
  onEmailVerificationInitiated?: () => void;
  onError?: (error: PaperSDKError) => void;
  redirectUrl?: string;
  children?: React.ReactNode;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({
  emailAddress,
  redirectUrl,
  onSuccess,
  onEmailVerificationInitiated,
  onError,
  children,
}) => {
  const { chainName } = usePaperSDKContext();
  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const executeVerifyEmail = () => {
    if (iFrameRef.current) {
      postMessageToIframe(iFrameRef.current, 'verifyEmail', {
        email: emailAddress,
        chainName,
        redirectUrl,
      });
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== PAPER_APP_URL) return;

      const data = event.data;
      switch (data.eventType) {
        case 'verifyEmailEmailVerificationInitiated': {
          if (onEmailVerificationInitiated) {
            onEmailVerificationInitiated();
          }
          break;
        }
        case 'verifyEmailError': {
          console.error('Error in Paper SDK VerifyEmail', data.error);
          if (onError) {
            onError({
              code: PaperSDKErrorCode.EmailNotVerified,
              error: data.error,
            });
          }
          break;
        }
        case 'verifyEmailSuccess': {
          onSuccess({
            emailAddress: data.emailAddress,
            walletAddress: data.walletAddress,
          });
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <>
      <iframe
        ref={iFrameRef}
        src={`${PAPER_APP_URL}/sdk/v1/verify-email`}
        style={{
          width: '0px',
          height: '0px',
          visibility: 'hidden',
        }}
      />
      {children ? (
        <a onClick={executeVerifyEmail}>{children}</a>
      ) : (
        <Button onClick={executeVerifyEmail}>Verify Email</Button>
      )}
    </>
  );
};
