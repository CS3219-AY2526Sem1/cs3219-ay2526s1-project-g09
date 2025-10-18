import React, { Suspense } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { SuspenseFallback } from "./SuspenseFallback";

// Define a custom error class for offline status
class MfeOfflineError extends Error {
  constructor(remoteName: string) {
    super(`Micro-frontend service is unavailable: ${remoteName}`);
    this.name = "MfeOfflineError";
  }
}

// Augment the module type to include the injected status property
type RemoteModule<T> = {
  default: React.ComponentType<T>;
  __mfe_status?: { isOffline: boolean };
};

interface RemoteWrapperProps<T extends object> {
  /** Function that dynamically imports a remote module */
  remote: () => Promise<RemoteModule<T>>;
  /** A name to display in the error message if offline */
  remoteName: string;
  /** Props to pass to the remote component */
  remoteProps?: T;
  loadingMessage?: string;
  errorMessage?: string;
}

export function RemoteWrapper<T extends object>({
  remote,
  remoteName,
  remoteProps,
  loadingMessage = "Loading...",
  errorMessage = "Service unavailable",
}: RemoteWrapperProps<T>) {
  // Create an enhanced loader that checks the status flag
  const enhancedRemoteLoader = async () => {
    const module = await remote();

    // Check if the injected status flag exists and indicates offline status
    if (module.__mfe_status?.isOffline) {
      // Throw an error to trigger the ErrorBoundary
      throw new MfeOfflineError(remoteName);
    }

    return module;
  };

  const LazyComponent = React.lazy(enhancedRemoteLoader);

  return (
    <ErrorBoundary fallback={<SuspenseFallback message={errorMessage} />}>
      <Suspense fallback={<SuspenseFallback message={loadingMessage} />}>
        {/* We cast remoteProps to T here, assuming the caller passes the correct type */}
        <LazyComponent {...(remoteProps as T)} />
      </Suspense>
    </ErrorBoundary>
  );
}
