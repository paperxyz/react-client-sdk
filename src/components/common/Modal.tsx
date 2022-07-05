import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useEffect } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  escapeToClose = true,
  clickOutsideModalToClose = false,
  bgColor = '#FAFAFA',
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  escapeToClose?: boolean;
  clickOutsideModalToClose?: boolean;
  bgColor?: string;
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as='div'
        className='paper-modal relative z-[1000]'
        onClose={clickOutsideModalToClose ? onClose : () => {}}
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='paper-modal-overlay fixed inset-0 bg-black bg-opacity-50' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel
                className='paper-modal-content relative max-h-full max-w-full transform overflow-x-auto overflow-y-hidden rounded-lg p-5 text-left align-middle shadow-xl transition-all sm:m-4'
                style={{ backgroundColor: bgColor }}
              >
                <CloseButton onClose={onClose} />
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
      className='z-100 absolute right-2 top-2 rounded-full p-2 hover:cursor-pointer hover:bg-gray-500/10 active:bg-gray-500/20'
    >
      <svg
        className='h-5 w-5'
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
