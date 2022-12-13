import { ethers } from 'ethers';
import { useCallback } from 'react';
 
import {
  allChains,
  SwitchChainNotSupportedError,
  useSwitchNetwork as useSwitchNetworkWagmi
} from 'wagmi';

export const useSwitchNetwork = ({ signer }: { signer?: ethers.Signer }) => {
  const { switchNetworkAsync: _switchNetworkAsync } = useSwitchNetworkWagmi();

  const switchNetworkAsync = useCallback(
    async (chainId: number) => {
     
      if (_switchNetworkAsync) {
        return await _switchNetworkAsync?.(chainId);
      } else if (signer) {
        const chainToSwitchTo = allChains.find((x) => x.id === chainId);
        if (!chainToSwitchTo) {
          throw SwitchChainNotSupportedError;
        }
        if ((await signer.getChainId()) !== chainId) {
          throw SwitchChainNotSupportedError;
        }
        return chainToSwitchTo;
      }
      throw SwitchChainNotSupportedError;
    },
    [signer, _switchNetworkAsync],
  );

  return { switchNetworkAsync };
};
