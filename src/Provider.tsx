import type { SupportedChainName } from '@paperxyz/js-client-sdk';
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

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

/**
 * @typedef PaperProviderProps
 * @type {object}
 * @property {string} appName - The name used to display
 * @property {string}  chainName - deprecated. Not used anymore
 * @property {string} clientId - deprecated. Used by VerifyOwnershipWithPaper which has since been deprecated
 * @param {PaperProviderProps} props
 */
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

  return (
    <PaperSDKContext.Provider value={contextValue}>
      {children}
    </PaperSDKContext.Provider>
  );
};

export const usePaperSDKContext = (): SDKContext => {
  return useContext(PaperSDKContext);
};
