export function openCenteredPopup({
  url,
  windowName,
  win,
  w,
  h,
}: {
  url: string;
  windowName: string;
  win: Window & typeof globalThis;
  w: number;
  h: number;
}) {
  const height = win?.top?.outerHeight || 100;
  const width = win?.top?.outerWidth || 100;
  const screenX = win?.top?.screenX || 100;
  const screenY = win?.top?.screenY || 100;
  const y = height / 2 + screenY - h / 2;
  const x = width / 2 + screenX - w / 2;
  return win.open(
    url,
    windowName,
    `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,copyhistory=no,width=${w},height=${h},top=${y},left=${x}`,
  );
}
