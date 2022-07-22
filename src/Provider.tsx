import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

type SupportedChainName =
  | 'Polygon'
  | 'Mumbai'
  | 'Ethereum'
  | 'Rinkeby'
  | 'Goerli'
  | 'Solana'
  | 'SolanaDevnet'
  | 'Avalanche';

interface SDKContext {
  chainName: SupportedChainName;
  setChainName: Dispatch<SetStateAction<SupportedChainName>>;
  clientId: string;
  appName: string;
}
const PaperSDKContext = createContext<SDKContext>({
  chainName: 'Polygon',
  setChainName: () => {},
  clientId: '',
  appName: '',
});

export interface PaperProviderProps {
  chainName?: SupportedChainName;
  appName?: string;
  clientId?: string;
}
export const PaperSDKProvider = ({
  appName = '',
  chainName = 'Polygon',
  clientId = '',
  children,
}: React.PropsWithChildren<PaperProviderProps>) => {
  const [chainName_, setChainName] = useState<SupportedChainName>(chainName);
  const contextValue = useMemo(
    () => ({
      chainName: chainName_,
      setChainName,
      appName: appName,
      clientId: clientId,
    }),
    [chainName_, appName, clientId],
  );

  const providers = [publicProvider()];
  const { chains, provider } = configureChains(
    [chain.mainnet, chain.goerli],
    providers,
  );

  const client = useMemo(
    () =>
      createClient({
        autoConnect: true,
        connectors: [
          new MetaMaskConnector({
            chains,
            options: {
              shimChainChangedDisconnect: true,
              shimDisconnect: true,
            },
          }),
          new WalletConnectConnector({
            chains,
            options: {
              qrcode: true,
            },
          }),
          new CoinbaseWalletConnector({
            chains,
            options: {
              appName: appName || 'Paper.xyz',
            },
          }),
        ],
        provider,
      }),
    [appName],
  );

  return (
    <WagmiConfig client={client}>
      <PaperSDKContext.Provider value={contextValue}>
        {children}
      </PaperSDKContext.Provider>
    </WagmiConfig>
  );
};

export const usePaperSDKContext = (): SDKContext => {
  return useContext(PaperSDKContext);
};
