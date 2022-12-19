import { css, CSSInterpolation } from '@emotion/css';

export const pcss = (
  template: TemplateStringsArray,
  ...args: Array<CSSInterpolation>
) => {
  const copy = [...template, 'label: paper'];
  return css(copy, args);
};

export const opacity0 = pcss`
  opacity: 0;
`;

export const opacity1 = pcss`
  opacity: 1;
`;

const enterTransition = pcss`
  transition-delay: 150ms;
  transition-property: opacity;
  transition-duration: 75ms;
`;

const leaveTransition = pcss`
  transition-property: opacity;
  transition-duration: 150ms;
`;

const transitionDefaultClasses = pcss`
  background-color: transparent;
  grid-column-start: 1;
  grid-row-start: 1;
`;

export const commonTransitionProps = {
  className: transitionDefaultClasses,
  enter: enterTransition,
  enterFrom: opacity0,
  enterTo: opacity1,
  leave: leaveTransition,
  leaveFrom: opacity1,
  leaveTo: opacity0,
};
