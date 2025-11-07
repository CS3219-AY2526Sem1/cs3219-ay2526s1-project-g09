import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { useAuth } from "@/data/UserStore";
import { useNavigate } from "react-router-dom";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import {
  type HistorySnapshotInput,
  normaliseHistorySnapshot,
} from "@/api/historyService";

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const remoteProps = React.useMemo(
    () => ({
      userId: user?.username,
      allowUserFilter: true,
      renderQuestionPanel: false,
      onEntrySelect: (entry: HistorySnapshotInput) => {
        const snapshot = normaliseHistorySnapshot(entry);
        if (snapshot) {
          navigate(`/history/${snapshot.id}`, { state: { entry: snapshot } });
        }
      },
    }),
    [user?.username, navigate],
  );

  return (
    <Layout>
      <RemoteWrapper
        remote={() => import("historyUiService/HistoryApp")}
        remoteName="History UI Service"
        loadingMessage="Loading history..."
        errorMessage="History service unavailable"
        remoteProps={remoteProps}
      />
    </Layout>
  );
};

export default HistoryPage;
