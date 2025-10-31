import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionPage: React.FC = () => (
  <Layout navHeader={<NavHeader />}>
    <RemoteWrapper
      remote={() => import("questionUiService/QuestionList")}
      remoteName="Question UI Service"
      loadingMessage="Loading Question List..."
      errorMessage="Question List service unavailable"
    />
  </Layout>
);

export default QuestionPage;
