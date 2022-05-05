export type PaperUser = {
  /**
   * The user's email address.
   * This address is case-insensitive (i.e. different capitalizations map to the same wallet).
   */
  emailAddress: string;

  /**
   * The Paper Wallet address associated with this user's email address.
   */
  walletAddress: string;
};
