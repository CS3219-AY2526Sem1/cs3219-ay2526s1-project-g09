import React from "react";
import { Button } from "@/components/ui/button";

import SessionTimer from "./SessionTimer";

const SessionHeader: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 shadow-md">
      <div className="flex items-center space-x-4">
        <SessionTimer />
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          Submit 0/2
        </Button>
        <a href="/matching">
          <Button
            variant="ghost"
            className="text-white-400 bg-black hover:bg-gray-700"
          >
            Leave Session
          </Button>
        </a>
      </div>
    </header>
  );
};

export default SessionHeader;
