"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Heart,
  MessageSquare,
  Target,
  Calendar,
  User
} from "lucide-react";

interface MentorshipClosureModalProps {
  mentorshipId: Id<"mentorships">;
  menteeName: string;
  topic: string;
  isOpen: boolean;
  onClose: () => void;
}

const MentorshipClosureModal: React.FC<MentorshipClosureModalProps> = ({
  mentorshipId,
  menteeName,
  topic,
  isOpen,
  onClose
}) => {
  const [closureReason, setClosureReason] = useState("");
  const [finalFeedback, setFinalFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeMentorship = useMutation(api.mentorships.closeMentorship);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closureReason.trim()) {
      toast.error("Please provide a reason for closure");
      return;
    }

    if (!finalFeedback.trim()) {
      toast.error("Please provide final feedback for the mentee");
      return;
    }

    setIsSubmitting(true);

    try {
      await closeMentorship({
        mentorshipId,
        closureReason: closureReason.trim(),
        finalFeedback: finalFeedback.trim(),
      });

      toast.success(`Mentorship with ${menteeName} has been concluded`);
      handleClose();
    } catch (error) {
      console.error("Error closing mentorship:", error);
      toast.error(error instanceof Error ? error.message : "Failed to close mentorship");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setClosureReason("");
    setFinalFeedback("");
    setIsSubmitting(false);
    onClose();
  };

  const closureReasons = [
    {
      label: "Goals Achieved",
      description: "Mentee has successfully completed their learning objectives",
      icon: <Target className="h-4 w-4" />
    },
    {
      label: "Natural Conclusion",
      description: "Mentorship has reached its natural end point",
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      label: "Time Constraints",
      description: "Mentor or mentee availability has changed",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      label: "Moving Forward",
      description: "Mentee is ready to continue independently",
      icon: <Heart className="h-4 w-4" />
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Conclude Mentorship Path
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mentorship Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Mentee:</span>
              <span className="text-muted-foreground">{menteeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Topic:</span>
              <Badge variant="secondary">{topic}</Badge>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Important Notice
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Closing this mentorship will conclude the learning path. This action cannot be undone. 
                  The mentee will no longer be able to create new assignments or send messages in this mentorship.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Closure Reason */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Reason for Closure
              </Label>
              
              {/* Quick Reason Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {closureReasons.map((reason) => (
                  <Button
                    key={reason.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setClosureReason(reason.label)}
                    className={`justify-start h-auto p-3 text-left ${
                      closureReason === reason.label 
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950" 
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {reason.icon}
                      <div>
                        <div className="font-medium text-sm">{reason.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {reason.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Or provide a custom reason for closing this mentorship..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>

            {/* Final Feedback */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Final Feedback for Mentee
              </Label>
              <Textarea
                placeholder="Provide final feedback, encouragement, and next steps for the mentee. This will be part of their permanent record..."
                value={finalFeedback}
                onChange={(e) => setFinalFeedback(e.target.value)}
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This feedback will be saved as part of the mentorship record and visible to the mentee.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !closureReason.trim() || !finalFeedback.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>Concluding...</>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Conclude Mentorship
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorshipClosureModal;
