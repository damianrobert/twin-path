"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { 
  Star, 
  X, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Award,
  Target
} from "lucide-react";

interface AssignmentScoringModalProps {
  assignmentId: Id<"assignments">;
  isOpen: boolean;
  onClose: () => void;
}

const AssignmentScoringModal: React.FC<AssignmentScoringModalProps> = ({ 
  assignmentId, 
  isOpen, 
  onClose 
}) => {
  const [score, setScore] = useState<number[]>([75]); // Default score of 75
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = useMutation(api.assignments.updateAssignmentStatus);
  const updateGrade = useMutation(api.assignments.updateAssignmentGrade);

  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 80) return "text-blue-600";
    if (value >= 70) return "text-yellow-600";
    if (value >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (value: number) => {
    if (value >= 90) return "Excellent";
    if (value >= 80) return "Good";
    if (value >= 70) return "Satisfactory";
    if (value >= 60) return "Needs Improvement";
    return "Unsatisfactory";
  };

  const getScoreBadge = (value: number) => {
    const grade = getScoreGrade(value);
    const color = getScoreColor(value);
    
    return (
      <Badge className={`${color} bg-opacity-10 border-current`}>
        {grade}
      </Badge>
    );
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for the mentee");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First update assignment status to reviewed, then add grade and feedback
      await updateStatus({
        assignmentId,
        status: "reviewed",
      });

      // Then update assignment grade and feedback
      await updateGrade({
        assignmentId,
        grade: score[0],
        feedback: feedback.trim(),
      });

      toast.success(`Assignment graded with score: ${score[0]}/100`);
      handleClose();
    } catch (error) {
      console.error("Error grading assignment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to grade assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setScore([75]);
    setFeedback("");
    setIsSubmitting(false);
    onClose();
  };

  const currentScore = score[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Grade Assignment
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Section */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Assignment Score
            </Label>
            <div className="mt-4 space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                      {currentScore}
                    </div>
                    <div className="text-sm text-muted-foreground">/ 100</div>
                  </div>
                  <div className="space-y-1">
                    {getScoreBadge(currentScore)}
                    <p className="text-sm text-muted-foreground">
                      {getScoreGrade(currentScore)} performance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {currentScore >= 70 ? "Passing" : "Needs Work"}
                  </span>
                </div>
              </div>

              {/* Score Slider */}
              <div className="space-y-2">
                <Label className="text-sm">Adjust Score (0-100)</Label>
                <Slider
                  value={score}
                  onValueChange={setScore}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Quick Score Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScore([100])}
                  className={currentScore === 100 ? "border-green-600" : ""}
                >
                  <Award className="h-3 w-3 mr-1" />
                  Perfect (100)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScore([85])}
                  className={currentScore === 85 ? "border-blue-600" : ""}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Excellent (85)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScore([75])}
                  className={currentScore === 75 ? "border-yellow-600" : ""}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Good (75)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScore([60])}
                  className={currentScore === 60 ? "border-orange-600" : ""}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Passing (60)
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div>
            <Label htmlFor="feedback" className="text-base font-semibold">
              Feedback for Mentee
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback on the mentee's work..."
              rows={6}
              className="mt-2"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This feedback will be visible to the mentee and will help them improve.
            </p>
          </div>

          {/* Scoring Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Scoring Guidelines:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
              <div>• <strong>90-100:</strong> Excellent work, exceeds expectations</div>
              <div>• <strong>80-89:</strong> Good work, meets expectations well</div>
              <div>• <strong>70-79:</strong> Satisfactory, meets basic requirements</div>
              <div>• <strong>60-69:</strong> Needs improvement, some issues</div>
              <div>• <strong>0-59:</strong> Unsatisfactory, major issues</div>
            </div>
          </div>

          {/* Actions */}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Reviewing..." : `Review & Score (${currentScore}/100)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentScoringModal;
