import React, { useEffect, useRef } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const closeModalFn = onClose ? onClose : () => {};
    if (dialogRef.current) {
      dialogRef.current.addEventListener('close', closeModalFn);
    }

    return () => {
      dialogRef.current?.removeEventListener('close', closeModalFn);
    };
  }, []);

  return (
    <dialog ref={dialogRef} open={isOpen}>
      <form method='dialog'>{children}</form>
    </dialog>
  );
};
