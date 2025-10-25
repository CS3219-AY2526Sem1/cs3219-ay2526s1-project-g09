import React, { useEffect } from "react";
import SessionLayout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/collab/SessionHeader";
import { CollabSessionProvider } from "collabUiService/CollabSessionContext";
import { useCollabSession as useRemoteCollabSession } from "collabUiService/CollabSessionHook";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

type AuthUser = ReturnType<typeof useAuth>["user"];

const SessionPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.username ?? null;

  if (!user || !currentUserId) {
    return (
      <SessionLayout navHeader={<NavHeader />}>
        <div className="flex h-[85vh] items-center justify-center px-4">
          <p className="text-white/70">
            Please log in to access collaboration sessions.
          </p>
        </div>
      </SessionLayout>
    );
  }

  return (
    <CollabSessionProvider currentUserId={currentUserId}>
      <SessionLayout navHeader={<NavHeader />}>
        <SessionContent user={user} />
      </SessionLayout>
    </CollabSessionProvider>
  );
};

export default SessionPage;

interface SessionContentProps {
  user: AuthUser;
}

const SessionContent: React.FC<SessionContentProps> = ({ user }) => {
  const { session, loading, error, refresh } = useRemoteCollabSession();

  useEffect(() => {
    if (!loading && !session) {
      void refresh();
    }
  }, [loading, session, refresh]);

  if (loading) {
    return (
      <div className="flex h-[85vh] items-center justify-center px-4">
        <p className="text-white/70">Preparing collaboration session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-[85vh] items-center justify-center px-4">
        <p className="text-red-400">
          {error ?? "No active collaboration session found."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[85vh] gap-4 px-4">
      <div className="flex flex-col w-1/3 gap-4">
        <div className="flex-1 h-[50vh] overflow-y-auto">
          {session.questionId ? (
            <RemoteWrapper
              remote={() => import("questionUiService/QuestionDisplay")}
              remoteName="QuestionDisplay"
              loadingMessage="Loading Question..."
              errorMessage="Question service unavailable"
              remoteProps={{ questionId: session.questionId }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-gray-800 text-white/70">
              <p>No question assigned to this session.</p>
            </div>
          )}
        </div>

        <div className="flex h-[30vh] flex-1">
          <RemoteWrapper
            remote={() => import("collabUiService/ChatWindow")}
            remoteName="ChatWindow"
            remoteProps={{ user }}
            loadingMessage="Loading Chat..."
            errorMessage="Chat service unavailable"
          />
        </div>
      </div>

      <div className="flex flex-1">
        <RemoteWrapper
          remote={() => import("collabUiService/WorkingWindow")}
          remoteName="WorkingWindow"
          remoteProps={{ user }}
          loadingMessage="Loading Workspace..."
          errorMessage="Workspace service unavailable"
        />
      </div>
    </div>
  );
};
