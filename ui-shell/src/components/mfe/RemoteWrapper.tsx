import React, { Suspense, useMemo } from "react";
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

  /** When true, do NOT show the fullscreen loading screen */
  suppressFallback?: boolean;
}

export function RemoteWrapper<T extends Record<string, unknown>>({
  remote,
  remoteName,
  remoteProps = {} as T,
  loadingMessage = "Loading...",
  errorMessage = "Service unavailable",
  suppressFallback = false,
}: RemoteWrapperProps<T>) {
  const LazyComponent = useMemo(() => {
    const enhancedRemoteLoader = async () => {
      const module = await remote();
      if (module.__mfe_status?.isOffline) {
        throw new MfeOfflineError(remoteName);
      }
      return module;
    };
    return React.lazy(enhancedRemoteLoader);
  }, [remote, remoteName]);

  const MemoizedComponent = useMemo(() => {
    return React.memo(({ ...props }: T) => <LazyComponent {...props} />);
  }, [LazyComponent]);

  return (
    <ErrorBoundary fallback={<SuspenseFallback message={errorMessage} />}>
      <Suspense
        fallback={
          suppressFallback ? (
            // Smooth placeholder instead of fullscreen loader
            <div className="w-[88px] h-[40px] rounded-lg bg-white/10 animate-pulse" />
          ) : (
            <SuspenseFallback message={loadingMessage} />
          )
        }
      >
        <MemoizedComponent {...remoteProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
