import React, { useEffect } from "react";
import Layout from "@components/layout/BlueBgLayout";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { CollabSessionProvider } from "collabUiService/CollabSessionContext";
import { useCollabSession as useRemoteCollabSession } from "collabUiService/CollabSessionHook";
import { useNavigate } from "react-router-dom";

const MatchingPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.username ?? null;

  if (!user || !currentUserId) {
    return (
      <Layout>
        <div className="flex h-[85vh] items-center justify-center px-4">
          <p className="text-white/70">
            Please log in to access the matching page.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <CollabSessionProvider currentUserId={currentUserId}>
      <Layout>
        <MatchingContent user={user} />
      </Layout>
    </CollabSessionProvider>
  );
};

export default MatchingPage;

interface MatchingContentProps {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
}

const MatchingContent: React.FC<MatchingContentProps> = ({ user }) => {
  const navigate = useNavigate();
  const { session, loading, isHydrated } = useRemoteCollabSession();

  // Redirect once hydrated and session exists
  useEffect(() => {
    if (isHydrated && !loading && session) {
      navigate("/collab", { replace: true });
    }
  }, [isHydrated, loading, session, navigate]);

  if (!isHydrated || loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/70">
        Checking session...
      </div>
    );
  }

  return (
    <div className="mb-20 flex-1 flex">
      <RemoteWrapper
        remote={() => import("matchingUiService/MatchingUi")}
        remoteName="Matching UI Service"
        remoteProps={{ user }}
        loadingMessage="Loading.."
        errorMessage="Matching service unavailable"
      />
    </div>
  );
};
