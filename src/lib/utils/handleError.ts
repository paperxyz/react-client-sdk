import { IErrorObject } from '../../interfaces/PaperSDKError';
import {
  PayWithCryptoError,
  PayWithCryptoErrorCode,
} from '../../interfaces/PayWithCryptoError';

export function handlePayWithCryptoError(
  error: Error | IErrorObject,
  currentChain: string,
  onError?: (code: PayWithCryptoError) => void,
  postToParent?: (errorObject: Omit<IErrorObject, 'isErrorObject'>) => void,
) {
  if ('isErrorObject' in error) {
    if (onError) {
      onError({ code: error.title, error: new Error(error.title) });
    }
    if (postToParent) {
      postToParent({ ...error });
    }
  } else {
    if (error.message.includes('rejected')) {
      if (onError) {
        onError({ code: PayWithCryptoErrorCode.TransactionCancelled, error });
      }
      if (postToParent) {
        postToParent({
          description: '',
          title: PayWithCryptoErrorCode.TransactionCancelled,
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
        });
      }
    }
  }
}
