import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

type SupportedChainName =
  | "Polygon"
  | "Mumbai"
  | "Ethereum"
  | "Rinkeby"
  | "Solana"
  | "SolanaDevnet"
  | "Avalanche";

interface SDKContext {
  chainName: SupportedChainName;
  setChainName: Dispatch<SetStateAction<SupportedChainName>>;
}

const PaperSDKContext = createContext<SDKContext>({
  chainName: "Polygon",
  setChainName: () => {},
});

export interface PaperProviderProps {
  chainName: SupportedChainName;
}

export const PaperSDKProvider = ({
  chainName,
  children,
}: React.PropsWithChildren<PaperProviderProps>) => {
  const [chainName_, setChainName] = useState<SupportedChainName>(chainName);

  const contextValue = useMemo(
    () => ({
      chainName: chainName_,
      setChainName,
    }),
    [chainName_, setChainName]
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
