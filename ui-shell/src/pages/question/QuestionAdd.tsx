import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const QuestionAddPageShell: React.FC = () => (
  <Layout navHeader={<NavHeader />}>
    <RemoteWrapper
      remote={() => import("questionUiService/QuestionAdd")}
      loadingMessage="Loading Question Add..."
      errorMessage="Question Add service unavailable"
    />
  </Layout>
);

export default QuestionAddPageShell;
