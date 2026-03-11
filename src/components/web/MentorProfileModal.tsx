"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Mail, 
  MapPin, 
  Briefcase, 
  Clock, 
  Award, 
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Star,
  MessageCircle,
  ArrowLeft,
  Send
} from "lucide-react";
import MentorshipRequestModal from "./MentorshipRequestModal";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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

interface MentorProfileModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
}

const MentorProfileModal: React.FC<MentorProfileModalProps> = ({ mentor, isOpen, onClose }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const currentProfile = useQuery(api.users.getCurrentProfile);

  if (!isOpen || !mentor) return null;

  const expertiseTopics = mentor.topics?.filter(t => t.type === "expertise") || [];
  const interestTopics = mentor.topics?.filter(t => t.type === "interest") || [];

  const getExperienceLevel = (years?: number) => {
    if (!years) return "Not specified";
    if (years <= 2) return "Junior (0-2 years)";
    if (years <= 5) return "Mid-level (3-5 years)";
    if (years <= 10) return "Senior (6-10 years)";
    return "Expert (10+ years)";
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background dark:bg-gray-900 border-b border-border p-6 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {mentor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{mentor.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={mentor.role === "mentor" ? "default" : mentor.role === "both" ? "secondary" : "outline"}>
                  {mentor.role === "both" ? "Mentor & Mentee" : mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1)}
                </Badge>
                {mentor.yearsOfExperience && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {getExperienceLevel(mentor.yearsOfExperience)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bio */}
          {mentor.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{mentor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Professional Experience */}
          {mentor.professionalExperience && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">{mentor.professionalExperience}</p>
              </CardContent>
            </Card>
          )}

          {/* Teaching Experience */}
          {mentor.teachingExperience && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Teaching & Mentoring Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{mentor.teachingExperience}</p>
              </CardContent>
            </Card>
          )}

          {/* Expertise Areas */}
          {expertiseTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Areas of Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expertiseTopics.map((userTopic) => (
                    <Badge key={`${userTopic.topic._id}-expertise`} variant="default" className="px-3 py-1">
                      {userTopic.topic.name}
                      {userTopic.skillLevel && (
                        <span className="ml-1 text-xs opacity-80">({userTopic.skillLevel})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interest Areas */}
          {interestTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Areas of Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interestTopics.map((userTopic) => (
                    <Badge key={`${userTopic.topic._id}-interest`} variant="outline" className="px-3 py-1">
                      {userTopic.topic.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          {mentor.availability && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{mentor.availability}</p>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {(mentor.portfolioUrl || mentor.githubUrl || mentor.linkedinUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect & Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mentor.portfolioUrl && (
                    <a 
                      href={mentor.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {mentor.githubUrl && (
                    <a 
                      href={mentor.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {mentor.linkedinUrl && (
                    <a 
                      href={mentor.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Mentors
            </Button>
            <Button 
              className="flex-1" 
              size="lg"
              onClick={() => setIsRequestModalOpen(true)}
              disabled={!isAuthenticated || currentProfile?._id === mentor._id}
            >
              <Send className="h-4 w-4 mr-2" />
              {currentProfile?._id === mentor._id ? "Your Profile" : "Connect with Mentor"}
            </Button>
            <Button variant="outline" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        mentor={mentor}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};

export default MentorProfileModal;
