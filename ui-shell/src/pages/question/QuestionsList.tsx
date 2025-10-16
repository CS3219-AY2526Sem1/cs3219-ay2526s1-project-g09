import Layout from "@components/layout/BlueBgLayout";
import QuestionList from "questionUiService/QuestionList";
import NavHeader from "@components/common/NavHeader";
import { useNavigate } from "react-router";

const QuestionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout navHeader={<NavHeader />}>
      <QuestionList onNavigate={navigate}></QuestionList>
    </Layout>
  );
};

export default QuestionPage;
