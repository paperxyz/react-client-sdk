export type PayWithCryptoError = {
  /**
   * code is a human-readable english message describing the error.
   */
  code: PayWithCryptoErrorCode;
  /**
   * The actual Error object that occurred
   */
  error: Error;
};

export class PayWithCryptoErrorCode {
  static ErrorConnectingToWallet = 'Error connecting to wallet';
  static ErrorSendingTransaction = 'Something went wrong sending transaction';
  static InsufficientBalance(chainName: string) {
    return `Insufficient ETH on ${chainName}`;
  }
  static TransactionCancelled = 'Transaction cancelled';
  static WrongChain(chainName: string) {
    return `Wrong Chain. Expected: ${chainName}`;
  }
  static ChainSwitchUnderway = 'There is a network switch already underway';
  static PendingSignature = 'Pending Signature';
}
