import React from "react";
import { Button } from "@/components/ui/button";

import SessionTimer from "./SessionTimer";

interface SessionHeaderProps {
  onLeaveSession?: () => void | Promise<void>;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ onLeaveSession }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    throw new Error("Session ID is required for SessionTimer");
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
