import React, { useState } from 'react';

export enum PaperCheckoutDisplay {
  POPUP = 'POPUP',
  NEW_TAB = 'NEW_TAB',
  MODAL = 'MODAL',
  DRAWER = 'DRAWER',
  EMBED = 'EMBED',
}

interface PaperCheckoutProps {
  checkoutId: string;
  display?: PaperCheckoutDisplay;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export const PaperCheckout: React.FC<PaperCheckoutProps> = ({
  checkoutId,
  display = PaperCheckoutDisplay.POPUP,
  width = 400,
  height = 800,
  children,
}) => {
  const checkoutUrl = `https://paper.xyz/checkout/${checkoutId}`;

  const clickableElement = children || (
    <button
      style={{
        backgroundColor: '#cf3781',
        padding: '8px 20px 8px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
      }}
    >
      Buy Now
    </button>
  );

  switch (display) {
    case PaperCheckoutDisplay.POPUP: {
      const onClick = () => {
        if (!window?.top) return;

        const y = window.top.outerHeight / 2 + window.top.screenY - height / 2;
        const x = window.top.outerWidth / 2 + window.top.screenX - width / 2;
        window.open(
          checkoutUrl,
          'Paper.xyz Checkout',
          `toolbar=no,
          location=no,
          status=no,
          menubar=no,
          scrollbars=yes,
          resizable=yes,
          width=${width},
          height=${height},
          top=${y},
          left=${x}`,
        );
      };
      return <a onClick={onClick}>{clickableElement}</a>;
    }

    case PaperCheckoutDisplay.NEW_TAB: {
      const onClick = () => window.open(checkoutUrl, '_blank');
      return <a onClick={onClick}>{clickableElement}</a>;
    }

    case PaperCheckoutDisplay.MODAL: {
      return (
        <PaperCheckoutModal
          clickableElement={clickableElement}
          checkoutUrl={checkoutUrl}
          width={width}
          height={height}
        />
      );
    }

    case PaperCheckoutDisplay.DRAWER: {
      return (
        <PaperCheckoutDrawer
          clickableElement={clickableElement}
          checkoutUrl={checkoutUrl}
          width={width}
        />
      );
    }

    case PaperCheckoutDisplay.EMBED: {
      return <iframe src={checkoutUrl} width={width} height={height} />;
    }

    default:
      console.error(`Invalid or unimplemented display type: ${display}`);
      return <></>;
  }
};

const inlineStyles: { [name: string]: any } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    zIndex: 1,
    overflow: 'hidden',
    display: 'flex',
    visibility: 'hidden',
    opacity: 0,
    transition: 'all 0.2s ease',
  },
  overlayIsVisible: {
    visibility: 'visible',
    opacity: 1,
    backdropFilter: 'blur(2px)',
    background: '#0008',
  },
  modalOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOverlay: {
    justifyContent: 'flex-end',
  },
  modalDialog: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px',
    visibility: 'hidden',
    opacity: 0,
    top: '5%',
    transition: 'all 0.2s ease',
  },
  modalDialogIsVisible: {
    visibility: 'visible',
    opacity: 1,
    top: 0,
  },
  drawerDialog: {
    position: 'relative',
    visibility: 'hidden',
    opacity: 0,
    right: '-10%',
    transition: 'all 0.2s ease',
  },
  drawerDialogIsVisible: {
    visibility: 'visible',
    opacity: 1,
    right: 0,
  },
  modalCloseButton: {
    position: 'absolute',
    top: '0.1em',
    right: '0.2em',
    borderRadius: '8px',
    fontSize: 'x-large',
    padding: '0 0.4em',
    color: '#888',
  },
};

const PaperCheckoutDrawer = ({
  clickableElement,
  checkoutUrl,
  width,
}: {
  clickableElement: React.ReactNode;
  checkoutUrl: string;
  width: number;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <a onClick={() => setIsOpen(true)}>{clickableElement}</a>

      <div
        className='paper-overlay'
        style={{
          ...inlineStyles.overlay,
          ...(isOpen ? inlineStyles.overlayIsVisible : {}),
          ...inlineStyles.drawerOverlay,
        }}
      >
        <div
          className='paper-drawer'
          style={{
            ...inlineStyles.drawerDialog,
            ...(isOpen ? inlineStyles.drawerDialogIsVisible : {}),
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            style={inlineStyles.modalCloseButton}
          >
            &times;
          </button>
          <iframe src={checkoutUrl} width={width} height='100%' />
        </div>
      </div>
    </>
  );
};

const PaperCheckoutModal = ({
  clickableElement,
  checkoutUrl,
  width,
  height,
}: {
  clickableElement: React.ReactNode;
  checkoutUrl: string;
  width: number;
  height: number;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <a onClick={() => setIsOpen(true)}>{clickableElement}</a>

      <div
        className='paper-overlay'
        style={{
          ...inlineStyles.overlay,
          ...(isOpen ? inlineStyles.overlayIsVisible : {}),
          ...inlineStyles.modalOverlay,
        }}
      >
        <div
          className='paper-modal'
          style={{
            ...inlineStyles.modalDialog,
            ...(isOpen ? inlineStyles.modalDialogIsVisible : {}),
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            style={inlineStyles.modalCloseButton}
          >
            &times;
          </button>
          <iframe src={checkoutUrl} width={width} height={height} />
        </div>
      </div>
    </>
  );
};
