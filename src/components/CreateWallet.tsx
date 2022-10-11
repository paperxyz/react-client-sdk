import type { PaperSDKError, PaperUser } from '@paperxyz/js-client-sdk';
import {
  PaperSDKErrorCode,
  PAPER_APP_URL,
  Locale,
} from '@paperxyz/js-client-sdk';
import React, { useEffect, useRef } from 'react';
import { postMessageToIframe } from '../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../Provider';
import { Button } from './common/Button';

interface CreateWalletProps {
  emailAddress: string;
  onSuccess: (user: PaperUser) => void;
  onEmailVerificationInitiated?: () => void;
  onError?: (error: PaperSDKError) => void;
  redirectUrl?: string;
  clientId?: string;
  locale?: Locale;
  children?: ({
    createWallet,
  }: {
    createWallet: (email: string) => void;
  }) => React.ReactNode | React.ReactNode;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({
  emailAddress,
  redirectUrl,
  onSuccess,
  onEmailVerificationInitiated,
  onError,
  locale,
  clientId,
  children,
}) => {
  const { chainName } = usePaperSDKContext();
  const isChildrenFunction = typeof children === 'function';

  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const executeVerifyEmail = (emailAddressOverride?: string) => {
    if (iFrameRef.current) {
      postMessageToIframe(iFrameRef.current, 'verifyEmail', {
        email: !!emailAddressOverride ? emailAddressOverride : emailAddress,
        chainName,
        redirectUrl,
        clientId,
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
            accessCode: data.accessCode,
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
      {children && isChildrenFunction ? (
        children({ createWallet: executeVerifyEmail })
      ) : children ? (
        <a
          onClick={() => {
            executeVerifyEmail();
          }}
        >
          {children}
        </a>
      ) : (
        <Button
          onClick={() => {
            executeVerifyEmail();
          }}
        >
          Create Wallet
        </Button>
      )}
    </>
  );
};
