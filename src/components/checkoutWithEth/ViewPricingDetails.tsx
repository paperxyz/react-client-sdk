import { css } from '@emotion/css';
import type {
  CheckoutWithEthLinkArgs,
  CheckoutWithEthMessageHandlerArgs,
} from '@paperxyz/js-client-sdk';
import {
  DEFAULT_BRAND_OPTIONS,
  PayWithCryptoErrorCode,
  PAY_WITH_ETH_ERROR,
} from '@paperxyz/js-client-sdk';
import type { ethers } from 'ethers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccount } from '../../lib/hooks/useAccount';
import { useCheckoutWithEthLink } from '../../lib/hooks/useCheckoutWithEthLink';
import { useSendTransaction } from '../../lib/hooks/useSendTransaction';
import { useSwitchNetwork } from '../../lib/hooks/useSwitchNetwork';
import { handlePayWithCryptoError } from '../../lib/utils/handleError';
import { postMessageToIframe } from '../../lib/utils/postMessageToIframe';
import { usePaperSDKContext } from '../../Provider';
import { IFrameWrapper } from '../common/IFrameWrapper';
import { SpinnerWrapper } from '../common/SpinnerWrapper';

export interface PayWithCryptoChildrenProps {
  openModal: () => void;
}

export type ViewPricingDetailsProps = Omit<
  Omit<CheckoutWithEthLinkArgs, 'appName'>,
  'payingWalletSigner'
> &
  Omit<
    Omit<CheckoutWithEthMessageHandlerArgs, 'iframe'>,
    'payingWalletSigner'
  > & {
    setIsTryingToChangeWallet: React.Dispatch<React.SetStateAction<boolean>>;
    payingWalletSigner?: ethers.Signer;
  };

export const ViewPricingDetails = ({
  setIsTryingToChangeWallet,
  onSuccess,
  onError,
  suppressErrorToast = false,
  showConnectWalletOptions = true,
  payingWalletSigner: signer,
  receivingWalletType,
  setUpUserPayingWalletSigner,
  locale,
  sdkClientSecret,
  options: _options,
}: ViewPricingDetailsProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const { appName } = usePaperSDKContext();
  const { chainId } = useAccount({
    signer,
  });
  const { switchNetworkAsync } = useSwitchNetwork({
    signer,
  });
  const { sendTransactionAsync } = useSendTransaction({
    signer,
  });
  const options = useMemo(() => {
    return (
      _options || {
        ...DEFAULT_BRAND_OPTIONS,
      }
    );
  }, [_options]);
  const { checkoutWithEthUrl } = useCheckoutWithEthLink({
    payingWalletSigner: signer,
    sdkClientSecret,
    appName,
    locale,
    options,
    receivingWalletType,
    showConnectWalletOptions,
  });

  const onLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);
  useEffect(() => {
    if (!iframeRef.current || !signer) {
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      // additional event listener for react client
      // This allows us to have the ability to have wallet connection handled by the SDK
      const { data } = event;
      switch (data.eventType) {
        case 'payWithEth': {
          if (data.error) {
            handlePayWithCryptoError(
              new Error(data.error) as Error,
              onError,
              (errorObject) => {
                if (iframeRef.current) {
                  postMessageToIframe(iframeRef.current, PAY_WITH_ETH_ERROR, {
                    error: errorObject,
                    suppressErrorToast,
                  });
                }
              },
            );
            return;
          }
          // Allows Dev's to inject any chain switching for their custom signer here.
          if (signer && setUpUserPayingWalletSigner) {
            try {
              console.log('setting up signer');
              await setUpUserPayingWalletSigner({ chainId: data.chainId });
            } catch (error) {
              console.log('error setting up signer', error);
              handlePayWithCryptoError(
                error as Error,
                onError,
                (errorObject) => {
                  if (iframeRef.current) {
                    postMessageToIframe(iframeRef.current, PAY_WITH_ETH_ERROR, {
                      error: errorObject,
                      suppressErrorToast,
                    });
                  }
                },
              );
              return;
            }
          }

          // try switching network first if needed or supported
          try {
            if (chainId !== data.chainId && switchNetworkAsync) {
              console.log('switching signer network');
              await switchNetworkAsync(data.chainId);
            } else if (chainId !== data.chainId) {
              throw {
                isErrorObject: true,
                title: PayWithCryptoErrorCode.WrongChain,
                description: `Please change to ${data.chainName} to proceed.`,
              };
            }
          } catch (error) {
            console.log('error switching network');
            handlePayWithCryptoError(error as Error, onError, (errorObject) => {
              if (iframeRef.current) {
                postMessageToIframe(iframeRef.current, PAY_WITH_ETH_ERROR, {
                  error: errorObject,
                  suppressErrorToast,
                });
              }
            });
            return;
          }

          // send the transaction
          try {
            console.log('sending funds');
            const result = await sendTransactionAsync?.({
              chainId: data.chainId,
              request: {
                value: data.value,
                data: data.blob,
                to: data.paymentAddress,
              },
              mode: 'recklesslyUnprepared',
            });
            if (onSuccess && result) {
              onSuccess({
                transactionResponse: result,
                transactionId: data.transactionId,
              });
            }
            if (iframeRef.current && result) {
              postMessageToIframe(iframeRef.current, 'paymentSuccess', {
                suppressErrorToast,
                transactionHash: result.hash,
              });
            }
          } catch (error) {
            console.log('error sending funds', error);
            handlePayWithCryptoError(error as Error, onError, (errorObject) => {
              if (iframeRef.current) {
                postMessageToIframe(iframeRef.current, PAY_WITH_ETH_ERROR, {
                  error: errorObject,
                  suppressErrorToast,
                });
              }
            });
          }
          break;
        }
        case 'goBackToChoosingWallet':
          setIsTryingToChangeWallet(true);
          break;
        case 'checkout-with-eth-sizing': {
          if (iframeRef.current) {
            iframeRef.current.style.height = data.height + 'px';
            iframeRef.current.style.maxHeight = data.height + 'px';
          }
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    signer,
    chainId,
    setUpUserPayingWalletSigner,
    iframeRef.current,
    suppressErrorToast,
  ]);

  return (
    <>
      {isIframeLoading || (!checkoutWithEthUrl && <SpinnerWrapper />)}
      {checkoutWithEthUrl && (
        <IFrameWrapper
          ref={iframeRef}
          id='checkout-with-eth-iframe'
          className={css`
            margin-left: auto;
            margin-right: auto;
            transition-property: all;
            width: 100%;
            height: 350px;
            color-scheme: light;
          `}
          src={checkoutWithEthUrl.href}
          onLoad={onLoad}
          scrolling='no'
          allowTransparency
        />
      )}
    </>
  );
};
