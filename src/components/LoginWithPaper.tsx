import React, { useEffect } from 'react';
import { PaperSDKError, PaperSDKErrorCode } from '../interfaces/PaperSDKError';
import { PaperUser } from '../interfaces/PaperUser';
import { openCenteredPopup } from '../lib/utils';
import { usePaperSDKContext } from '../Provider';
import { Button } from './base/Button';

interface LoginWithPaperProps {
  onSuccess?: (user: PaperUser) => void;
  onError?: (error: PaperSDKError) => void;
  children?: ({
    clickLoginButton,
  }: {
    clickLoginButton: () => void;
  }) => React.ReactNode | React.ReactNode;
}

const enum LOGIN_WITH_PAPER_EVENT_TYPE {
  USER_LOGIN_SUCCESS = 'userLoginSuccess',
  USER_LOGIN_FAILED = 'userLoginFailed',
}

export const LoginWithPaper: React.FC<LoginWithPaperProps> = ({
  onSuccess,
  onError,
  children,
}) => {
  const { chainName } = usePaperSDKContext();
  const isChildrenFunction = typeof children === 'function';
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      switch (data.eventType) {
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_LOGIN_SUCCESS:
          if (onSuccess) {
            onSuccess(data.values);
          }
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_LOGIN_FAILED:
          if (onError) {
            onError({
              code: PaperSDKErrorCode.UserClosedWindow,
              error: new Error(PaperSDKErrorCode.UserClosedWindow),
            });
          }
          break;
        default:
        // Ignore unrecognized event
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  const url = new URL('http://localhost:3001/sdk/v1/login-with-paper');
  url.searchParams.append('chainName', chainName);
  const clickLoginButton = () => {
    openCenteredPopup({
      url: url.href,
      windowName: 'PaperLogin',
      win: window,
      w: 400,
      h: 600,
    });
  };

  return (
    <>
      {children && isChildrenFunction ? (
        children({ clickLoginButton })
      ) : children ? (
        <a onClick={clickLoginButton}>{children} </a>
      ) : (
        <Button onClick={clickLoginButton}>
          <span style={{ marginRight: '10px' }}>Login With Paper</span>
          <svg
            width='15'
            height='30'
            viewBox='0 0 26 49'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fill-rule='evenodd'
              clip-rule='evenodd'
              d='M25.8824 8.91421C25.8824 8.47803 25.5996 8.09218 25.1838 7.96071L0 0V11.7963L14.7899 16.276L2.77311 24.5V34.4815L5.58074 37.3767L3.1009 39.6283C2.89214 39.8178 2.77311 40.0867 2.77311 40.3687V49L11.0924 42.6481V32.6667L8.60325 30.5207L25.8824 19.963V8.91421Z'
              fill='#19A8D6'
            />
            <path
              d='M25.8824 8.91421C25.8824 8.47803 25.5996 8.09218 25.1838 7.96071L0 0V11.7963L25.8824 19.963V8.91421Z'
              fill='#39D0FF'
            />
            <path
              d='M11.0924 32.6667L2.77311 24.5V34.4815L11.0924 42.6481V32.6667Z'
              fill='#39D0FF'
            />
          </svg>
        </Button>
      )}
    </>
  );
};