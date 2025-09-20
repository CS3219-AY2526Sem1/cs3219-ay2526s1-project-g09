import { useState } from "react";
import Layout from "@components/layout/BlueBgLayout";
import QuestionDisplay from "questionUiService/QuestionDisplay";
import { mockQuestions } from "@/data/mock-history-data";
import WorkingWindow from "collabUiService/WorkingWindow";

import NoteWindow from "historyUiService/NotesWindow";
import NavHeader from "@components/common/NavHeader";
const QuestionAttemptsPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] px-4 gap-4">
        {/* Left Column*/}
        <div className="flex flex-col w-1/3 gap-4">
          {/* Question Section */}
          <div className="h-[40vh] overflow-y-auto">
            <QuestionDisplay question={mockQuestions[0]}></QuestionDisplay>
          </div>

          <div className="flex flex-1">
            <NoteWindow></NoteWindow>
          </div>
          {/* Note Section */}
        </div>

        <div className="flex flex-1">
          <WorkingWindow></WorkingWindow>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionAttemptsPage;
