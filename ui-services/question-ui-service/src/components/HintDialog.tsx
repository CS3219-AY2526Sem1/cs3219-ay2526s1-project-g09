import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HintDialogProps {
  hint: string;
  index: number;
}

const HintDialog: React.FC<HintDialogProps> = ({ hint, index }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
        >
          Show Hint #{index + 1}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Hint #{index + 1}</DialogTitle>
        </DialogHeader>
        <div
          className="py-4 prose prose-invert"
          dangerouslySetInnerHTML={{ __html: hint }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default HintDialog;
