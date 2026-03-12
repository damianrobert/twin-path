"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import GlobalAvatar from "@/components/web/GlobalAvatar";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Briefcase,
  Star,
  Clock,
  ArrowLeft,
  Calendar,
  Heart,
  CheckCircle,
  XCircle,
  MessageSquare,
  Target
} from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
  };
  mentor?: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    role: "mentor" | "mentee" | "both";
    professionalExperience?: string;
    yearsOfExperience?: number;
  };
  topic?: {
    _id: string;
    name: string;
    description?: string;
  };
}

const MentorshipsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Get current user profile
  const currentProfile = useQuery(api.users.getCurrentProfile);

  // Get all mentorships for current user
  const userMentorships = useQuery(api.mentorships.getUserMentorships);

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
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-muted-foreground">You need to be authenticated to view your mentorships.</p>
        </div>
      </div>
    );
  }

  // Filter mentorships by status
  const activeMentorships = userMentorships?.filter(m => m.status === "active") || [];
  const completedMentorships = userMentorships?.filter(m => m.status === "completed") || [];
  const concludedMentorships = userMentorships?.filter(m => m.status === "closed") || [];

  // Additional check: ensure no mentorship appears in both completed and concluded
  const completedIds = new Set(completedMentorships.map(m => m._id));
  const concludedIds = new Set(concludedMentorships.map(m => m._id));
  const overlappingIds = [...completedIds].filter(id => concludedIds.has(id));
  
  let filteredConcludedMentorships = concludedMentorships;
  if (overlappingIds.length > 0) {
    // Remove from concluded if they're in completed (completed takes precedence)
    filteredConcludedMentorships = concludedMentorships.filter(m => !completedIds.has(m._id));
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "closed":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <Star className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const MentorshipCard: React.FC<{ mentorship: MentorshipWithDetails }> = ({ mentorship }) => {
    const isCurrentUserMentor = currentProfile._id === mentorship.mentorId;
    const isCurrentUserMentee = currentProfile._id === mentorship.menteeId;
    const otherPerson = isCurrentUserMentor ? mentorship.mentee : mentorship.mentor;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 mb-2">
                <Target className="h-5 w-5" />
                {mentorship.topic?.name || "Unknown Topic"}
              </CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusColor(mentorship.status)} className="flex items-center gap-1">
                  {getStatusIcon(mentorship.status)}
                  {mentorship.status}
                </Badge>
                {isCurrentUserMentee && <Badge variant="outline">You are Mentee</Badge>}
                {isCurrentUserMentor && <Badge variant="outline">You are Mentor</Badge>}
              </div>
            </div>
            <Link href={`/mentorship/${mentorship._id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Other Person Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {otherPerson && (
              <GlobalAvatar 
                user={{
                  name: otherPerson.name,
                  role: otherPerson.role
                }}
                size="sm"
                clickable={false}
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{otherPerson?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">
                {isCurrentUserMentor ? "Your Mentee" : "Your Mentor"}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">{formatDate(mentorship.createdAt)}</span>
            </div>
            
            {mentorship.completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">{formatDate(mentorship.completedAt)}</span>
              </div>
            )}
            
            {mentorship.closedAt && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Concluded:</span>
                <span className="font-medium">{formatDate(mentorship.closedAt)}</span>
              </div>
            )}
          </div>

          {/* Closure Info */}
          {mentorship.status === "closed" && mentorship.closureReason && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100 text-sm mb-1">
                    Closure Reason
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {mentorship.closureReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Final Feedback */}
          {mentorship.finalFeedback && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
                    Final Feedback
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                    {mentorship.finalFeedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">My Mentorships</h1>
        <p className="text-muted-foreground">
          Manage your active mentorships and review concluded ones
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeMentorships.length}</p>
                <p className="text-sm text-muted-foreground">Active Mentorships</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{concludedMentorships.length}</p>
                <p className="text-sm text-muted-foreground">Concluded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedMentorships.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mentorships Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({activeMentorships.length})
          </TabsTrigger>
          <TabsTrigger value="concluded" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Concluded ({concludedMentorships.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Completed ({completedMentorships.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeMentorships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active mentorships</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You don't have any active mentorships at the moment.
                </p>
                {currentProfile.role === "mentee" || currentProfile.role === "both" ? (
                  <Link href="/mentors">
                    <Button>Find Mentors</Button>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Wait for mentees to contact you or check your mentorship requests.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMentorships.map((mentorship) => (
                <MentorshipCard key={mentorship._id} mentorship={mentorship} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="concluded" className="space-y-4">
          {filteredConcludedMentorships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No concluded mentorships</h3>
                <p className="text-muted-foreground text-center">
                  Your concluded mentorships will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConcludedMentorships.map((mentorship) => (
                <MentorshipCard key={mentorship._id} mentorship={mentorship} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedMentorships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed mentorships</h3>
                <p className="text-muted-foreground text-center">
                  Your successfully completed mentorships will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedMentorships.map((mentorship) => (
                <MentorshipCard key={mentorship._id} mentorship={mentorship} />
              ))}
            </div>
          )}
        </TabsContent>

        </Tabs>
    </div>
  );
};

export default MentorshipsPage;
