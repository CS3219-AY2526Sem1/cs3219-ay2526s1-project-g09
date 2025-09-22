import { useState } from "react";
import Layout from "@components/layout/BlueBgLayout";
import QuestionAttemptTable from "historyUiService/QuestionAttemptTable";
import QuestionDisplay from "questionUiService/QuestionDisplay";
import { mockQuestions } from "@/data/mock-history-data";

const QuestionAttemptsPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex w-full gap-4 p-6">
        {/* Left Column (QuestionDisplay) */}
        <div className="flex-1">
          <QuestionDisplay question={mockQuestions[0]} />
        </div>

        {/* Right Column (QuestionAttemptTable) */}
        <div className="flex-2">
          <QuestionAttemptTable />
        </div>
      </div>
    </Layout>
  );
};

export default QuestionAttemptsPage;
