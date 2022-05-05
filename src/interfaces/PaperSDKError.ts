export type PaperSDKError = {
  /**
   * An enum representing the error encountered.
   * The value is a human-readable, English message describing the error.
   */
  code: PaperSDKErrorCode;
};

export enum PaperSDKErrorCode {
  EmailNotVerified = 'The email was unable to be verified.',
  NotEnoughSupply = 'There is not enough supply to claim.',
  AddressNotAllowed = 'This address is not on the allowlist.',
  NoActiveClaimPhase = 'There is no active claim phase at the moment.',
}
