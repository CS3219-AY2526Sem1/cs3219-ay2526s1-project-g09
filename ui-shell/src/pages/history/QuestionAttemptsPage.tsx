import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { mockQuestions } from "@/data/mock-history-data";

const QuestionAttemptsPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] px-4 gap-4">
        {/* Left Column */}
        <div className="flex flex-col w-1/3 gap-4">
          {/* Question Section */}
          <div className="h-[40vh] overflow-y-auto">
            <RemoteWrapper
              remote={() => import("questionUiService/QuestionDisplay")}
              remoteName="Question UI Service"
              remoteProps={{ question: mockQuestions[0] }}
              loadingMessage="Loading Question..."
              errorMessage="Question Display service unavailable"
            />
          </div>

          {/* Notes Section */}
          <div className="flex flex-1">
            <RemoteWrapper
              remote={() => import("historyUiService/NotesWindow")}
              remoteName="History UI Service"
              loadingMessage="Loading Notes..."
              errorMessage="Notes service unavailable"
            />
          </div>
        </div>

        {/* Right Column - Collaboration Window */}
        <div className="flex flex-1">
          <RemoteWrapper
            remote={() => import("collabUiService/WorkingWindow")}
            remoteName="Collab UI Service"
            loadingMessage="Loading Collaboration Window..."
            errorMessage="Collaboration service unavailable"
          />
        </div>
      </div>
    </Layout>
  );
};

export default QuestionAttemptsPage;
