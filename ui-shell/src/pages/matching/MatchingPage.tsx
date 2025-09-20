import React, { Suspense } from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";

// Lazy load the remote MFE
const RemoteMatchingUi = React.lazy(
  () => import("matchingUiService/MatchingUi")
);

const FallbackUi: React.FC = () => (
  <div className="p-6 text-center">
    <h2 className="text-xl font-bold">⚠️ Matching service unavailable</h2>
    <p className="text-gray-600">Please try again later.</p>
  </div>
);

// ErrorBoundary with TS support
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error("Error loading remote MatchingUi:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const MatchingPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="mb-20 flex-1 flex">
        <ErrorBoundary fallback={<FallbackUi />}>
          <Suspense fallback={<p>Loading Matching UI...</p>}>
            <RemoteMatchingUi />
          </Suspense>
        </ErrorBoundary>
      </div>
    </Layout>
  );
};

export default MatchingPage;
