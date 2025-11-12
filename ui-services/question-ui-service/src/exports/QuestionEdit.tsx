import React, { useEffect, useState } from "react";
import { getQuestionById, updateQuestion } from "@/api/questionService";
import QuestionFormUi from "@/components/QuestionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { QuestionForm } from "@/components/QuestionForm/QuestionSchemas";
import { useNavigate } from "react-router-dom";

interface QuestionEditPageProps {
  questionId: string;
}

const QuestionEditPage: React.FC<QuestionEditPageProps> = ({ questionId }) => {
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<QuestionForm>({
    title: "",
    categoryTitle: "",
    difficulty: "Easy",
    timeLimit: 60,
    content: "",
    hints: [""],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [navigateAfterClose, setNavigateAfterClose] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        setLoading(true);
        const data = await getQuestionById(questionId);
        setInitialValues({
          title: data.title,
          categoryTitle: data.categoryTitle,
          difficulty: data.difficulty,
          timeLimit: data.timeLimit,
          content: data.content,
          hints: data.hints?.length ? data.hints : [""],
          answer: data.answer,
        });
      } catch (err) {
        console.error("Failed to load question:", err);
        setDialogMessage("Failed to load question data.");
        setDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    loadQuestion();
  }, [questionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-400">
        Loading question data...
      </div>
    );
  }

  const handleSubmit = async (data: QuestionForm) => {
    try {
      const result = await updateQuestion(questionId, data);
      setDialogMessage(result.message ?? "Question updated successfully");
      setNavigateAfterClose(true);
      setDialogOpen(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating the question";
      setDialogMessage(message);
      setNavigateAfterClose(false);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <QuestionFormUi
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onBack={() => navigate(`/questions/${questionId}`)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
          </DialogHeader>
          <div className="py-2">{dialogMessage}</div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen(false);
                if (navigateAfterClose) {
                  navigate(`/questions/${questionId}`);
                }
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuestionEditPage;
