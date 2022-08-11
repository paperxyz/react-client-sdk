import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount as useAccountWagmi } from 'wagmi';

export const useAccount = ({ signer }: { signer?: ethers.Signer }) => {
  const { address: _address, connector } = useAccountWagmi();
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    const updateFn = async () => {
      const newChainId =
        (await signer?.getChainId()) || (await connector?.getChainId());

      const newAddress = (await signer?.getAddress()) || _address;
      return { newChainId, newAddress };
    };
    updateFn().then(({ newAddress, newChainId }) => {
      setAddress(newAddress);
      setChainId(newChainId);
    });
  }, [signer, _address, connector]);

  return { address, connector, chainId };
};
