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
import type { QuestionForm } from "@/types/QuestionSchemas";

interface QuestionAddPageProps {
  onNavigate: (path: string) => void;
}

const QuestionAddPage: React.FC<QuestionAddPageProps> = ({ onNavigate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [navigateAfterClose, setNavigateAfterClose] = useState<string | null>(
    null,
  );

  const handleSubmit = async (data: QuestionForm, hints: string[]) => {
    try {
      const payload = { ...data, hints };
      const result = await createQuestion(payload);

      if (result.ok) {
        setDialogMessage(result.message || "Question created successfully");
        setNavigateAfterClose(`/questions/${result.id}`);
      } else {
        setDialogMessage(result.message || "Failed to create question");
        setNavigateAfterClose(null);
      }

      setDialogOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create question";
      setDialogMessage(message);
      setNavigateAfterClose(null);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <QuestionFormUi
        mode="add"
        onSubmit={handleSubmit}
        onBack={() => onNavigate("/questions")}
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
                  onNavigate(navigateAfterClose);
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

export default QuestionAddPage;
