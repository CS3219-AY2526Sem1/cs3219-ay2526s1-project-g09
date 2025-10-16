import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { useNavigate } from "react-router-dom";
import QuestionAdd from "questionUiService/QuestionAdd";
import NavHeader from "@/components/common/NavHeader";

const QuestionAddPageShell: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout navHeader={<NavHeader />}>
      <QuestionAdd onNavigate={navigate} />
    </Layout>
  );
};

export default QuestionAddPageShell;
