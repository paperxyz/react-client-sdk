import { ethers } from 'ethers';
import { useCallback } from 'react';
import {
  allChains,
  SwitchChainNotSupportedError,
  useSwitchNetwork as useSwitchNetworkWagmi,
} from 'wagmi';

export const useSwitchNetwork = ({ signer }: { signer?: ethers.Signer }) => {
  const { switchNetworkAsync: _switchNetworkAsync } = useSwitchNetworkWagmi();

  const switchNetworkAsync = useCallback(
    async (chainId?: number) => {
      if (signer) {
        const chainToSwitchTo = allChains.find((x) => x.id === chainId);
        console.log('chainToSwitchTo', chainToSwitchTo);
        console.log('await signer.getChainId()', await signer.getChainId());
        if (!chainToSwitchTo) {
          throw SwitchChainNotSupportedError;
        }
        if ((await signer.getChainId()) !== chainId) {
          throw SwitchChainNotSupportedError;
        }
        return chainToSwitchTo;
      } else {
        return await _switchNetworkAsync?.(chainId);
      }
    },
    [signer, _switchNetworkAsync],
  );

  return { switchNetworkAsync };
};
