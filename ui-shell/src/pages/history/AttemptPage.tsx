import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import QuestionDisplay from "questionUiService/QuestionDisplay";
import { mockQuestions } from "@/data/mock-history-data";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionAttemptsPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] px-4 gap-4">
        {/* Left Column */}
        <div className="flex flex-col w-1/3 gap-4">
          {/* Question Section */}
          <div className="h-[40vh] overflow-y-auto">
            <QuestionDisplay question={mockQuestions[0]} />
          </div>

          {/* Notes Section */}
          <div className="flex flex-1">
            <RemoteWrapper
              remote={() => import("historyUiService/NotesWindow")}
              loadingMessage="Loading Notes..."
              errorMessage="Notes service unavailable"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-1">
          <RemoteWrapper
            remote={() => import("collabUiService/WorkingWindow")}
            loadingMessage="Loading Workspace..."
            errorMessage="Workspace service unavailable"
          />
        </div>
      </div>
    </Layout>
  );
};

export default QuestionAttemptsPage;
