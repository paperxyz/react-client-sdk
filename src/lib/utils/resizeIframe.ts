const IFRAME_EXPANDED_HEIGHT = 350;

export function resizeIframeToExpandedHeight(frame: HTMLIFrameElement) {
  frame.classList.toggle('transition-height-expanded');
  if (parseInt(frame.height) < IFRAME_EXPANDED_HEIGHT) {
    frame.height = IFRAME_EXPANDED_HEIGHT + 'px';
  }
}
