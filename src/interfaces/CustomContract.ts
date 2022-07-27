export type SignedPayload = {
  payload: { [key: string]: any };
  signature: string;
};

export enum ContractType {
  // Ethereum/Polygon
  THIRDWEB_NFT_DROP_V2 = 'THIRDWEB_NFT_DROP_V2',
  THIRDWEB_EDITION_DROP_V2 = 'THIRDWEB_EDITION_DROP_V2',
  THIRDWEB_SIGNATURE = 'THIRDWEB_SIGNATURE',
  // Solana
  CANDY_MACHINE = 'CANDY_MACHINE',
  AUCTION_HOUSE = 'AUCTION_HOUSE',
}

export type CustomContractArgWrapper<props, T extends ContractType> =
  | props & {
      contractType: T;
      contractArgs: T extends ContractType.AUCTION_HOUSE
        ? {
            mintAddress: string;
            price: {
              amount: number;
              currency: 'SOL' | 'USDC';
            };
            quantity: string;
          }
        : T extends ContractType.THIRDWEB_SIGNATURE
        ? SignedPayload
        : undefined;
    };
