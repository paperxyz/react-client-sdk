import { ethers } from 'ethers';
import {
  PayWithCryptoError,
  PayWithCryptoErrorCode,
} from '../../components/PayWithCrypto';

export async function sendEth(
  signer: ethers.Signer,
  data: string,
  onSuccess?: (code: string) => void,
  onError?: (error: PayWithCryptoError) => void,
) {
  try {
    const response = await signer.sendTransaction({
      to: '',
      value: ethers.utils.parseEther('0.01'),
      data,
    });
    const receipt = await response.wait();
    if (onSuccess) {
      onSuccess(receipt.transactionHash);
    }
  } catch (e) {
    console.error(PayWithCryptoErrorCode.ErrorSendingTransaction, e);
    if (onError) {
      onError({
        code: PayWithCryptoErrorCode.ErrorSendingTransaction,
        error: e as Error,
      });
    }
  }
}
