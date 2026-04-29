"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const statusConfig = {
  opened: { label: "Opened", style: "bg-blue-500/15 border-blue-500/25 text-blue-300", icon: AlertCircle },
  in_progress: { label: "In Progress", style: "bg-amber-500/15 border-amber-500/25 text-amber-300", icon: Clock },
  resolved: { label: "Resolved", style: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300", icon: CheckCircle },
  closed: { label: "Closed", style: "bg-white/8 border-white/15 text-white/40", icon: XCircle },
};

const categoryConfig = {
  technical: { label: "Technical", style: "bg-violet-500/15 border-violet-500/25 text-violet-300" },
  account: { label: "Account", style: "bg-blue-500/15 border-blue-500/25 text-blue-300" },
  billing: { label: "Billing", style: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" },
  content: { label: "Content", style: "bg-amber-500/15 border-amber-500/25 text-amber-300" },
  other: { label: "Other", style: "bg-white/8 border-white/15 text-white/40" },
};

const priorityConfig = {
  low: { label: "Low", style: "bg-white/8 border-white/15 text-white/40" },
  medium: { label: "Medium", style: "bg-blue-500/15 border-blue-500/25 text-blue-300" },
  high: { label: "High", style: "bg-amber-500/15 border-amber-500/25 text-amber-300" },
  urgent: { label: "Urgent", style: "bg-red-500/15 border-red-500/25 text-red-300" },
};

export default function AdminSupportCasePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const supportCase = useQuery(api.supportCases.getSupportCaseById, { caseId: caseId as Id<"supportCases"> });
  const messages = useQuery(api.supportCases.getSupportCaseMessages, { caseId: caseId as Id<"supportCases"> });
  const addMessage = useMutation(api.supportCases.addSupportCaseMessage);
  const updateStatus = useMutation(api.supportCases.updateSupportCaseStatus);

  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (supportCase) {
      setNewStatus(supportCase.status);
      setResolution(supportCase.resolution || "");
    }
  }, [supportCase]);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) { toast.error("Please enter a message"); return; }
    setIsSubmitting(true);
    try {
      await addMessage({ caseId: caseId as Id<"supportCases">, message: newMessage.trim(), isInternal });
      setNewMessage("");
      toast.success(isInternal ? "Internal note added" : "Message sent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!supportCase || !newStatus) return;
    try {
      await updateStatus({
        caseId: supportCase._id,
        status: newStatus as any,
        resolution: newStatus === "resolved" || newStatus === "closed" ? resolution : undefined,
      });
      toast.success("Case status updated successfully");
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update case status");
    }
  };

  if (supportCase === undefined || messages === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-7 w-7 border-2 border-violet-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!supportCase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-white/20" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Case Not Found</h1>
        <p className="text-white/40 text-sm mb-6">The support case you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push("/admin/support")}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support Cases
        </button>
      </div>
    );
  }

  const statusCfg = statusConfig[supportCase.status as keyof typeof statusConfig];
  const catCfg = categoryConfig[supportCase.category as keyof typeof categoryConfig];
  const priCfg = priorityConfig[supportCase.priority as keyof typeof priorityConfig];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/admin/support")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Support Cases
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{supportCase.title}</h1>
            <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Case {supportCase.caseNumber}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {supportCase.user?.name || supportCase.user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {formatDate(supportCase.createdAt)}
              </span>
            </div>
          </div>

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 rounded-xl text-sm font-medium transition-colors flex-shrink-0">
                <Settings className="h-4 w-4" />
                Update Status
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[oklch(0.129_0.042_264.695)] border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Update Case Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/55 text-xs">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newStatus === "resolved" || newStatus === "closed") && (
                  <div className="space-y-1.5">
                    <Label className="text-white/55 text-xs">Resolution</Label>
                    <Textarea
                      placeholder="Describe how this case was resolved..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setStatusDialogOpen(false)}
                    className="px-4 h-9 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    className="flex items-center gap-1.5 px-4 h-9 bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Update
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Case Details Sidebar */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm">Case Details</p>

            <div>
              <p className="text-white/40 text-xs mb-1.5">Description</p>
              <p className="text-white/60 text-sm leading-relaxed">{supportCase.description}</p>
            </div>

            <div className="space-y-2">
              {statusCfg && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-16">Status</span>
                  <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${statusCfg.style}`}>
                    {statusCfg.label}
                  </span>
                </div>
              )}
              {catCfg && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-16">Category</span>
                  <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${catCfg.style}`}>
                    {catCfg.label}
                  </span>
                </div>
              )}
              {priCfg && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-16">Priority</span>
                  <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${priCfg.style}`}>
                    {priCfg.label}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/8 space-y-1.5 text-sm">
              <p className="text-white/40 text-xs font-medium mb-2">User Information</p>
              <p className="text-white/55">
                <span className="text-white/35">Name: </span>
                {supportCase.user?.name || "N/A"}
              </p>
              <p className="text-white/55">
                <span className="text-white/35">Email: </span>
                {supportCase.user?.email}
              </p>
              <p className="text-white/55">
                <span className="text-white/35">Role: </span>
                {supportCase.user?.role || "N/A"}
              </p>
            </div>

            {supportCase.resolution && (
              <div className="pt-3 border-t border-white/8">
                <p className="text-white/40 text-xs font-medium mb-2">Resolution</p>
                <p className="text-white/55 text-sm">{supportCase.resolution}</p>
                {supportCase.resolvedAt && (
                  <p className="text-white/30 text-xs mt-1">
                    Resolved {formatDate(supportCase.resolvedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
            <p className="text-white font-semibold text-sm mb-4">Conversation</p>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-sm">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  No messages yet.
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.senderId === supportCase.currentUser._id;
                  const isIntMsg = message.isInternal;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[75%]">
                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                          {!isCurrentUser && (
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-white/10 text-white/60">
                                {getInitials(message.sender?.name, message.sender?.email)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs text-white/30">
                            {isCurrentUser ? "You (Admin)" : message.sender?.name || message.sender?.email}
                          </span>
                          <span className="text-xs text-white/20">{formatTime(message.createdAt)}</span>
                          {isIntMsg && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs rounded-full">
                              <EyeOff className="h-2.5 w-2.5" />
                              Internal
                            </span>
                          )}
                        </div>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            isCurrentUser
                              ? "bg-violet-500/25 border border-violet-500/30 text-white"
                              : isIntMsg
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-200/80"
                              : "bg-white/5 border border-white/10 text-white/70"
                          }`}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {(supportCase.status === "opened" || supportCase.status === "in_progress") && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
              <p className="text-white font-semibold text-sm mb-3">Send Message</p>
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-colors"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-white/20 bg-white/5"
                    />
                    <EyeOff className="h-3.5 w-3.5" />
                    Internal note (admins only)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/25">{newMessage.length}/2000</span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newMessage.trim()}
                      className="flex items-center gap-1.5 px-4 h-9 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send {isInternal ? "Note" : "Message"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
