import React, { HTMLAttributes } from 'react';

export const Button = (
  props: HTMLAttributes<HTMLButtonElement>,
): React.ReactElement => {
  return (
    <button
      className={`font-bold text-center text-[#ffff] transition-all rounded-lg px-8 py-4 bg-[#01212b] hover:bg-[#013140] hover:scale-[1.01] active:bg-[#011e26] active:scale-100 ${props.className}`}
    >
      {props.children}
    </button>
  );
};
