import React from "react";
import { Button } from "@/components/ui/button";

import SessionTimer from "./SessionTimer";
import { useCollabSession } from "../context/CollabSessionHook";

interface SessionHeaderProps {
  onLeaveSession?: () => void | Promise<void>;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ onLeaveSession }) => {
  const { session, loading, error, isHydrated } = useCollabSession();
  const sessionId = session?.sessionId ?? null;

  if (!isHydrated) {
    return null;
  }

  if (loading) {
    return (
      <header className="flex items-center justify-between p-4 shadow-md">
        <p className="text-white/70">Connecting to session…</p>
      </header>
    );
  }

  if (!sessionId) {
    return (
      <header className="flex items-center justify-between p-4 shadow-md">
        <p className="text-red-400">
          {error ?? "No active collaboration session found."}
        </p>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between p-4 shadow-md">
      <div className="flex items-center space-x-4">
        <SessionTimer sessionId={sessionId} />
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          Submit 0/2
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-white-400 bg-black hover:bg-gray-700"
          onClick={() => {
            const confirmed = window.confirm(
              "Are you sure you want to leave this collaboration session?",
            );

            if (!confirmed) {
              return;
            }

            if (onLeaveSession) {
              void onLeaveSession();
            }
            window.dispatchEvent(new Event("collab:leave-session"));
          }}
        >
          Leave Session
        </Button>
      </div>
    </header>
  );
};

export default SessionHeader;
