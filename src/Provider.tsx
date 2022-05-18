import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

type SupportedChainName =
  | 'Polygon'
  | 'Mumbai'
  | 'Ethereum'
  | 'Rinkeby'
  | 'Solana'
  | 'SolanaDevnet'
  | 'Avalanche';

interface SDKContext {
  chainName: SupportedChainName;
  setChainName: Dispatch<SetStateAction<SupportedChainName>>;
  clientId: string;
}

export interface PaperProviderProps {
  chainName: SupportedChainName;
  clientId: string;
}
const PaperSDKContext = createContext<SDKContext>({
  chainName: 'Polygon',
  setChainName: () => {},
  clientId: '',
});

export const PaperSDKProvider = ({
  chainName,
  clientId,
  children,
}: React.PropsWithChildren<PaperProviderProps>) => {
  const [chainName_, setChainName] = useState<SupportedChainName>(chainName);

  const contextValue = useMemo(
    () => ({
      chainName: chainName_,
      setChainName,
      clientId,
    }),
    [chainName_, setChainName],
  );

  return (
    <PaperSDKContext.Provider value={contextValue}>
      {children}
    </PaperSDKContext.Provider>
  );
};

export const usePaperSDKContext = (): SDKContext => {
  return useContext(PaperSDKContext);
};
