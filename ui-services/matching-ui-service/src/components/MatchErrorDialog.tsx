import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MatchErrorDialogProps {
  onClose: () => void;
}

const MatchErrorDialog: React.FC<MatchErrorDialogProps> = ({ onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Oops! Something went wrong.
          </DialogTitle>
          <DialogDescription className="mt-2">
            Please try matching again at a later time.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-center mt-4">
          <Button
            onClick={onClose}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Okay!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchErrorDialog;
