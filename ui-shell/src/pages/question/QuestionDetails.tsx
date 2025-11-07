import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { useParams } from "react-router-dom";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionDetailsPageShell: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <p className="text-gray-400">No question selected.</p>;

  return (
    <Layout>
      <RemoteWrapper
        remote={() => import("questionUiService/QuestionDetails")}
        remoteName="Question UI Service"
        remoteProps={{ questionId: id }}
        loadingMessage="Loading Question Details..."
        errorMessage="Question Details service unavailable"
      />
    </Layout>
  );
};

export default QuestionDetailsPageShell;
