/** This is basically a map from argument name to the value
 * Example:
 * ```json
 * 	{
 *    recipient: "0x...",
 *    quantity: 1,
 *  }
 * ```
 *
 * Corresponds to the following argument stub in solidity:
 *  ```solidity
 * function myFunction (address recipient, uint128 quantity)
 * ```
 *
 * You can also pass your complex params for your contract like so:
 *
 * ```json
 * 	{
 * 	  _user: { address: "0x...", age: 24 },
 *    _quantity: 2,
 *  }
 *```
 *
 * The above correspond to the following argument stub in solidity:
 * ```solidity
 * struct User {
 *    string name;
 *    uint256 age;
 * }
 *
 * function myFunction(User calldata _user, uint256 _quantity)
 * ```
 *
 */
type ArgumentMapType = {
  [key: string]: string | null | number | boolean | ArgumentMapType;
};

/** This specifies the way a method should be called.
 *
 * Note that the argument names should match the argument names in your contract.
 *
 * Example:
 * ```json
 *  {
 *    name: "claim",
 *    args: { _recipient: "0x...", _quantity: 2 }
 *  }
 * ```
 *
 * Corresponds to the following function stub in solidity:
 * ```solidity
 * function claim(address _recipient, uint256 _quantity)
 * ```
 *
 * For more on the types of arguments you can pass, see {@link ArgumentMapType}
 */
export type ReadMethodCallType = {
  name: string;
  args?: ArgumentMapType;
};

/**
 * This is similar to {@link ReadMethodCallType} with two added properties
 *
 * ## payment
 *  * We will automatically call the `approve` function for non native coins.
 *  * The `value` should be human readable. So "1.2" represents "1.2" ETH or "1.2" USDC depending on the `currency` field
 *
 * ## callOptions
 * * As of now, we only support specifying the relative amount of gas to use.
 * * They correspond to the values of the [gas trackers](https://etherscan.io/gastracker) at the time of calling the function
 */
export type WriteMethodCallType =
  | ReadMethodCallType & {
      payment: {
        currency: 'MATIC' | 'ETH' | 'USDC' | 'SOL' | 'AVAX' | 'USDC.e';
        value: string;
      };
      callOptions?: { gasOptions?: 'low' | 'medium' | 'high' };
    };
