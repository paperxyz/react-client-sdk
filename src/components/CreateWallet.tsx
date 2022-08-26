import React, { useEffect, useRef } from 'react';
import { PAPER_APP_URL } from '../constants/settings';
import { Locale } from '../interfaces/Locale';
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
  locale?: Locale;
  children?: React.ReactNode;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({
  emailAddress,
  redirectUrl,
  onSuccess,
  onEmailVerificationInitiated,
  onError,
  locale,
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

  // Build iframe URL with query params.
  const createWalletUrl = new URL('/sdk/v2/verify-email', PAPER_APP_URL);

  const localeToUse = locale === Locale.FR ? 'fr' : 'en';
  createWalletUrl.searchParams.append('locale', localeToUse);

  return (
    <>
      <iframe
        ref={iFrameRef}
        src={createWalletUrl.href}
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
