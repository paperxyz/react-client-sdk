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
      className={`items-center justify-start rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-gray-300 hover:enabled:bg-gray-900 ${props.className}`}
    >
      {isLoading ? (
        <div className='flex w-full items-center justify-center'>
          <Spinner className={loadingText ? 'mr-2' : ''} />
          {loadingText}
        </div>
      ) : (
        props.children
      )}
    </button>
  );
};
