export interface ReviewResult {
  /**
   * A unique ID for this purchase.
   */
  id: string;

  /**
   * The cardholder's full name provided by the buyer.
   */
  cardholderName: string;
}
