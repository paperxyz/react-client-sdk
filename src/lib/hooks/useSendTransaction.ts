import { SendTransactionArgs } from '@wagmi/core';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useSendTransaction as useSendTransactionWagmi } from 'wagmi';

export const useSendTransaction = ({ signer }: { signer?: ethers.Signer }) => {
  const {
    sendTransactionAsync: _sendTransactionAsync,
    isLoading: _isSendingTransaction,
  } = useSendTransactionWagmi();

  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const sendTransactionAsync = useCallback(
    async (args?: SendTransactionArgs) => {
      if (_sendTransactionAsync) {
        const response = await _sendTransactionAsync(args);
        return response;
      } else {
        setIsSendingTransaction(true);
        try {
          const response = await signer?.sendTransaction(args?.request || {});
          setIsSendingTransaction(false);
          return response;
        } catch (e) {
          setIsSendingTransaction(false);
          throw e;
        }
      }
    },
    [signer],
  );

  useEffect(() => {
    setIsSendingTransaction(_isSendingTransaction);
  }, [_isSendingTransaction]);

  return { sendTransactionAsync, isSendingTransaction };
};
