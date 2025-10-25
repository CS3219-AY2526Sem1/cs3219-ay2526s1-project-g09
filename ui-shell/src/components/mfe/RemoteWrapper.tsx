import React, { Suspense } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { SuspenseFallback } from "./SuspenseFallback";

class MfeOfflineError extends Error {
  constructor(remoteName: string) {
    super(`Micro-frontend service is unavailable: ${remoteName}`);
    this.name = "MfeOfflineError";
  }
}

type RemoteModule<T> = {
  default: React.ComponentType<T>;
  __mfe_status?: { isOffline: boolean };
};

interface RemoteWrapperProps<T extends Record<string, unknown>> {
  remote: () => Promise<RemoteModule<T>>;
  remoteName: string;
  remoteProps?: T;
  loadingMessage?: string;
  errorMessage?: string;
}

export function RemoteWrapper<T extends Record<string, unknown>>({
  remote,
  remoteName,
  remoteProps = {} as T,
  loadingMessage = "Loading...",
  errorMessage = "Service unavailable",
}: RemoteWrapperProps<T>) {
  const enhancedRemoteLoader = async () => {
    const module = await remote();

    if (module.__mfe_status?.isOffline) {
      throw new MfeOfflineError(remoteName);
    }

    return module;
  };

  const LazyComponent = React.lazy(enhancedRemoteLoader);

  return (
    <ErrorBoundary fallback={<SuspenseFallback message={errorMessage} />}>
      <Suspense fallback={<SuspenseFallback message={loadingMessage} />}>
        <LazyComponent {...remoteProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
