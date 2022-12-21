import {
  PaperSDKError,
  PaperSDKErrorCode,
  PAPER_APP_URL,
} from '@paperxyz/js-client-sdk';
import React, { useEffect } from 'react';
import { openCenteredPopup } from '../lib/utils/popup';
import { css } from '@emotion/css';
import { usePaperSDKContext } from '../Provider';
import { Button } from './common/Button';
var packageJson = require('../../package.json');

interface VerifyOwnershipWithPaperProps {
  onSuccess?: (code: string) => void;
  onError?: (error: PaperSDKError) => void;
  onWindowClose?: () => void;
  children?: ({
    onClick,
  }: {
    onClick: () => void;
  }) => React.ReactNode | React.ReactNode;
  redirectUrl?: string;
  className?: string;
}

const enum VERIFY_OWNERSHIP_WITH_PAPER_EVENT_TYPE {
  USER_LOGIN_SUCCESS = 'userLoginSuccess',
  USER_LOGIN_FAILED = 'userLoginFailed',
  USER_CLOSE_LOGIN_PAGE = 'userCloseLoginPage',
}

export const VerifyOwnershipWithPaper: React.FC<
  VerifyOwnershipWithPaperProps
> = ({
  onSuccess,
  onError,
  onWindowClose,
  className,
  children,
  redirectUrl,
}) => {
  const { chainName, clientId } = usePaperSDKContext();
  const isChildrenFunction = typeof children === 'function';

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      switch (data.eventType) {
        case VERIFY_OWNERSHIP_WITH_PAPER_EVENT_TYPE.USER_LOGIN_SUCCESS:
          if (onSuccess) {
            onSuccess(data.values.accessCode);
          }
          break;
        case VERIFY_OWNERSHIP_WITH_PAPER_EVENT_TYPE.USER_CLOSE_LOGIN_PAGE: {
          if (onWindowClose) {
            onWindowClose();
          }
          break;
        }
        case VERIFY_OWNERSHIP_WITH_PAPER_EVENT_TYPE.USER_LOGIN_FAILED:
          if (onError) {
            onError({
              code: PaperSDKErrorCode.UserLoginFailed,
              error: new Error(PaperSDKErrorCode.UserLoginFailed),
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

  const url = new URL('/sdk/v1/login-with-paper', PAPER_APP_URL);
  url.searchParams.append('chainName', chainName);
  url.searchParams.append('clientId', clientId);
  url.searchParams.append('redirectUrl', redirectUrl || '');
  const onClick = () => {
    const loginWindow = openCenteredPopup({
      url: url.href,
      target: '_blank',
      win: window,
      w: 400,
      h: 600,
    });
    loginWindow?.focus();
  };

  return (
    <>
      {children && isChildrenFunction ? (
        children({ onClick })
      ) : children ? (
        <a
          onClick={onClick}
          data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
        >
          {children}
        </a>
      ) : (
        <Button
          onClick={onClick}
          className={className}
          data-paper-sdk-version={`@paperxyz/react-client-sdk@${packageJson.version}`}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
            `}
          >
            <span style={{ marginRight: '8px' }}>Login with</span>{' '}
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
            </svg>{' '}
            <span style={{ marginLeft: '5px' }}> Paper</span>
          </div>
        </Button>
      )}
    </>
  );
};
