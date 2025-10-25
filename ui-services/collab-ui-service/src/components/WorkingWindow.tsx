import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import CollabEditor from "./collab/CollabEditor";
import { useCollabSession } from "../context/CollabSessionHook";

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface CollabPageProps {
  user?: User | null;
}

const WorkingWindow: React.FC<CollabPageProps> = ({ user }) => {
  const { session, loading, error, isHydrated } = useCollabSession();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white/70">
          Collaboration session unavailable in this view.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access collab</p>
      </div>
    );
  }

  const username = user.username;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white/70">Loading collaboration session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-400">
          {error ?? "No active collaboration session found."}
        </p>
      </div>
    );
  }

  const participants =
    session.users ??
    session.participants?.map((participant) => participant.userId) ??
    [];

  return (
    <div className="flex flex-1 bg-gray-800 rounded-lg shadow-md overflow-hidden relative">
      <Tabs defaultValue="code" className="flex flex-col flex-1">
        <TabsList className="absolute top-4 right-4 z-10 bg-gray-700 rounded-lg shadow-md">
          <TabsTrigger
            value="code"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Code {username}
          </TabsTrigger>
          <TabsTrigger
            value="whiteboard"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Whiteboard
          </TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
          <CollabEditor
            questionId={session.questionId}
            users={participants}
            sessionId={session.sessionId}
            currentUserId={username}
          />
        </TabsContent>
        <TabsContent value="whiteboard" className="flex-1 p-4 overflow-hidden">
          <Tldraw />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkingWindow;
