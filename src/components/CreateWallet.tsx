import type { Locale, } from '@paperxyz/js-client-sdk';
import {
  createWallet,
  initialiseCreateWallet,
  PaperSDKError,
  PaperUser,
} from '@paperxyz/js-client-sdk';
import React, { useEffect } from 'react';
import { usePaperSDKContext } from '../Provider';
import { Button } from './common/Button';
var packageJson = require('../../package.json');

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

  useEffect(() => {
    initialiseCreateWallet({
      onSuccess,
      onEmailVerificationInitiated,
      onError,
      locale,
    });
  }, []);

  const executeVerifyEmail = async (emailAddressOverride?: string) => {
    await createWallet({
      chainName,
      emailAddress: emailAddressOverride ? emailAddressOverride : emailAddress,
      clientId,
      redirectUrl,
    });
  };

  return (
    <>
      {children && isChildrenFunction ? (
        children({ createWallet: executeVerifyEmail })
      ) : children ? (
        <div
          onClick={() => {
            executeVerifyEmail();
          }}
          data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
        >
          {children}
        </div>
      ) : (
        <Button
          onClick={() => {
            executeVerifyEmail();
          }}
          data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
        >
          Create Wallet
        </Button>
      )}
    </>
  );
};
