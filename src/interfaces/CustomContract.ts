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
  | props
  | (props & {
      contractType: T;
      // TODO: Type the interface for various contracts type as needed
      contractArgs: T extends ContractType.AUCTION_HOUSE
        ? { price: string }
        : T extends ContractType.THIRDWEB_SIGNATURE
        ? { signature: string; payload: Record<string, any> }
        : undefined;
    });
