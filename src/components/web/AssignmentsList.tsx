"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Eye,
  Download,
  Flag,
  Circle,
  Trophy,
  MoveDown,
  Star,
  Award,
  Plus,
} from "lucide-react";
import CreateAssignmentModal from "./CreateAssignmentModal";
import AssignmentDetailsModal from "./AssignmentDetailsModal";
import ConfirmActionModal from "./ConfirmActionModal";
import AssignmentScoringModal from "./AssignmentScoringModal";

interface AssignmentsListProps {
  mentorshipId: Id<"mentorships">;
  isCurrentUserMentor: boolean;
  mentorshipStatus?: "active" | "completed" | "closed";
}

interface Assignment {
  _id: Id<"assignments">;
  mentorshipId: Id<"mentorships">;
  title: string;
  description: string;
  mentorFiles: string[];
  menteeFiles: string[];
  status: "pending" | "in_progress" | "completed" | "reviewed";
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  grade?: number;
  feedback?: string;
}

/* ── helpers ── */
const getFileNameFromUrl = (file: any) =>
  typeof file === "string"
    ? file.split("/").pop() || file
    : file.name || file.url.split("/").pop() || file.url;

const getFileExtension = (file: any) => {
  const name = typeof file === "string" ? file : file.name || file.url;
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

const getFileUrl = (file: any) => (typeof file === "string" ? file : file.url);
const getFileSize = (file: any) => (typeof file === "string" ? 0 : file.size);

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const fileIconMap: Record<string, string> = {
  pdf: "📄", doc: "📝", docx: "📝", txt: "📄", md: "📖",
  jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", svg: "🖼️",
  mp4: "🎬", avi: "🎬", mov: "🎬",
  mp3: "🎵", wav: "🎵",
  zip: "📦", rar: "📦",
  csv: "📊", xlsx: "📊", xls: "📊",
  json: "🔧", xml: "🔧",
  html: "💻", css: "💻", js: "💻", ts: "💻", jsx: "💻", tsx: "💻",
  py: "🐍", java: "☕", cpp: "⌨️", c: "⌨️",
};
const getFileIcon = (ext: string) => fileIconMap[ext.toLowerCase()] || "📎";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ── badge helpers ── */
const statusConfig = {
  pending: {
    label: "Pending",
    cls: "bg-white/5 border border-white/15 text-white/40",
    Icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    cls: "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400",
    Icon: PlayCircle,
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
    Icon: CheckCircle,
  },
  reviewed: {
    label: "Reviewed",
    cls: "bg-violet-500/15 border border-violet-500/30 text-violet-400",
    Icon: CheckCircle2,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig];
  if (!cfg) return <span className="text-xs text-white/30 px-2 py-1 rounded-full border border-white/10">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function DueDateBadge({ dueDate, status, grade }: { dueDate?: number; status?: string; grade?: number }) {
  if (!dueDate) return null;
  if (status === "reviewed" && grade != null) return null;

  const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);

  if (diffDays < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
        <AlertCircle className="h-3 w-3" />
        {Math.abs(diffDays)}d overdue
      </span>
    );
  if (diffDays === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400">
        <Clock className="h-3 w-3" />
        Due today
      </span>
    );
  if (diffDays <= 3)
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
        <Clock className="h-3 w-3" />
        {diffDays}d left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/35">
      <Clock className="h-3 w-3" />
      {diffDays}d remaining
    </span>
  );
}

/* ── roadmap dot ── */
function RoadmapDot({
  index,
  total,
  status,
}: {
  index: number;
  total: number;
  status: string;
}) {
  const done = status === "completed" || status === "reviewed";
  const active = status === "in_progress";
  const colorCls = done
    ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-400"
    : active
    ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
    : "bg-white/5 border-white/20 text-white/30";

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const size = isFirst || isLast ? "w-9 h-9" : "w-7 h-7";

  return (
    <div className="flex flex-col items-center">
      <div className={`${size} rounded-full border-2 flex items-center justify-center ${colorCls} relative`}>
        {isFirst ? (
          <Flag className="h-4 w-4" />
        ) : isLast ? (
          <Trophy className="h-4 w-4" />
        ) : done ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3.5 w-3.5" />
        )}
        {active && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </div>
      <span className="mt-1.5 text-[10px] text-white/25 whitespace-nowrap">
        {isFirst ? "Start" : isLast ? "Finish" : `Step ${index}`}
      </span>
      {index < total - 1 && (
        <div className="mt-2 text-white/20">
          <MoveDown className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

/* ── main component ── */
const AssignmentsList: React.FC<AssignmentsListProps> = ({
  mentorshipId,
  isCurrentUserMentor,
  mentorshipStatus = "active",
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"assignments"> | null>(null);
  const [scoringAssignmentId, setScoringAssignmentId] = useState<Id<"assignments"> | null>(null);
  const [menteeUploadFiles, setMenteeUploadFiles] = useState<Record<string, File[]>>({});
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    assignmentId: Id<"assignments"> | null;
    newStatus: string;
    title: string;
    description: string;
  }>({ isOpen: false, assignmentId: null, newStatus: "", title: "", description: "" });

  const assignments = useQuery(api.assignments.getAssignmentsForMentorship, { mentorshipId });
  const updateStatus = useMutation(api.assignments.updateAssignmentStatus);
  const uploadAssignmentFiles = useMutation(api.assignments.uploadAssignmentFiles);
  const generateUploadUrl = useMutation(api.assignments.generateUploadUrl);
  const storeUploadedFile = useMutation(api.assignments.storeUploadedFile);

  const handleStatusUpdate = async (assignmentId: Id<"assignments">, newStatus: string) => {
    if (newStatus === "completed") {
      setConfirmAction({
        isOpen: true,
        assignmentId,
        newStatus,
        title: "Submit Assignment for Review",
        description:
          "Are you sure you want to submit this assignment for review? Once submitted, you won't be able to make further changes until the mentor reviews it.",
      });
      return;
    }
    try {
      await updateStatus({ assignmentId, status: newStatus as any });
      toast.success("Assignment status updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmAction.assignmentId) return;
    try {
      await updateStatus({ assignmentId: confirmAction.assignmentId, status: confirmAction.newStatus as any });
      toast.success("Assignment submitted for review!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleMenteeFileUpload = async (assignmentId: Id<"assignments">) => {
    const files = menteeUploadFiles[assignmentId] || [];
    if (files.length === 0) { toast.error("Please select files to upload"); return; }
    try {
      const uploadedFileData: Array<{ url: string; name: string; size: number; type: string }> = [];
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, { method: "POST", body: file });
        if (!response.ok) throw new Error(`Upload failed for "${file.name}"`);
        const { storageId } = await response.json();
        const fileUrl = await storeUploadedFile({ storageId });
        if (!fileUrl) throw new Error(`Failed to store "${file.name}"`);
        uploadedFileData.push({ url: fileUrl, name: file.name, size: file.size, type: file.type });
      }
      await uploadAssignmentFiles({ assignmentId, files: uploadedFileData, isMentor: false });
      setMenteeUploadFiles((prev) => ({ ...prev, [assignmentId]: [] }));
      toast.success("Files uploaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload files");
    }
  };

  if (!assignments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Assignments</h3>
          <p className="text-white/35 text-sm mt-0.5">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isCurrentUserMentor && mentorshipStatus === "active" && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        )}
        {isCurrentUserMentor && mentorshipStatus === "closed" && (
          <p className="text-sm text-white/35 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            Path concluded — no new assignments.
          </p>
        )}
      </div>

      {/* Empty state */}
      {assignments.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5">
            <FileText className="h-6 w-6 text-white/25" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">No assignments yet</h4>
          <p className="text-white/35 text-sm max-w-sm mb-6">
            {isCurrentUserMentor
              ? "Create your first assignment to guide your mentee's learning journey."
              : "Your mentor hasn't created any assignments yet."}
          </p>
          {isCurrentUserMentor && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Assignment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment, index) => (
            <div key={assignment._id} className="flex items-start gap-5">
              {/* Roadmap dot */}
              <div className="shrink-0 pt-6">
                <RoadmapDot index={index} total={assignments.length} status={assignment.status} />
              </div>

              {/* Assignment card */}
              <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
                {/* Card header */}
                <div className="p-5 border-b border-white/8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-white">{assignment.title}</h4>
                        <StatusBadge status={assignment.status} />
                        <DueDateBadge
                          dueDate={assignment.dueDate}
                          status={assignment.status}
                          grade={assignment.grade}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-white/35">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(assignment.createdAt)}
                        </span>
                        {assignment.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {formatDate(assignment.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Grade */}
                    {assignment.grade != null && (
                      <div className="shrink-0 flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-lg font-bold text-yellow-400">{assignment.grade}/100</span>
                        </div>
                        <span className="text-xs text-white/30 mt-0.5">
                          {assignment.grade >= 90
                            ? "Excellent"
                            : assignment.grade >= 80
                            ? "Good"
                            : assignment.grade >= 70
                            ? "Satisfactory"
                            : assignment.grade >= 60
                            ? "Needs Improvement"
                            : "Poor"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">Description</p>
                    <p className="text-sm text-white/60 leading-relaxed">{assignment.description}</p>
                  </div>

                  {/* Files */}
                  {(assignment.mentorFiles.length > 0 || assignment.menteeFiles.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignment.mentorFiles.length > 0 && (
                        <FileList label="Mentor Files" files={assignment.mentorFiles} />
                      )}
                      {assignment.menteeFiles.length > 0 && (
                        <FileList label="Mentee Files" files={assignment.menteeFiles} />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/8">
                    <div className="flex items-center gap-2">
                      {isCurrentUserMentor ? (
                        <>
                          {assignment.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(assignment._id, "reviewed")}
                              className="bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/30 rounded-xl gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Mark Reviewed
                            </Button>
                          )}
                          {assignment.status === "reviewed" && !assignment.grade && (
                            <Button
                              size="sm"
                              onClick={() => setScoringAssignmentId(assignment._id)}
                              className="bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 rounded-xl gap-1.5"
                            >
                              <Star className="h-3.5 w-3.5" />
                              Grade
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {assignment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(assignment._id, "in_progress")}
                              className="bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl gap-1.5"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              Start
                            </Button>
                          )}
                          {assignment.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(assignment._id, "completed")}
                              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Submit for Review
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAssignmentId(assignment._id)}
                      className="text-white/35 hover:text-white hover:bg-white/5 rounded-xl gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAssignmentModal
        mentorshipId={mentorshipId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <AssignmentDetailsModal
        assignmentId={selectedAssignmentId}
        isOpen={selectedAssignmentId !== null}
        onClose={() => setSelectedAssignmentId(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmStatusUpdate}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmText="Submit for Review"
        cancelText="Cancel"
      />
      {scoringAssignmentId && (
        <AssignmentScoringModal
          assignmentId={scoringAssignmentId}
          isOpen={true}
          onClose={() => setScoringAssignmentId(null)}
        />
      )}
    </div>
  );
};

/* ── file list sub-component ── */
function FileList({ label, files }: { label: string; files: any[] }) {
  return (
    <div>
      <p className="text-xs text-white/35 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Upload className="h-3 w-3" />
        {label} ({files.length})
      </p>
      <div className="space-y-1.5">
        {files.map((file, i) => {
          const name = getFileNameFromUrl(file);
          const ext = getFileExtension(file);
          const url = getFileUrl(file);
          const size = getFileSize(file);
          return (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/8 rounded-xl hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{getFileIcon(ext)}</span>
                <div className="min-w-0">
                  <p className="text-sm text-white/70 truncate max-w-[160px]" title={name}>
                    {name}
                  </p>
                  {size > 0 && (
                    <p className="text-xs text-white/30">{formatFileSize(size)}</p>
                  )}
                </div>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" download={name}>
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white hover:bg-white/5 rounded-lg h-7 w-7 p-0">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AssignmentsList;
