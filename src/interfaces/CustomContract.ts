export enum Currency {
  MATIC,
  ETH,
  USDC,
  'USDC.e',
  SOL,
  AVAX,
}

type ArgumentMapType = {
  [key: string]: string | null | number | boolean | ArgumentMapType;
};
export type ReadMethodCallType = {
  name: string;
  args?: ArgumentMapType;
};
export type WriteMethodCallType = ReadMethodCallType & {
  payment: { currency: keyof typeof Currency; value: string };
  callOptions?: { gasOptions?: string };
};
