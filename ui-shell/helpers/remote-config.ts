export function remoteUrl(url: string) {
  const fallbackModule =
    "data:text/javascript,export function init(){}; export function get(){return Promise.resolve(() => ({ default: () => null, __mfe_status: { isOffline: true } }))};";

  const externalPromise = `(new Promise((resolve) => {
    fetch('${url}')
      .then(res => {
        if (!res.ok) throw new Error('Remote not reachable: ${url}');
        resolve('${url}');
      })
      .catch((e) => {
        console.warn('[MFE Offline]', '${url}', e.message);
        resolve('${fallbackModule}');
      });
  }))`;

  return {
    external: externalPromise,
    externalType: "promise" as const,
  };
}

export function getRemoteUrls(mode: string) {
  const isDev = mode === "dev";

  return {
    MATCHING_UI_URL: isDev
      ? "http://localhost:5174/assets/remoteEntry.js"
      : "https://d3vouftvcku7ec.cloudfront.net/assets/remoteEntry.js",

    QUESTION_UI_URL: isDev
      ? "http://localhost:5175/assets/remoteEntry.js"
      : "https://d3w7371nu1m2u.cloudfront.net/assets/remoteEntry.js",

    COLLAB_UI_URL: isDev
      ? "http://localhost:5176/assets/remoteEntry.js"
      : "https://d1cw3o03apjmyw.cloudfront.net/assets/remoteEntry.js",

    USER_UI_URL: isDev
      ? "http://localhost:5177/assets/remoteEntry.js"
      : "https://d2chz5pzw95mur.cloudfront.net/assets/remoteEntry.js",

    HISTORY_UI_URL: isDev
      ? "http://localhost:5178/assets/remoteEntry.js"
      : "https://d31m4d8tgmufzp.cloudfront.net/assets/remoteEntry.js",
  };
}
