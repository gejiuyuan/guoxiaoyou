export function uaIndexof(str: string) {
  return navigator.userAgent.indexOf(str);
}

export const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const isMacOs = uaIndexof('Mac OS') > 0;

export const isChromeFrame = uaIndexof('chromeframe') > 0 || uaIndexof('x-clock') > 0;

export const isIE =
  (uaIndexof('MSIE') > 0 || uaIndexof('Trident') >= 0) && !isChromeFrame;

export const isEdge = uaIndexof('Edge/') > 0;

export const isOpera = uaIndexof('Opera/') === 0;

export const isFirefox = uaIndexof('Firefox/') > 0;

export const firefoxVersion =
  isFirefox && navigator.userAgent.match(/Firefox\/(\d+(\.\d+)?)/)![1];

export const isWebkit = uaIndexof('ApplewebKit') > 0;

export const isChrome =
  uaIndexof('Chrome/') > 0 && !isIE && !isEdge && !isOpera && !isFirefox;

export const chromeVersion =
  isChrome && navigator.userAgent.match(/Chrome\/(\d+(\. \d+)?)/)![1];

export const isSafari =
  uaIndexof('Safari/') > -1 && !isIE && !isEdge && !isOpera && !isFirefox && !isChrome;

export const isElectron = uaIndexof('Electron/') > 0;

export const gclipboard = document.createDocumentFragment();

/**
 * 是否支持小于12像素文字显示
 */
export const isSupportDisplayLessThan12Px = isChrome
  ? Number(chromeVersion) >= 118
  : true;

export function getBrowserName() {
  if (isChromeFrame) {
    return 'ChromeFrame';
  } else if (isIE) {
    return 'IE';
  } else if (isEdge) {
    return 'Edge';
  } else if (isElectron) {
    return 'Electron';
  } else if (isFirefox) {
    return 'Firefox';
  } else if (isOpera) {
    return 'Opera';
  } else if (isChrome) {
    return 'Chrome';
  } else if (isSafari) {
    return 'Safari';
  } else {
    return 'Other';
  }
}
