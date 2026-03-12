"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import GlobalAvatar from "@/components/web/GlobalAvatar";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Briefcase, 
  Star, 
  Clock,
  Award,
  ArrowLeft,
  Mail,
  Github,
  Linkedin,
  Globe,
  Heart
} from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import AssignmentsList from "@/components/web/AssignmentsList";
import MentorshipClosureModal from "@/components/web/MentorshipClosureModal";
import MentorshipCompletionModal from "@/components/web/MentorshipCompletionModal";

interface MentorshipWithDetails {
  _id: string;
  requestId: string;
  menteeId: string;
  mentorId: string;
  topicId: string;
  status: "active" | "completed" | "closed";
  createdAt: number;
  completedAt?: number;
  closedAt?: number;
  closedBy?: string;
  closureReason?: string;
  finalFeedback?: string;
  mentee?: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    role: "mentor" | "mentee" | "both";
    professionalExperience?: string;
    portfolioUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    yearsOfExperience?: number;
    teachingExperience?: string;
    availability?: string;
  };
  mentor?: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    role: "mentor" | "mentee" | "both";
    professionalExperience?: string;
    portfolioUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    yearsOfExperience?: number;
    teachingExperience?: string;
    availability?: string;
  };
  topic?: {
    _id: string;
    name: string;
    description?: string;
  };
  request?: {
    message: string;
    learningGoal: string;
  };
}

const MentorshipPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const mentorshipId = params.mentorshipId as string;
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Get current user profile
  const currentProfile = useQuery(api.users.getCurrentProfile);

  // Get mentorship details
  const mentorship = useQuery(api.mentorships.getMentorshipById, {
    mentorshipId: mentorshipId as any,
  });

  if (isLoading || !currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please log in to view this mentorship.</p>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!mentorship) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Mentorship Not Found</h1>
          <p className="text-muted-foreground mb-6">This mentorship doesn't exist or you don't have access to it.</p>
          <Link href="/mentorship-requests">
            <Button>Back to Requests</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user is part of this mentorship
  const isParticipant = 
    mentorship.mentee?._id === currentProfile._id || 
    mentorship.mentor?._id === currentProfile._id;

  if (!isParticipant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have access to this mentorship.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUserMentee = mentorship.mentee?._id === currentProfile._id;
  const isCurrentUserMentor = mentorship.mentor?._id === currentProfile._id;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getExperienceLevel = (years?: number) => {
    if (!years) return "Not specified";
    if (years <= 2) return "Junior (0-2 years)";
    if (years <= 5) return "Mid-level (3-5 years)";
    if (years <= 10) return "Senior (6-10 years)";
    return "Expert (10+ years)";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mentorship Space</h1>
            <p className="text-muted-foreground">
              Private collaboration between {mentorship.mentee?.name} and {mentorship.mentor?.name}
            </p>
          </div>
        </div>

        {/* Mentorship Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {mentorship.topic?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Started:</p>
                <p className="font-medium">{formatDate(mentorship.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status:</p>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    mentorship.status === "active" ? "default" : 
                    mentorship.status === "closed" ? "destructive" : "outline"
                  }>
                    {mentorship.status}
                  </Badge>
                  {mentorship.status === "active" && isCurrentUserMentor && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsCompletionModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Complete Path
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsClosureModalOpen(true)}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Conclude Path
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {mentorship.request && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Learning Goal:</p>
                  <p className="text-sm">{mentorship.request.learningGoal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initial Message:</p>
                  <p className="text-sm">{mentorship.request.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Participants Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mentee Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mentee
              {isCurrentUserMentee && <Badge variant="outline">You</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                {mentorship.mentee && (
                  <GlobalAvatar 
                    user={{
                      name: mentorship.mentee.name,
                      role: mentorship.mentee.role
                    }}
                    size="lg"
                    clickable={false}
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{mentorship.mentee?.name}</h3>
                  <p className="text-sm text-muted-foreground">{mentorship.mentee?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {mentorship.mentee?.role === "both" ? "Mentee & Mentor" : "Mentee"}
                  </Badge>
                </div>
              </div>

              {/* Bio */}
              {mentorship.mentee?.bio && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{mentorship.mentee.bio}</p>
                </div>
              )}

              {/* Professional Experience */}
              {mentorship.mentee?.professionalExperience && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professional Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">{mentorship.mentee.professionalExperience}</p>
                </div>
              )}

              {/* Links */}
              {(mentorship.mentee?.portfolioUrl || mentorship.mentee?.githubUrl || mentorship.mentee?.linkedinUrl) && (
                <div>
                  <h4 className="font-medium mb-2">Connect</h4>
                  <div className="space-y-2">
                    {mentorship.mentee.portfolioUrl && (
                      <a 
                        href={mentorship.mentee.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                    {mentorship.mentee.githubUrl && (
                      <a 
                        href={mentorship.mentee.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {mentorship.mentee.linkedinUrl && (
                      <a 
                        href={mentorship.mentee.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mentor Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Mentor
              {isCurrentUserMentor && <Badge variant="outline">You</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                {mentorship.mentor && (
                  <GlobalAvatar 
                    user={{
                      name: mentorship.mentor.name,
                      role: mentorship.mentor.role
                    }}
                    size="lg"
                    clickable={false}
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{mentorship.mentor?.name}</h3>
                  <p className="text-sm text-muted-foreground">{mentorship.mentor?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={mentorship.mentor?.role === "mentor" ? "default" : "secondary"}>
                      {mentorship.mentor?.role === "both" ? "Mentor & Mentee" : "Mentor"}
                    </Badge>
                    {mentorship.mentor?.yearsOfExperience && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {getExperienceLevel(mentorship.mentor.yearsOfExperience)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {mentorship.mentor?.bio && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{mentorship.mentor.bio}</p>
                </div>
              )}

              {/* Professional Experience */}
              {mentorship.mentor?.professionalExperience && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professional Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">{mentorship.mentor.professionalExperience}</p>
                </div>
              )}

              {/* Teaching Experience */}
              {mentorship.mentor?.teachingExperience && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Teaching & Mentoring Experience
                  </h4>
                  <p className="text-sm text-muted-foreground">{mentorship.mentor.teachingExperience}</p>
                </div>
              )}

              {/* Availability */}
              {mentorship.mentor?.availability && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Availability
                  </h4>
                  <p className="text-sm text-foreground">{mentorship.mentor.availability}</p>
                </div>
              )}

              {/* Links */}
              {(mentorship.mentor?.portfolioUrl || mentorship.mentor?.githubUrl || mentorship.mentor?.linkedinUrl) && (
                <div>
                  <h4 className="font-medium mb-2">Connect & Portfolio</h4>
                  <div className="space-y-2">
                    {mentorship.mentor.portfolioUrl && (
                      <a 
                        href={mentorship.mentor.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                    {mentorship.mentor.githubUrl && (
                      <a 
                        href={mentorship.mentor.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {mentorship.mentor.linkedinUrl && (
                      <a 
                        href={mentorship.mentor.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Section */}
      <div className="mt-8">
        <AssignmentsList 
          mentorshipId={mentorshipId as any} 
          isCurrentUserMentor={isCurrentUserMentor}
          mentorshipStatus={mentorship?.status}
        />
      </div>

      {/* Mentorship Closure Modal */}
      {mentorship && mentorship.mentee && mentorship.topic && (
        <MentorshipClosureModal
          mentorshipId={mentorshipId as any}
          menteeName={mentorship.mentee.name}
          topic={mentorship.topic.name}
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
        />
      )}

      {/* Mentorship Completion Modal */}
      {mentorship && mentorship.mentee && mentorship.topic && (
        <MentorshipCompletionModal
          mentorshipId={mentorshipId as any}
          menteeName={mentorship.mentee.name}
          topic={mentorship.topic.name}
          isOpen={isCompletionModalOpen}
          onClose={() => setIsCompletionModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MentorshipPage;
