import React, { forwardRef, memo } from 'react';

const IFrameBase = forwardRef(
  (
    props: React.IframeHTMLAttributes<HTMLIFrameElement>,
    ref: React.ForwardedRef<HTMLIFrameElement>,
  ) => {
    return <iframe ref={ref} {...props} />;
  },
);
export const IFrameWrapper = memo(IFrameBase);
