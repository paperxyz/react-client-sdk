import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useEffect } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  escapeToClose = true,
  clickOutsideModalToClose = false,
  bgColor = '#FAFAFA',
  isFullScreen,
  hasCloseButton = true,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  escapeToClose?: boolean;
  clickOutsideModalToClose?: boolean;
  bgColor?: string;
  isFullScreen?: boolean;
  hasCloseButton?: boolean;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (escapeToClose) {
      document.addEventListener('keydown', keyDownHandler);
    }

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);

  const dialogPanelClasses = isFullScreen ? '' : 'sm:m-4 p-5';
  const dialogPanelBg = isFullScreen ? 'transparent' : bgColor;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as='div'
        className='paper-modal paper-relative paper-z-[1000]'
        onClose={clickOutsideModalToClose ? onClose : () => {}}
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter='paper-ease-out paper-duration-300'
          enterFrom='paper-opacity-0'
          enterTo='paper-opacity-100'
          leave='paper-ease-in paper-duration-200'
          leaveFrom='paper-opacity-100'
          leaveTo='paper-opacity-0'
        >
          <div className='paper-modal-overlay paper-fixed paper-inset-0 paper-bg-black paper-bg-opacity-50' />
        </Transition.Child>

        <div className='paper-fixed paper-inset-0 paper-overflow-y-auto'>
          <div className='paper-flex paper-min-h-full paper-items-center paper-justify-center'>
            <Transition.Child
              as={Fragment}
              enter='paper-ease-out paper-duration-300'
              enterFrom='paper-opacity-0 paper-scale-95'
              enterTo='paper-opacity-100 paper-scale-100'
              leave='paper-ease-in paper-duration-200'
              leaveFrom='paper-opacity-100 paper-scale-100'
              leaveTo='paper-opacity-0 paper-scale-95'
            >
              <Dialog.Panel
                className={`paper-modal-content paper-relative paper-max-h-full paper-max-w-full paper-transform paper-overflow-x-auto paper-overflow-y-hidden paper-rounded-lg paper-text-left paper-align-middle paper-shadow-xl paper-transition-all ${dialogPanelClasses}`}
                style={{ backgroundColor: dialogPanelBg }}
              >
                {hasCloseButton && <CloseButton onClose={onClose} />}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const CloseButton = ({ onClose }: { onClose: () => void }) => {
  return (
    <button
      aria-label='close modal'
      className='paper-z-100 paper-absolute paper-right-2 paper-top-2 paper-rounded-full paper-p-2 hover:paper-cursor-pointer hover:paper-bg-gray-500/10 active:paper-bg-gray-500/20'
    >
      <svg
        className='paper-h-5 paper-w-5'
        onClick={onClose}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M6 18L18 6M6 6l12 12'
        ></path>
      </svg>
    </button>
  );
};
