import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MatchNotFoundDialogProps {
  onClose: () => void;
}

const MatchNotFoundDialog: React.FC<MatchNotFoundDialogProps> = ({
  onClose,
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">No Match Found</DialogTitle>
          <DialogDescription className="mt-2">
            We couldn't find a match for your preferences.
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

export default MatchNotFoundDialog;
