import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const HistoryPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <RemoteWrapper
        remote={() => import("historyUiService/QuestionHistoryTable")}
        remoteName="History UI Service"
        loadingMessage="Loading History..."
        errorMessage="History service unavailable"
      />
    </Layout>
  );
};

export default HistoryPage;
