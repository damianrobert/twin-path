"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  User,
  FileText,
  MessageSquare,
  Flag
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";

interface Report {
  _id: Id<"blogReports">;
  postId: Id<"posts">;
  reporterId: Id<"users">;
  reason: string;
  message: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewedBy?: Id<"users">;
  reviewNotes?: string;
  createdAt: number;
  reviewedAt?: number;
  reporter?: {
    name: string;
    email: string;
  };
  post?: {
    title: string;
    slug: string;
    author?: {
      name: string;
      email: string;
    };
  };
  reviewer?: {
    name: string;
  };
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
};

const reasonLabels = {
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  harassment: "Harassment",
  copyright: "Copyright Violation",
  misinformation: "Misinformation",
  offensive_language: "Offensive Language",
  other: "Other",
};

export default function BlogReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");

  const reports = useQuery(api.blogReports.getPendingReports) || [];
  const updateReportStatus = useMutation(api.blogReports.updateReportStatus);
  
  // Handle admin access errors
  useConvexErrorHandler();

  const handleReview = async () => {
    if (!selectedReport || !reviewStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      await updateReportStatus({
        reportId: selectedReport._id,
        status: reviewStatus as any,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      toast.success("Report status updated successfully");
      setReviewDialogOpen(false);
      setSelectedReport(null);
      setReviewStatus("");
      setReviewNotes("");
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report status");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
          Blog Reports Management
        </h1>
        <p className="text-muted-foreground">
          Review and manage user-reported blog posts
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Reports</h3>
            <p className="text-muted-foreground">
              All blog reports have been reviewed. Great job!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[report.status]}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {reasonLabels[report.reason as keyof typeof reasonLabels]}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">
                      Report for: "{report.post?.title}"
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Reported by: {report.reporter?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(report.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/blog/${report.post?.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Post
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setReviewDialogOpen(true);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Reporter Message:
                    </h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {report.message}
                    </p>
                  </div>
                  
                  {report.post?.author && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Post author: {report.post.author.name} ({report.post.author.email})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Review Report
            </DialogTitle>
            <DialogDescription>
              Review the report for "{selectedReport?.post?.title}" and update its status.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Report Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Reason:</strong> {reasonLabels[selectedReport.reason as keyof typeof reasonLabels]}</p>
                  <p><strong>Reporter:</strong> {selectedReport.reporter?.name}</p>
                  <p><strong>Message:</strong> {selectedReport.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Update Status *</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Review Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about your review decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {reviewNotes.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={!reviewStatus}
                  className="flex-1"
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
