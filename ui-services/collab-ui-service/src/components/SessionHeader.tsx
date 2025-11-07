import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import SessionTimer from "./SessionTimer";
import { useCollabSession } from "../context/CollabSessionHook";

interface SessionHeaderProps {
  onLeaveSession?: () => void | Promise<void>;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ onLeaveSession }) => {
  const { session, loading, error, isHydrated } = useCollabSession();
  const sessionId = session?.sessionId ?? null;

  const [openDialog, setOpenDialog] = useState(false);

  if (!isHydrated) return null;

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

  const handleLeave = () => {
    if (onLeaveSession) {
      void onLeaveSession();
    }
    window.dispatchEvent(new Event("collab:leave-session"));
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center space-x-4">
          <SessionTimer sessionId={sessionId} />

          <Button
            type="button"
            variant="ghost"
            className="text-white bg-black hover:bg-gray-700"
            onClick={() => setOpenDialog(true)}
          >
            Leave Session
          </Button>
        </div>
      </header>

      {/* Leave confirmation dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave collaboration session?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            You'll lose your current collaboration progress. Are you sure you
            want to leave?
          </p>

          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                setOpenDialog(false);
                handleLeave();
              }}
            >
              Leave Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionHeader;
