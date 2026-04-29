"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
  User,
  FileText,
  MessageSquare,
  Flag,
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
  reporter?: { name: string; email: string };
  post?: {
    title: string;
    slug: string;
    author?: { name: string; email: string };
  };
  reviewer?: { name: string };
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 border-amber-500/25 text-amber-300",
  reviewed: "bg-blue-500/15 border-blue-500/25 text-blue-300",
  resolved: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
  dismissed: "bg-white/8 border-white/15 text-white/40",
};

const reasonLabels: Record<string, string> = {
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
      toast.error("Failed to update report status");
    }
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
          Moderation
        </p>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          Blog Reports
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Review and manage user-reported blog posts
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">No Pending Reports</h3>
          <p className="text-white/35 text-sm">All blog reports have been reviewed. Great job!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${statusStyles[report.status]}`}
                    >
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/45 text-xs rounded-full">
                      {reasonLabels[report.reason as keyof typeof reasonLabels]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white">
                    Report for: &ldquo;{report.post?.title}&rdquo;
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Reported by: {report.reporter?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-white/35 flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reporter message:
                    </p>
                    <p className="text-sm text-white/55 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                      {report.message}
                    </p>
                  </div>

                  {report.post?.author && (
                    <p className="flex items-center gap-1.5 text-xs text-white/35">
                      <FileText className="h-3.5 w-3.5" />
                      Post author: {report.post.author.name} ({report.post.author.email})
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => window.open(`/blog/${report.post?.slug}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Post
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setReviewDialogOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[oklch(0.129_0.042_264.695)] border border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Flag className="h-5 w-5 text-violet-400" />
              Review Report
            </DialogTitle>
            <DialogDescription className="text-white/45">
              Review the report for &ldquo;{selectedReport?.post?.title}&rdquo; and update its status.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="text-white/40">
                  <span className="text-white/60 font-medium">Reason:</span>{" "}
                  {reasonLabels[selectedReport.reason as keyof typeof reasonLabels]}
                </p>
                <p className="text-white/40">
                  <span className="text-white/60 font-medium">Reporter:</span>{" "}
                  {selectedReport.reporter?.name}
                </p>
                <p className="text-white/40">
                  <span className="text-white/60 font-medium">Message:</span>{" "}
                  {selectedReport.message}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">Update Status *</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">Review Notes</Label>
                <Textarea
                  placeholder="Add notes about your review decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                />
                <p className="text-xs text-white/30">{reviewNotes.length}/500 characters</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setReviewDialogOpen(false)}
                  className="flex-1 h-9 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={!reviewStatus}
                  className="flex-1 h-9 bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
