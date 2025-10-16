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
import type { QuestionFormValues } from "@/types/QuestionSchemas";

interface QuestionEditPageProps {
  onNavigate: (path: string) => void;
  questionId: string;
}

const QuestionEditPage: React.FC<QuestionEditPageProps> = ({
  onNavigate,
  questionId,
}) => {
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<QuestionFormValues>({
    title: "",
    categoryTitle: "",
    difficulty: "Easy",
    timeLimit: 60,
    content: "",
    hints: [""],
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [navigateAfterClose, setnavigateAfterClose] = useState(false);

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

  const handleSubmit = async (
    data: Omit<QuestionFormValues, "hints">,
    hints: string[],
  ) => {
    try {
      const payload = { ...data, hints };
      const result = await updateQuestion(questionId, payload);
      setDialogMessage(result.message || "Question updated successfully");
      setnavigateAfterClose(true);
      setDialogOpen(true);
    } catch (err) {
      const error =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating the question";
      setDialogMessage(error);
      setnavigateAfterClose(false);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <QuestionFormUi
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onBack={() => onNavigate(`/questions/${questionId}`)}
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
                  onNavigate(`/questions/${questionId}`);
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
