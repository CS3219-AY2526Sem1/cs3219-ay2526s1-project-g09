import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import { useNavigate, useParams } from "react-router-dom";
import QuestionEdit from "questionUiService/QuestionEdit";
import NavHeader from "@/components/common/NavHeader";

const QuestionEditPageShell: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <p className="text-gray-400">No question selected.</p>;

  return (
    <Layout navHeader={<NavHeader />}>
      <QuestionEdit questionId={id} onNavigate={navigate} />
    </Layout>
  );
};

export default QuestionEditPageShell;
