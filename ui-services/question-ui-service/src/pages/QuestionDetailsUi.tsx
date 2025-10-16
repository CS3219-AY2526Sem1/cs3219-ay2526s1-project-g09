import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionById, deleteQuestion } from "@/api/questionService";
import type { Question } from "@/types/Question";
import QuestionDisplay from "@/components/QuestionDisplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface QuestionDetailsPageProps {
  onNavigate: (path: string) => void;
  questionId: string;
}

const QuestionDetailsPage: React.FC<QuestionDetailsPageProps> = ({
  onNavigate,
  questionId,
}) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!questionId) return;

    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getQuestionById(questionId);
        setQuestion({
          id: data.questionId,
          title: data.title,
          body: data.content,
          topics: [data.categoryTitle ?? "Uncategorized"],
          hints: data.hints ?? [],
          answer: data.answer ?? "",
          difficulty: data.difficulty,
          timeLimit: data.timeLimit,
        });
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load question");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const handleDelete = async () => {
    if (!question) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setIsDeleting(true);

    try {
      const result = await deleteQuestion(question.id);

      if (result.ok) {
        setDeleteSuccess(result.message || "Question deleted successfully!");
      } else if (result.message) {
        const msg = result.message;
        switch (msg) {
          case "Unauthorized":
            setDeleteError("You are not authorized to delete questions.");
            break;
          case "Invalid question ID":
            setDeleteError(
              "This question ID is invalid. Please refresh and try again.",
            );
            break;
          case "Question not found":
            setDeleteError(
              "The question no longer exists or was already deleted.",
            );
            break;
          default:
            setDeleteError(msg || "Failed to delete question.");
        }
      } else {
        setDeleteError("Unexpected response from server.");
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to connect to server.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
    if (deleteSuccess) {
      onNavigate("/questions");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-400">
        Loading question data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-red-500">
        {error}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-400">
        No question found.
      </div>
    );
  }

  return (
    <div className="p-6 flex gap-6">
      {/* Left Column: Question body */}
      <div className="flex-[2] overflow-y-auto h-[80vh]">
        <QuestionDisplay questionId={questionId} />
      </div>

      {/* Right Column: Meta info + actions */}
      <div className="flex-[1] flex flex-col gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-200">
          <h3 className="font-semibold mb-2 text-lg">Details</h3>
          <p>
            <span className="font-semibold">Category:</span>{" "}
            {question.topics[0]}
          </p>
          <p>
            <span className="font-semibold">Difficulty:</span>{" "}
            {question.difficulty}
          </p>
          <p>
            <span className="font-semibold">Time Limit:</span>{" "}
            {question.timeLimit} min
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate(`/questions/${question.id}/edit`)}
            variant="outline"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
          >
            Edit
          </Button>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            className="flex-1 bg-red-600 hover:bg-red-500 text-white"
          >
            Delete
          </Button>
          <Button
            onClick={() => onNavigate("/questions")}
            variant="outline"
            className="mb-4 w-24 bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            Back
          </Button>
        </div>
      </div>

      {/* Delete confirmation / result dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteSuccess
                ? "Deletion Successful"
                : deleteError
                  ? "Error"
                  : "Delete Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 text-black">
            {deleteSuccess
              ? deleteSuccess
              : deleteError
                ? deleteError
                : `Are you sure you want to delete "${question.title}"?`}
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            {deleteSuccess || deleteError ? (
              <Button
                variant="outline"
                onClick={handleDialogClose}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionDetailsPage;
