import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Eye } from "lucide-react";

interface ConfirmPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmPublishModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Publish Post",
  description = "Are you ready to publish this post? It will be visible to all users on the TwinPath blog.",
  confirmText = "Publish",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmPublishModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What happens when you publish:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your post becomes visible to all TwinPath users</li>
                <li>Users can read, like, and share your content</li>
                <li>The post will appear in the blog listing</li>
                <li>You can still edit or unpublish later</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Publishing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
