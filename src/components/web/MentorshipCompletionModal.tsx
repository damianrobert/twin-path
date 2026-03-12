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
  Award,
  MessageSquare,
  Target,
  Calendar,
  User,
  Star,
  Heart
} from "lucide-react";

interface MentorshipCompletionModalProps {
  mentorshipId: Id<"mentorships">;
  menteeName: string;
  topic: string;
  isOpen: boolean;
  onClose: () => void;
}

const MentorshipCompletionModal: React.FC<MentorshipCompletionModalProps> = ({
  mentorshipId,
  menteeName,
  topic,
  isOpen,
  onClose
}) => {
  const [finalFeedback, setFinalFeedback] = useState("");
  const [achievements, setAchievements] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeMentorship = useMutation(api.mentorships.completeMentorship);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!finalFeedback.trim()) {
      toast.error("Please provide final feedback for the mentee");
      return;
    }

    setIsSubmitting(true);

    try {
      await completeMentorship({
        mentorshipId,
      });

      toast.success(`Congratulations! Mentorship with ${menteeName} has been successfully completed`);
      handleClose();
    } catch (error) {
      console.error("Error completing mentorship:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete mentorship");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFinalFeedback("");
    setAchievements("");
    setNextSteps("");
    setIsSubmitting(false);
    onClose();
  };

  const achievementSuggestions = [
    " mastered core concepts",
    " completed all assignments successfully",
    " showed exceptional progress",
    " developed strong foundational skills",
    " achieved learning goals ahead of schedule"
  ];

  const nextStepSuggestions = [
    "Continue practicing advanced concepts",
    "Apply skills in real-world projects",
    "Explore related topics for further growth",
    "Consider mentoring others in the future",
    "Build a portfolio of completed work"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Complete Mentorship Path
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
          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                  🎉 Congratulations on a Successful Mentorship!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  You're about to mark this mentorship as successfully completed. This is a celebration of the learning journey and achievements accomplished together.
                </p>
              </div>
            </div>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Achievements */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Key Achievements
              </Label>
              
              {/* Achievement Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {achievementSuggestions.map((achievement) => (
                  <Button
                    key={achievement}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAchievements(prev => prev ? `${prev}, ${achievement}` : achievement)}
                    className="justify-start h-auto p-2 text-left"
                  >
                    <span className="text-sm">{menteeName}{achievement}</span>
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Describe the key achievements and milestones reached during this mentorship..."
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Final Feedback */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Final Feedback & Encouragement
              </Label>
              <Textarea
                placeholder="Provide heartfelt final feedback, encouragement, and celebrate the mentee's growth. This will be a cherished memory of their learning journey..."
                value={finalFeedback}
                onChange={(e) => setFinalFeedback(e.target.value)}
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This feedback will be saved as part of the mentorship completion record and visible to the mentee.
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recommended Next Steps
              </Label>
              
              {/* Next Step Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nextStepSuggestions.map((step) => (
                  <Button
                    key={step}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNextSteps(prev => prev ? `${prev}, ${step}` : step)}
                    className="justify-start h-auto p-2 text-left"
                  >
                    <span className="text-sm">{step}</span>
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Suggest next steps for continued learning and growth..."
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                className="min-h-[80px]"
              />
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
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || !finalFeedback.trim()}
              >
                {isSubmitting ? (
                  <>Completing...</>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Complete Mentorship
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

export default MentorshipCompletionModal;
