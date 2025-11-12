import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionAddPageShell: React.FC = () => (
  <Layout>
    <RemoteWrapper
      remote={() => import("questionUiService/QuestionAdd")}
      remoteName="Question UI Service"
      loadingMessage="Loading Question Add..."
      errorMessage="Question Add service unavailable"
    />
  </Layout>
);

export default QuestionAddPageShell;
