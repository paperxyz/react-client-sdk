import {
  PaperSDKError,
  PayWithCryptoErrorCode,
} from '../../interfaces/PaperSDKError';

export interface IErrorObject {
  isErrorObject: boolean;
  title: PayWithCryptoErrorCode;
  description: string;
}

export function handlePayWithCryptoError(
  error: Error | IErrorObject,
  onError?: (code: PaperSDKError) => void,
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
    if (
      error.message.includes('rejected') ||
      error.message.includes('denied transaction')
    ) {
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
          code: PayWithCryptoErrorCode.InsufficientBalance,
          error,
        });
      }
      if (postToParent) {
        postToParent({
          description:
            "Check your wallet's ETH balance to make sure you have enough!",
          title: PayWithCryptoErrorCode.InsufficientBalance,
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
