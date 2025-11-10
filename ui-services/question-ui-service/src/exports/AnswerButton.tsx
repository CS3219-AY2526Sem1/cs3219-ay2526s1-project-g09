import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AnswerButtonProps {
  answer?: string;
}

const AnswerButton: React.FC<AnswerButtonProps> = ({ answer }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
        >
          Show Answer
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[50vw] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Answer</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-300 whitespace-pre-wrap h-[30vh] overflow-y-auto">
            {answer}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnswerButton;
