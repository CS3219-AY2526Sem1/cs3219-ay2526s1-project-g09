import SessionLayout from "@components/layout/BlueBgLayout";

import QuestionDisplay from "questionUiService/QuestionDisplay";
import ChatWindow from "collabUiService/ChatWindow";
import WorkingWindow from "collabUiService/WorkingWindow";
import NavHeader from "@components/collab/SessionHeader";

const SessionPage: React.FC = () => {
  return (
    <SessionLayout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] gap-4 px-4">
        {/* Left Column (Question & Chat) */}
        <div className="flex flex-col w-1/3 gap-4">
          {/* Question Section */}
          <div className="flex-1 h-[50vh] overflow-y-auto">
            <QuestionDisplay />
          </div>

          {/* Chat Section */}
          <div className="flex h-[30vh] flex-1">
            <ChatWindow></ChatWindow>
          </div>
        </div>

        <div className="flex flex-1">
          <WorkingWindow></WorkingWindow>
        </div>
      </div>
    </SessionLayout>
  );
};

export default SessionPage;
