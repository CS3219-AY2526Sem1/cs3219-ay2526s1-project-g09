import React from "react";
import Layout from "@components/layout/BlueBgLayout";

import { useParams, useNavigate } from "react-router-dom";
import QuestionDetails from "questionUiService/QuestionDetails";
import NavHeader from "@/components/common/NavHeader";

const QuestionDetailsPageShell: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <p className="text-gray-400">No question selected.</p>;

  return (
    <Layout navHeader={<NavHeader />}>
      <QuestionDetails questionId={id} onNavigate={navigate} />
    </Layout>
  );
};

export default QuestionDetailsPageShell;
