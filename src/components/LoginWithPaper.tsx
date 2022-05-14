import React, { useEffect } from 'react';
import { PaperSDKError } from '../interfaces/PaperSDKError';
import { PaperUser } from '../interfaces/PaperUser';
import { openCenteredPopup } from '../lib/utils';
import { usePaperSDKContext } from '../Provider';

interface LoginWithPaperProps {
  onSuccess: (user: PaperUser) => void;
  onError?: (error: PaperSDKError) => void;
  children?: ({
    loginButtonClicked,
  }: {
    loginButtonClicked: () => void;
  }) => React.ReactNode;
}

const enum LOGIN_WITH_PAPER_EVENT_TYPE {
  PENDING_EMAIL_VERIFICATION = 'pendingEmailVerification',
  USER_CLOSED_WINDOW = 'userClosedWindow',
  USER_LOGIN_SUCCESS = 'userLoginSuccess',
  USER_REJECT_TERMS = 'userRejectTerms',
  USER_VERIFIED_EMAIL = 'userVerifiedEmail',
  USER_VERIFIED_EMAIL_FAILED = 'userVerifiedEmailFailed',
}

export const LoginWithPaper: React.FC<LoginWithPaperProps> = ({
  onSuccess,
  onError,
  children,
}) => {
  const { chainName } = usePaperSDKContext();
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      switch (data.eventType) {
        case LOGIN_WITH_PAPER_EVENT_TYPE.PENDING_EMAIL_VERIFICATION:
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_LOGIN_SUCCESS:
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_REJECT_TERMS:
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_VERIFIED_EMAIL:
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_VERIFIED_EMAIL_FAILED:
          break;
        case LOGIN_WITH_PAPER_EVENT_TYPE.USER_CLOSED_WINDOW:
          console.log('user closed the login window');
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
      {children ? (
        children({ loginButtonClicked: clickLoginButton })
      ) : (
        <button onClick={clickLoginButton}>Login With Paper</button>
      )}
    </>
  );
};
