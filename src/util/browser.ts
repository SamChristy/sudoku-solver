// eslint-disable-next-line import/prefer-default-export -- until we add more functions...
export const loadMobileConsole = () => {
  const script = document.createElement('script');
  script.src = `${process.env.PUBLIC_URL}/mobileConsole.js`;
  // @ts-ignore -- eruda will have been defined globally, by the above script.
  script.addEventListener('load', () => eruda.init());
  document.body.appendChild(script);
};
