"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function AdminSupportPage() {
  const allCases = useQuery(api.supportCases.getAllSupportCases);
  const stats = useQuery(api.supportCases.getSupportCaseStatistics);
  const updateStatus = useMutation(api.supportCases.updateSupportCaseStatus);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  const filteredCases =
    allCases?.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        (c.user?.name && c.user.name.toLowerCase().includes(q)) ||
        (c.user?.email && c.user.email.toLowerCase().includes(q));
      return (
        matchesSearch &&
        (statusFilter === "all" || c.status === statusFilter) &&
        (categoryFilter === "all" || c.category === categoryFilter) &&
        (priorityFilter === "all" || c.priority === priorityFilter)
      );
    }) || [];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleStatusUpdate = async () => {
    if (!selectedCase || !newStatus) return;
    try {
      await updateStatus({
        caseId: selectedCase._id,
        status: newStatus as any,
        resolution:
          newStatus === "resolved" || newStatus === "closed" ? resolution : undefined,
      });
      toast.success("Case status updated successfully");
      setStatusDialogOpen(false);
      setSelectedCase(null);
      setNewStatus("");
      setResolution("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update case status");
    }
  };

  const openStatusDialog = (case_: any) => {
    setSelectedCase(case_);
    setNewStatus(case_.status);
    setResolution(case_.resolution || "");
    setStatusDialogOpen(true);
  };

  if (allCases === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-7 w-7 border-2 border-violet-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
          Support
        </p>
        <h1 className="text-2xl font-bold text-white">Support Management</h1>
        <p className="text-white/40 text-sm mt-1">Manage and respond to user support cases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Cases", value: stats.total, accent: "text-white", icon: MessageSquare },
          { label: "Opened", value: stats.opened, accent: "text-blue-400", icon: AlertCircle },
          { label: "In Progress", value: stats.inProgress, accent: "text-amber-400", icon: Clock },
          { label: "Resolved", value: stats.resolved, accent: "text-emerald-400", icon: CheckCircle },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-white/40 text-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              </div>
              <Icon className="h-5 w-5 text-white/15" />
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Search cases by title, description, case number, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: "Status",
                options: [{ value: "all", label: "All Status" }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))],
              },
              {
                value: categoryFilter,
                onChange: setCategoryFilter,
                placeholder: "Category",
                options: [{ value: "all", label: "All Categories" }, ...Object.entries(categoryConfig).map(([k, v]) => ({ value: k, label: v.label }))],
              },
              {
                value: priorityFilter,
                onChange: setPriorityFilter,
                placeholder: "Priority",
                options: [{ value: "all", label: "All Priority" }, ...Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label }))],
              },
            ].map((sel, i) => (
              <Select key={i} value={sel.value} onValueChange={sel.onChange}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white/60 h-9 text-sm">
                  <SelectValue placeholder={sel.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {sel.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>
      </div>

      {/* Cases list */}
      {filteredCases.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-white/20" />
          </div>
          <h3 className="text-white font-semibold mb-1">
            {allCases.length === 0 ? "No support cases" : "No matching cases"}
          </h3>
          <p className="text-white/35 text-sm">
            {allCases.length === 0
              ? "No support cases have been created yet."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((case_) => {
            const statusCfg = statusConfig[case_.status as keyof typeof statusConfig];
            const catCfg = categoryConfig[case_.category as keyof typeof categoryConfig];
            const priCfg = priorityConfig[case_.priority as keyof typeof priorityConfig];
            const StatusIcon = statusCfg?.icon || AlertCircle;

            return (
              <div
                key={case_._id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span className="font-semibold text-white">{case_.title}</span>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/35 text-xs rounded-full font-mono">
                        {case_.caseNumber}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm line-clamp-2 mb-3">{case_.description}</p>
                    <div className="flex items-center gap-4 text-xs text-white/35 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {case_.user?.name || case_.user?.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(case_.createdAt)}
                      </span>
                      {case_.resolvedAt && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Resolved {formatDate(case_.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {statusCfg && (
                      <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium flex items-center gap-1 ${statusCfg.style}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>
                    )}
                    {catCfg && (
                      <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${catCfg.style}`}>
                        {catCfg.label}
                      </span>
                    )}
                    {priCfg && (
                      <span className={`px-2.5 py-0.5 border rounded-full text-xs font-medium ${priCfg.style}`}>
                        {priCfg.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <Link href={`/admin/support/${case_._id}`}>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/55 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                      View Details
                    </button>
                  </Link>

                  <Dialog
                    open={statusDialogOpen && selectedCase?._id === case_._id}
                    onOpenChange={setStatusDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <button
                        onClick={() => openStatusDialog(case_)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 rounded-xl text-xs font-medium transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
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
                                <SelectItem key={key} value={key}>
                                  {cfg.label}
                                </SelectItem>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
