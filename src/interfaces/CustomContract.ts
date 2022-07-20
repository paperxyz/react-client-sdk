export enum Currency {
  MATIC = 'MATIC',
  ETH = 'ETH',
  USDC = 'USDC',
  USDCE = 'USDC.e',
  SOL = 'SOL',
  AVAX = 'AVAX',
}

type ArgumentMapType = {
  [key: string]: string | null | number | boolean | ArgumentMapType;
};
export type ReadMethodCallType = {
  name: string;
  args?: ArgumentMapType;
};
export type WriteMethodCallType = ReadMethodCallType & {
  callOptions?: { gasOptions?: string };
  payment?: { currency: Currency; value: string };
};
