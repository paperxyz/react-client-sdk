type ArgumentMapType = {
  [key: string]: string | null | number | boolean | ArgumentMapType;
};
export type ReadMethodCallType = {
  name: string;
  args?: ArgumentMapType;
};
export type WriteMethodCallType = ReadMethodCallType & {
  payment: {
    currency: 'MATIC' | 'ETH' | 'USDC' | 'SOL' | 'AVAX' | 'USDC.e';
    value: string;
  };
  callOptions?: { gasOptions?: 'low' | 'medium' | 'high' };
};
