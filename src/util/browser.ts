import { detect } from 'detect-browser';

export const browser = detect();

/**
 * Some scripts aren't available on npm, as modules or are simply too big to be bundled, in a
 * browser context; so this function will load them "the old fashioned way", via a script element.
 *
 * @param url     The url of the script to load (can be relative or absolute).
 * @param timeout The max amount of time the script can take to load, before throwing an Error.
 */
export const loadScript = async (url: string, timeout = 10000): Promise<void> => {
  const script = document.createElement('script');
  script.defer = true;

  if (url.startsWith('http')) script.src = url;
  else if (url.startsWith('/')) script.src = `${process.env.PUBLIC_URL}${url}`;
  else script.src = `${process.env.PUBLIC_URL}/${url}`;

  document.body.appendChild(script);

  return new Promise((resolve, reject): void => {
    const timeoutId = window.setTimeout(
      () => reject(new Error(`${url} failed to load in time`)),
      timeout
    );

    script.addEventListener('load', () => {
      window.clearTimeout(timeoutId);
      resolve();
    });
  });
};

/**
 * Loads a mobile console that can be very helpful for debugging on mobile devices.
 * (Eruda's npm package unfortunately doesn't export a module, so we have to manually load it like
 * this.)
 */
export const loadMobileConsole = async (): Promise<void> => {
  await loadScript('/mobileConsole.js');
  // @ts-ignore -- eruda will have been defined globally, by the script.
  eruda.init();
};

type EventHandler = () => void;
type TabChangeHandlers = { opened: EventHandler; closed: EventHandler };
type CleanUpFunction = () => void;

/**
 * @param opened Function to run when the browser tab/window is reopened.
 * @param closed Function to run when the browser tab/window is closed.
 * @return Cleanup function, to remove the event handler.
 */
export const onTabChange = ({ opened, closed }: TabChangeHandlers): CleanUpFunction => {
  const handler = () => (document.hidden ? closed() : opened());
  document.addEventListener('visibilitychange', handler);

  return () => document.removeEventListener('visibilitychange', handler);
};

/**
 * Runs the supplied function when the user navigates back to the site.
 *
 * @return Cleanup function, to remove the event handler.
 */
export const onBack = (eventHandler: EventHandler): CleanUpFunction => {
  const handler = (event: PageTransitionEvent) => event.persisted && eventHandler();
  window.addEventListener('pageshow', handler, false);

  return () => window.removeEventListener('pageshow', handler);
};

/**
 * @see https://bugs.webkit.org/show_bug.cgi?id=141832
 */
export const fixViewportHeightInMobileSafari = (): void => {
  browser?.os === 'iOS' &&
    browser.name === 'ios' &&
    window.addEventListener('resize', () => {
      document.body.style.height = '100vh';
    });
};
