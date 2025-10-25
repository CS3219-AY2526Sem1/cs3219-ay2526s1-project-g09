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
      : "https://peerprep-matching-ui-service.s3-website-ap-southeast-1.amazonaws.com/assets/remoteEntry.js",

    QUESTION_UI_URL: isDev
      ? "http://localhost:5175/assets/remoteEntry.js"
      : "https://peerprep-question-ui-service.s3-website-ap-southeast-1.amazonaws.com/assets/remoteEntry.js",

    COLLAB_UI_URL: isDev
      ? "http://localhost:5176/assets/remoteEntry.js"
      : "https://peerprep-collab-ui-service.s3-website-ap-southeast-1.amazonaws.com/assets/remoteEntry.js",

    USER_UI_URL: isDev
      ? "http://localhost:5177/assets/remoteEntry.js"
      : "https://peerprep-user-ui-service.s3.ap-southeast-1.amazonaws.com/assets/remoteEntry.js",

    HISTORY_UI_URL: isDev
      ? "http://localhost:5178/assets/remoteEntry.js"
      : "https://peerprep-history-ui-service.s3-website-ap-southeast-1.amazonaws.com/assets/remoteEntry.js",
  };
}
