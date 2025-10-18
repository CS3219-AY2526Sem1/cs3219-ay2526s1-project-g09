import React from "react";
import SessionLayout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/collab/SessionHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const SessionPage: React.FC = () => {
  return (
    <SessionLayout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] gap-4 px-4">
        {/* Left Column (Question & Chat) */}
        <div className="flex flex-col w-1/3 gap-4">
          {/* Question Section */}
          <div className="flex-1 h-[50vh] overflow-y-auto">
            <RemoteWrapper
              remote={() => import("questionUiService/QuestionDisplay")}
              loadingMessage="Loading Question..."
              errorMessage="Question service unavailable"
            />
          </div>

          {/* Chat Section */}
          <div className="flex h-[30vh] flex-1">
            <RemoteWrapper
              remote={() => import("collabUiService/ChatWindow")}
              loadingMessage="Loading Chat..."
              errorMessage="Chat service unavailable"
            />
          </div>
        </div>

        {/* Working Section */}
        <div className="flex flex-1">
          <RemoteWrapper
            remote={() => import("collabUiService/WorkingWindow")}
            loadingMessage="Loading Workspace..."
            errorMessage="Workspace service unavailable"
          />
        </div>
      </div>
    </SessionLayout>
  );
};

export default SessionPage;
