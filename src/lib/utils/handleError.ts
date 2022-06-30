import { IErrorObject } from '../../interfaces/PaperSDKError';
import {
  PayWithCryptoError,
  PayWithCryptoErrorCode
} from '../../interfaces/PayWithCryptoError';

export function handlePayWithCryptoError(
  error: Error | IErrorObject,
  currentChain: string,
  onError?: (code: PayWithCryptoError) => void,
  postToParent?: (
    errorObject: Omit<IErrorObject, 'isErrorObject'> & {
      isStopLoading: boolean;
    },
  ) => void,
) {
  if ('isErrorObject' in error) {
    if (onError) {
      onError({ code: error.title, error: new Error(error.title) });
    }
    if (postToParent) {
      postToParent({ ...error, isStopLoading: true });
    }
  } else {
    if (error.message.includes('rejected')) {
      console.log('onError', onError)
      if (onError) {
        onError({ code: PayWithCryptoErrorCode.TransactionCancelled, error });
      }
      if (postToParent) {
        postToParent({
          description: '',
          title: PayWithCryptoErrorCode.TransactionCancelled,
          isStopLoading: true,
        });
      }
    } else if (error.message.includes('insufficient funds')) {
      if (onError) {
        onError({
          code: PayWithCryptoErrorCode.InsufficientBalance(currentChain),
          error,
        });
      }
      if (postToParent) {
        postToParent({
          description:
            "Check your wallet's ETH balance to make sure you have enough!",
          title: PayWithCryptoErrorCode.InsufficientBalance(currentChain),
          isStopLoading: true,
        });
      }
    } else if (error.message.includes('Error switching chain')) {
      if (onError) {
        onError({
          code: PayWithCryptoErrorCode.ChainSwitchUnderway,
          error,
        });
      }
      if (postToParent) {
        postToParent({
          description: 'Check your wallet app',
          title: PayWithCryptoErrorCode.ChainSwitchUnderway,
          isStopLoading: false,
        });
      }
    } else {
      if (onError) {
        onError({
          code: PayWithCryptoErrorCode.ErrorSendingTransaction,
          error,
        });
      }
      if (postToParent) {
        postToParent({
          description: `Please refresh and try again. If things persist, reach out to us with the following error message: ${error.message}`,
          title: PayWithCryptoErrorCode.ErrorSendingTransaction,
          isStopLoading: true,
        });
      }
    }
  }
}
