import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const MatchingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout navHeader={<NavHeader />}>
      <div className="mb-20 flex-1 flex">
        <RemoteWrapper
          remote={() => import("matchingUiService/MatchingUi")}
          remoteProps={{ user }}
          loadingMessage="Loading Matching UI..."
          errorMessage="Matching service unavailable"
        />
      </div>
    </Layout>
  );
};

export default MatchingPage;
