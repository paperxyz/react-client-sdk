import type { CheckoutWithEthLinkArgs } from '@paperxyz/js-client-sdk';
import { createCheckoutWithEthLink } from '@paperxyz/js-client-sdk';
import type { ethers } from 'ethers';
import { useEffect, useState } from 'react';

export function useCheckoutWithEthLink({
  payingWalletSigner,
  sdkClientSecret,
  appName,
  locale,
  options,
  receivingWalletType,
  showConnectWalletOptions,
}: Omit<CheckoutWithEthLinkArgs, 'payingWalletSigner'> & {
  payingWalletSigner: ethers.Signer | undefined | null;
}) {
  const [checkoutWithEthUrl, setCheckoutWithEthUrl] = useState<URL | null>(
    null,
  );
  useEffect(() => {
    if (!payingWalletSigner || !sdkClientSecret) {
      return;
    }
    createCheckoutWithEthLink({
      payingWalletSigner,
      sdkClientSecret,
      appName,
      locale,
      options,
      receivingWalletType,
      showConnectWalletOptions,
    }).then((url) => {
      setCheckoutWithEthUrl(url);
    });
  }, [
    payingWalletSigner,
    sdkClientSecret,
    appName,
    locale,
    options,
    receivingWalletType,
    showConnectWalletOptions,
  ]);
  return { checkoutWithEthUrl };
}
