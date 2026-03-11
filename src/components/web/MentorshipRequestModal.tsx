"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Send, 
  User, 
  Star,
  AlertCircle
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Mentor {
  _id: Id<"users">;
  name: string;
  bio?: string;
  role: "mentor" | "mentee" | "both";
  professionalExperience?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  yearsOfExperience?: number;
  teachingExperience?: string;
  availability?: string;
  topics?: Array<{
    topic: {
      _id: Id<"topics">;
      name: string;
      description?: string;
    };
    type: "expertise" | "interest";
    skillLevel?: string;
  }>;
}

interface MentorshipRequestModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
}

const MentorshipRequestModal: React.FC<MentorshipRequestModalProps> = ({ mentor, isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<Id<"topics"> | "">("");
  const [message, setMessage] = useState<string>("");
  const [learningGoal, setLearningGoal] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendRequest = useMutation(api.mentorshipRequests.sendMentorshipRequest);

  if (!isOpen || !mentor) return null;

  const expertiseTopics = mentor.topics?.filter(t => t.type === "expertise") || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTopic) {
      toast.error("Please select a topic of expertise");
      return;
    }

    if (!message.trim()) {
      toast.error("Please write a message to the mentor");
      return;
    }

    if (!learningGoal.trim()) {
      toast.error("Please describe your learning goal");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendRequest({
        mentorId: mentor._id,
        topicId: selectedTopic,
        message: message.trim(),
        learningGoal: learningGoal.trim(),
      });

      toast.success("Mentorship request sent successfully!");
      
      // Reset form and close modal
      setSelectedTopic("");
      setMessage("");
      setLearningGoal("");
      onClose();
    } catch (error) {
      console.error("Error sending mentorship request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background dark:bg-gray-900 border-b border-border p-6 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              {mentor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Send Mentorship Request</h2>
              <p className="text-muted-foreground">to {mentor.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mentor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Mentor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{mentor.name}</p>
                  {mentor.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{mentor.bio}</p>
                  )}
                </div>
                
                {/* Expertise Areas */}
                {expertiseTopics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Areas of Expertise
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {expertiseTopics.map((userTopic) => (
                        <Badge 
                          key={userTopic.topic._id} 
                          variant={selectedTopic === userTopic.topic._id ? "default" : "outline"}
                          className="px-3 py-1 cursor-pointer hover:bg-primary/80 transition-colors"
                          onClick={() => setSelectedTopic(userTopic.topic._id)}
                        >
                          {userTopic.topic.name}
                          {userTopic.skillLevel && (
                            <span className="ml-1 text-xs opacity-80">({userTopic.skillLevel})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic Selection */}
              <div className="space-y-2">
                <Label htmlFor="topic" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Select Topic of Interest *
                </Label>
                {selectedTopic ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {expertiseTopics.find(t => t.topic._id === selectedTopic)?.topic.name}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTopic("")}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-dashed border-border">
                    Click on an expertise area above to select it
                  </div>
                )}
              </div>

              {/* Learning Goal */}
              <div className="space-y-2">
                <Label htmlFor="learningGoal">
                  What do you want to learn? *
                </Label>
                <Textarea
                  id="learningGoal"
                  placeholder="Describe your learning goals and what you hope to achieve through this mentorship..."
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message to Mentor *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you'd like to be mentored by them..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Info Alert */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Request Guidelines:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Be specific about your learning goals</li>
                    <li>Show genuine interest in their expertise</li>
                    <li>Be respectful of their time</li>
                    <li>Requests can be accepted or rejected at the mentor's discretion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              size="lg"
              disabled={isSubmitting || !selectedTopic || !message.trim() || !learningGoal.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorshipRequestModal;
