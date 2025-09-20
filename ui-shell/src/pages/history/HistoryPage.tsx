import Layout from "@components/layout/BlueBgLayout";
import HistoryTable from "historyUiService/QuestionHistoryTable";
import NavHeader from "@components/common/NavHeader";

const HistoryPage: React.FC = () => {
  return (
    <Layout navHeader={<NavHeader />}>
      <HistoryTable></HistoryTable>
    </Layout>
  );
};

export default HistoryPage;
