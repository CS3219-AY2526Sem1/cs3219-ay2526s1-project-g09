import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { mockQuestions } from "@/data/mock-data";

const AnswerButton: React.FC = () => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Dialog onOpenChange={(open) => !open && setConfirmed(false)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
        >
          Show Answer 0/2
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[50vw] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Question Answer</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!confirmed ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-400">
                Are you sure you want to reveal the answer? This action cannot
                be undone.
              </p>
              <Button
                onClick={() => setConfirmed(true)}
                className="bg-red-600 hover:bg-red-500"
              >
                Yes, show answer
              </Button>
            </div>
          ) : (
            <p className="text-gray-400 whitespace-pre-wrap h-[30vh] overflow-y-auto">
              {mockQuestions[0].answer}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnswerButton;
