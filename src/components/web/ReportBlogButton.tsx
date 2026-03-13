"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag, Send } from "lucide-react";
import { toast } from "sonner";

interface ReportBlogButtonProps {
  postId: Id<"posts">;
  postTitle: string;
}

const reportReasons = [
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "copyright", label: "Copyright Violation" },
  { value: "misinformation", label: "Misinformation" },
  { value: "offensive_language", label: "Offensive Language" },
  { value: "other", label: "Other" },
];

export default function ReportBlogButton({ postId, postTitle }: ReportBlogButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = useMutation(api.blogReports.createBlogReport);
  const hasReported = useQuery(api.blogReports.hasUserReportedPost, { postId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error("Please select a reason for reporting");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide a detailed message");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createReport({
        postId,
        reason: reason as any,
        message: message.trim(),
      });
      
      toast.success("Blog post reported successfully. Our team will review it.");
      setOpen(false);
      setReason("");
      setMessage("");
    } catch (error) {
      console.error("Error reporting blog post:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to report blog post. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasReported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flag className="h-4 w-4" />
        <span>Already reported</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
          <Flag className="h-4 w-4 mr-2" />
          Report Post
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Report Blog Post
          </DialogTitle>
          <DialogDescription>
            Report "{postTitle}" for violating community guidelines. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reportReason) => (
                  <SelectItem key={reportReason.value} value={reportReason.value}>
                    {reportReason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Detailed Message *</Label>
            <Textarea
              id="message"
              placeholder="Please provide details about why you're reporting this blog post..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !reason.trim() || !message.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
