import { ethers } from 'ethers';
import { useCallback } from 'react';
import { useSendTransaction } from 'wagmi';

export function useSendEth(
  onSuccess?: (
    data: ethers.providers.TransactionResponse,
  ) => void | Promise<unknown>,
  onError?: (error: Error) => void | Promise<unknown>,
) {
  const { sendTransaction } = useSendTransaction({
    onSuccess,
    onError,
  });

  const sendTransactionCallback = useCallback(
    ({
      chainId,
      data,
      paymentAddress,
      value,
    }: {
      data: string;
      chainId: number;
      value: string;
      paymentAddress: string;
    }) => {
      sendTransaction({
        chainId,
        request: {
          to: paymentAddress,
          value: ethers.BigNumber.from(value),
          data,
        },
      });
    },
    [sendTransaction],
  );
  return { sendTransaction: sendTransactionCallback };
}
