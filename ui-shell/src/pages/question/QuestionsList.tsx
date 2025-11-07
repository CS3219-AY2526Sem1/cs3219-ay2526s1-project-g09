import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionPage: React.FC = () => (
  <Layout>
    <RemoteWrapper
      remote={() => import("questionUiService/QuestionList")}
      remoteName="Question UI Service"
      loadingMessage="Loading Question List..."
      errorMessage="Question List service unavailable"
    />
  </Layout>
);

export default QuestionPage;
