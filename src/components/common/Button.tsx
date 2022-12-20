import React from 'react';
import { Spinner } from './Spinner';

export const Button = ({
  isLoading = false,
  loadingText = '',
  ...props
}: {
  isLoading?: boolean;
  loadingText?: string;
} & React.HTMLProps<HTMLButtonElement>): React.ReactElement => {
  return (
    <button
      {...props}
      type={props.type as 'button' | 'submit' | 'reset' | undefined}
      disabled={isLoading || props.disabled}
      className={`paper-items-center paper-justify-start paper-rounded-lg paper-bg-gray-800 paper-px-5 paper-py-2.5 paper-text-sm paper-font-semibold paper-text-white focus:paper-outline-none focus:paper-ring-4 focus:paper-ring-gray-300 hover:paper-enabled:paper-bg-gray-900 ${props.className}`}
    >
      {isLoading ? (
        <div className='paper-flex paper-w-full paper-items-center paper-justify-center'>
          <Spinner className={loadingText ? 'paper-mr-2' : ''} />
          {loadingText}
        </div>
      ) : (
        props.children
      )}
    </button>
  );
};
