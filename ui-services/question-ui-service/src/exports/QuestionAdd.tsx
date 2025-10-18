import React, { useState } from "react";
import { createQuestion } from "@/api/questionService";
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

const QuestionAddPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [navigateAfterClose, setNavigateAfterClose] = useState<string>();
  const navigate = useNavigate();

  const handleSubmit = async (data: QuestionForm) => {
    try {
      const payload = data;
      const result = await createQuestion(payload);

      if (result.ok) {
        setDialogMessage(result.message ?? "Question created successfully");
        setNavigateAfterClose(
          result.id ? `/questions/${result.id}` : undefined,
        );
      } else {
        setDialogMessage(result.message ?? "Failed to create question");
        setNavigateAfterClose(undefined);
      }

      setDialogOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create question";
      setDialogMessage(message);
      setNavigateAfterClose(undefined);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <QuestionFormUi
        mode="add"
        onSubmit={handleSubmit}
        onBack={() => navigate("/questions")}
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
                if (navigateAfterClose) navigate(navigateAfterClose);
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

export default QuestionAddPage;
