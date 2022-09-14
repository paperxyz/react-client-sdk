import { ethers } from 'ethers';
import { useSigner } from 'wagmi';

export function useResolvedSigner({ signer }: { signer?: ethers.Signer }) {
  const { data: detectedSigner } = useSigner();
  return { signer: signer || detectedSigner };
}
