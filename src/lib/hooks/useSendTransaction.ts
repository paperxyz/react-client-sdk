import type { SendTransactionUnpreparedRequest } from '@wagmi/core';
import { getProvider, prepareSendTransaction, sendTransaction } from '@wagmi/core';

import { ethers } from 'ethers';
import { useCallback, useState } from 'react';

export const useSendTransaction = ({ signer }: { signer?: ethers.Signer }) => {
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const sendTransactionAsync = useCallback(
    async (args?: SendTransactionUnpreparedRequest & {chainId: number}) => {
      if (!args || !args.request.to) {
        console.log('no argument for transaction, returning')
        return
      }
      if (signer) {
        setIsSendingTransaction(true);
        try {
          const response = await signer?.sendTransaction(args?.request || {});
          setIsSendingTransaction(false);
          return response;
        } catch (e) {
          setIsSendingTransaction(false);
          throw e;
        }
      } else {
        setIsSendingTransaction(true);
        const config = await prepareSendTransaction({ chainId: args.chainId, request: { to: args.request.to, ...args.request } });
        const responsePartial = await sendTransaction(config)
        const provider = getProvider({
          chainId: args.chainId,
        })
        const response = await provider.getTransaction(responsePartial.hash)
        setIsSendingTransaction(false);
        return response
      }
    },
    [signer],
  );

  return { sendTransactionAsync, isSendingTransaction };
};
