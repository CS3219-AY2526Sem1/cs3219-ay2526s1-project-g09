import React from "react";
import type { User } from "@/types/User";
import { useCollabSession } from "@/context/CollabSessionHook";

interface ChatHeaderProps {
  currentUser?: User | null;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ currentUser }) => {
  const { session } = useCollabSession();
  let otherUser = "Unknown User";
  if (currentUser && session?.users) {
    const foundUser = session.users.find((u) => u !== currentUser.username);
    if (foundUser) otherUser = foundUser;
  }
  return (
    <div className="flex items-center justify-center p-4 space-x-2">
      <span className="text-sm font-semibold text-white">{otherUser}</span>
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
    </div>
  );
};

export default ChatHeader;
