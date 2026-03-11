"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { 
  User, 
  Send, 
  Check, 
  X, 
  Clock, 
  Star,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface RequestWithDetails {
  _id: string;
  menteeId: string;
  mentorId: string;
  topicId: string;
  message: string;
  learningGoal: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
  mentee?: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
  };
  mentor?: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
  };
  topic?: {
    _id: string;
    name: string;
    description?: string;
  };
  mentorship?: {
    _id: string;
  };
}

const MentorshipRequestsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const requests = useQuery(api.mentorshipRequests.getMentorshipRequests);
  
  const acceptRequest = useMutation(api.mentorshipRequests.acceptMentorshipRequest);
  const rejectRequest = useMutation(api.mentorshipRequests.rejectMentorshipRequest);

  const [isProcessing, setIsProcessing] = React.useState<Id<"mentorshipRequests"> | null>(null);

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
          <p className="text-muted-foreground mb-6">Please log in to view mentorship requests.</p>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter requests based on user role
  const userRequests = requests?.filter(request => {
    if (currentProfile.role === "mentor") {
      return request.mentorId === currentProfile._id;
    } else if (currentProfile.role === "mentee") {
      return request.menteeId === currentProfile._id;
    } else if (currentProfile.role === "both") {
      return request.mentorId === currentProfile._id || request.menteeId === currentProfile._id;
    }
    return false;
  }) || [];

  // Group requests by status
  const pendingRequests = userRequests.filter(req => req.status === "pending");
  const acceptedRequests = userRequests.filter(req => req.status === "accepted");
  const rejectedRequests = userRequests.filter(req => req.status === "rejected");

  const handleAccept = async (requestId: Id<"mentorshipRequests">) => {
    setIsProcessing(requestId);
    try {
      await acceptRequest({ requestId });
      toast.success("Mentorship request accepted!");
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to accept request");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: Id<"mentorshipRequests">) => {
    setIsProcessing(requestId);
    try {
      await rejectRequest({ requestId });
      toast.success("Mentorship request rejected");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject request");
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "accepted":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" />Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Mentorship Requests</h1>
        <p className="text-muted-foreground">
          Manage your mentorship requests and track their status
        </p>
      </div>

      {userRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {currentProfile.role === "mentor" 
                ? "You don't have any mentorship requests yet. When mentees send you requests, they'll appear here."
                : currentProfile.role === "mentee"
                ? "You haven't sent any mentorship requests yet. Find mentors and send them requests to get started."
                : "No mentorship requests found. Start by finding mentors or wait for mentees to reach out."
              }
            </p>
            {currentProfile.role !== "mentor" && (
              <Link href="/mentors">
                <Button>Find Mentors</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-muted-foreground">
                              Sent on {formatDate(request.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {currentProfile._id === request.mentorId ? request.mentee?.name : request.mentor?.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({currentProfile._id === request.mentorId ? "Mentee" : "Mentor"})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <Badge variant="outline">{request.topic?.name}</Badge>
                          </div>
                        </div>
                        {currentProfile._id === request.mentorId && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(request._id)}
                              disabled={isProcessing === request._id}
                            >
                              {isProcessing === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(request._id)}
                              disabled={isProcessing === request._id}
                            >
                              {isProcessing === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Learning Goal:</h4>
                        <p className="text-sm text-muted-foreground">{request.learningGoal}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Message:</h4>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Requests */}
          {acceptedRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Accepted Requests ({acceptedRequests.length})
              </h2>
              <div className="space-y-4">
                {acceptedRequests.map((request) => (
                  <Card key={request._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-muted-foreground">
                              Accepted on {formatDate(request.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {currentProfile._id === request.mentorId ? request.mentee?.name : request.mentor?.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({currentProfile._id === request.mentorId ? "Mentee" : "Mentor"})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <Badge variant="outline">{request.topic?.name}</Badge>
                          </div>
                        </div>
                        {request.mentorship && (
                          <Link href={`/mentorship/${request.mentorship._id}`}>
                            <Button variant="outline" size="sm">
                              View Mentorship
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Learning Goal:</h4>
                        <p className="text-sm text-muted-foreground">{request.learningGoal}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Message:</h4>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Requests */}
          {rejectedRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <X className="h-5 w-5" />
                Rejected Requests ({rejectedRequests.length})
              </h2>
              <div className="space-y-4">
                {rejectedRequests.map((request) => (
                  <Card key={request._id} className="opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-muted-foreground">
                              Rejected on {formatDate(request.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {currentProfile._id === request.mentorId ? request.mentee?.name : request.mentor?.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({currentProfile._id === request.mentorId ? "Mentee" : "Mentor"})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <Badge variant="outline">{request.topic?.name}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Learning Goal:</h4>
                        <p className="text-sm text-muted-foreground">{request.learningGoal}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Message:</h4>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorshipRequestsPage;
