"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  X,
  Flag,
  Circle,
  Trophy,
  MoveDown,
  Star,
  Award,
  Edit
} from "lucide-react";
import Link from "next/link";
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
  grade?: number; // Grade might not exist for older assignments
  feedback?: string; // Feedback might not exist for older assignments
}

const AssignmentsList: React.FC<AssignmentsListProps> = ({ 
  mentorshipId, 
  isCurrentUserMentor,
  mentorshipStatus = "active"
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<Id<"assignments"> | null>(null);
  const [scoringAssignmentId, setScoringAssignmentId] = useState<Id<"assignments"> | null>(null);
  const [menteeUploadFiles, setMenteeUploadFiles] = useState<{[key: string]: File[]}>({});
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    assignmentId: Id<"assignments"> | null;
    newStatus: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    assignmentId: null,
    newStatus: "",
    title: "",
    description: "",
  });
  
  const assignments = useQuery(api.assignments.getAssignmentsForMentorship, {
    mentorshipId,
  });
  
  const updateStatus = useMutation(api.assignments.updateAssignmentStatus);
  const uploadAssignmentFiles = useMutation(api.assignments.uploadAssignmentFiles);
  const generateUploadUrl = useMutation(api.assignments.generateUploadUrl);
  const getDueDateStatus = (dueDate?: number, status?: string, grade?: number) => {
    if (!dueDate) return null;
    
    // Don't show due date status for reviewed assignments with grades
    if (status === "reviewed" && grade !== undefined && grade !== null) {
      return null;
    }
    
    const now = Date.now();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {Math.abs(diffDays)} days overdue
        </Badge>
      );
    } else if (diffDays === 0) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
          <Clock className="h-3 w-3" />
          Due today
        </Badge>
      );
    } else if (diffDays <= 3) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-600">
          <Clock className="h-3 w-3" />
          Due in {diffDays} days
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {diffDays} days remaining
        </Badge>
      );
    }
  };
  const storeUploadedFile = useMutation(api.assignments.storeUploadedFile);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <PlayCircle className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Reviewed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusUpdate = async (assignmentId: Id<"assignments">, newStatus: string) => {
    // Show confirmation modal for "completed" status
    if (newStatus === "completed") {
      setConfirmAction({
        isOpen: true,
        assignmentId,
        newStatus,
        title: "Submit Assignment for Review",
        description: "Are you sure you want to submit this assignment for review? Once submitted, you won't be able to make further changes until the mentor reviews it.",
      });
      return;
    }

    // For other status changes, proceed directly
    try {
      await updateStatus({ 
        assignmentId, 
        status: newStatus as any 
      });
      toast.success("Assignment status updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmAction.assignmentId) return;

    try {
      await updateStatus({ 
        assignmentId: confirmAction.assignmentId, 
        status: confirmAction.newStatus as any 
      });
      toast.success("Assignment submitted for review!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleMenteeFileUpload = async (assignmentId: Id<"assignments">) => {
    const files = menteeUploadFiles[assignmentId] || [];
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    try {
      // Upload files first
      let uploadedFileData: Array<{url: string, name: string, size: number, type: string}> = [];
      
      for (const file of files) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: file,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed for file "${file.name}". Server returned ${response.status}`);
        }
        
        const { storageId } = await response.json();
        
        // Get file URL
        const fileUrl = await storeUploadedFile({ storageId });
        
        if (fileUrl) {
          uploadedFileData.push({
            url: fileUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        } else {
          throw new Error(`Failed to store file "${file.name}"`);
        }
      }

      // Upload files to assignment
      await uploadAssignmentFiles({
        assignmentId,
        files: uploadedFileData,
        isMentor: false,
      });

      // Clear uploaded files for this assignment
      setMenteeUploadFiles(prev => ({ ...prev, [assignmentId]: [] }));
      
      toast.success("Files uploaded successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload files");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getFileNameFromUrl = (file: string | {url: string, name: string, size: number, type: string}) => {
  // Handle both legacy (string) and new (object) formats
  if (typeof file === 'string') {
    // Legacy format - extract from URL
    const parts = file.split('/');
    return parts[parts.length - 1] || file;
  } else {
    // New format - use stored name, fallback to URL extraction
    return file.name || (() => {
      const parts = file.url.split('/');
      return parts[parts.length - 1] || file.url;
    })();
  }
};

const getFileExtension = (file: string | {url: string, name: string, size: number, type: string}) => {
  // Handle both legacy (string) and new (object) formats
  const fileName = typeof file === 'string' ? file : (file.name || file.url);
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const getFileUrl = (file: string | {url: string, name: string, size: number, type: string}) => {
  // Handle both legacy (string) and new (object) formats
  return typeof file === 'string' ? file : file.url;
};

const getFileSize = (file: string | {url: string, name: string, size: number, type: string}) => {
  // Handle both legacy (string) and new (object) formats
  return typeof file === 'string' ? 0 : file.size;
};

const getFileIcon = (extension: string) => {
  const iconMap: { [key: string]: string } = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    zip: '📦',
    rar: '📦',
    log: '📋',
    md: '📖',
    csv: '📊',
    json: '🔧',
    xml: '🔧',
    html: '💻',
    css: '💻',
    js: '💻',
    ts: '💻',
    py: '🐍',
    java: '☕',
  };
  return iconMap[extension.toLowerCase()] || '📎';
};

const getFileEmoji = (fileName: string, fileType: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Common file types
  switch (extension) {
    case 'pdf': return '📄';
    case 'doc': case 'docx': return '📝';
    case 'txt': return '📃';
    case 'log': return '📋';
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return '🖼️';
    case 'mp4': case 'avi': case 'mov': return '🎬';
    case 'mp3': case 'wav': case 'flac': return '🎵';
    case 'zip': case 'rar': case '7z': return '📦';
    case 'csv': case 'xlsx': case 'xls': return '📊';
    case 'json': case 'xml': return '🔧';
    case 'html': case 'css': case 'js': case 'ts': case 'jsx': case 'tsx': return '💻';
    case 'py': case 'java': case 'cpp': case 'c': return '⌨️';
    case 'md': return '📖';
    default:
      // Fallback based on MIME type
      if (fileType.startsWith('image/')) return '🖼️';
      if (fileType.startsWith('video/')) return '🎬';
      if (fileType.startsWith('audio/')) return '🎵';
      if (fileType.startsWith('text/')) return '📃';
      if (fileType.includes('pdf')) return '📄';
      if (fileType.includes('document')) return '📝';
      return '📎'; // Default file emoji
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

  if (!assignments) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Assignments</h3>
          <p className="text-muted-foreground">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isCurrentUserMentor && mentorshipStatus === "active" && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
        {isCurrentUserMentor && mentorshipStatus === "closed" && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>This mentorship path has been concluded. No new assignments can be created.</p>
          </div>
        )}
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isCurrentUserMentor 
                ? "Create your first assignment to guide your mentee's learning journey."
                : "Your mentor hasn't created any assignments yet."
              }
            </p>
            {isCurrentUserMentor && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Assignment Cards with Roadmap Points */}
          <div className="space-y-6">
            {assignments.map((assignment, index) => (
              <div key={assignment._id} className="relative flex items-start">
                {/* Roadmap Point */}
                <div className="absolute left-6 flex flex-col items-center">
                  <div className="relative z-10">
                    {index === 0 ? (
                      // Start line - first assignment
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                        assignment.status === "completed" || assignment.status === "reviewed"
                          ? 'bg-green-500 border-green-200 text-white' 
                          : assignment.status === "in_progress"
                          ? 'bg-yellow-500 border-yellow-200 text-white'
                          : 'bg-background border-muted text-muted-foreground'
                      }`}>
                        <Flag className="h-5 w-5" />
                      </div>
                    ) : index === assignments.length - 1 ? (
                      // Finish line - last assignment
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                        assignment.status === "completed" || assignment.status === "reviewed"
                          ? 'bg-green-500 border-green-200 text-white' 
                          : assignment.status === "in_progress"
                          ? 'bg-yellow-500 border-yellow-200 text-white'
                          : 'bg-background border-muted text-muted-foreground'
                      }`}>
                        <Trophy className="h-5 w-5" />
                      </div>
                    ) : (
                      // Checkpoint - middle assignments
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                        assignment.status === "completed" || assignment.status === "reviewed"
                          ? 'bg-green-500 border-green-200 text-white' 
                          : assignment.status === "in_progress"
                          ? 'bg-yellow-500 border-yellow-200 text-white'
                          : 'bg-background border-muted text-muted-foreground'
                      }`}>
                        {assignment.status === "completed" || assignment.status === "reviewed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Status indicator for current/active */}
                  {(assignment.status === "completed" || assignment.status === "in_progress") && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                  )}
                  
                  {/* Step label */}
                  <div className="mt-2 text-xs text-muted-foreground whitespace-nowrap">
                    {index === 0 ? (
                      "Start"
                    ) : index === assignments.length - 1 ? (
                      "Finish"
                    ) : (
                      `Step ${index}`
                    )}
                  </div>
                  
                  {/* Arrow pointing to next assignment */}
                  {index < assignments.length - 1 && (
                    <div className="mt-4 text-muted-foreground">
                      <MoveDown className="h-6 w-6" />
                    </div>
                  )}
                </div>
                
                {/* Assignment Card */}
                <div className="ml-20 flex-1">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{assignment.title}</h4>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Created: {formatDate(assignment.createdAt)}</span>
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatDate(assignment.dueDate)}
                              </span>
                            )}
                            {assignment.dueDate && getDueDateStatus(assignment.dueDate, assignment.status, assignment.grade)}
                          </div>
                        </div>
                        
                        {/* Grade Display */}
                        {assignment.grade !== undefined && assignment.grade !== null && (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-lg font-bold text-yellow-600">{assignment.grade}/100</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assignment.grade >= 90 ? "Excellent" :
                               assignment.grade >= 80 ? "Good" :
                               assignment.grade >= 70 ? "Satisfactory" :
                               assignment.grade >= 60 ? "Needs Improvement" : "Poor"}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <h5 className="font-medium mb-2">Description:</h5>
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                </div>

                {/* Files */}
                {(assignment.mentorFiles.length > 0 || assignment.menteeFiles.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mentor Files */}
                    {assignment.mentorFiles.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Mentor Files ({assignment.mentorFiles.length})
                        </h5>
                        <div className="space-y-2">
                          {assignment.mentorFiles.map((file: any, index: any) => {
                            const fileName = getFileNameFromUrl(file);
                            const extension = getFileExtension(file);
                            const fileUrl = getFileUrl(file);
                            const fileSize = getFileSize(file);
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-card border rounded hover:bg-accent transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getFileIcon(extension)}</span>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-foreground truncate max-w-[200px]" title={fileName}>
                                      {fileName}
                                    </span>
                                    {fileSize > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatFileSize(fileSize)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mentee Files */}
                    {assignment.menteeFiles.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Mentee Files ({assignment.menteeFiles.length})
                        </h5>
                        <div className="space-y-2">
                          {assignment.menteeFiles.map((file: any, index: any) => {
                            const fileName = getFileNameFromUrl(file);
                            const extension = getFileExtension(file);
                            const fileUrl = getFileUrl(file);
                            const fileSize = getFileSize(file);
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-card border rounded hover:bg-accent transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getFileIcon(extension)}</span>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-foreground truncate max-w-[200px]" title={fileName}>
                                      {fileName}
                                    </span>
                                    {fileSize > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatFileSize(fileSize)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {isCurrentUserMentor ? (
                      <>
                        {assignment.status === "completed" && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(assignment._id, "reviewed")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Reviewed
                          </Button>
                        )}
                        {assignment.status === "reviewed" && !assignment.grade && (
                          <Button 
                            size="sm"
                            onClick={() => setScoringAssignmentId(assignment._id)}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Grade Assignment
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {assignment.status === "pending" && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(assignment._id, "in_progress")}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start Assignment
                          </Button>
                        )}
                        {assignment.status === "in_progress" && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(assignment._id, "completed")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Submit for Review
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAssignmentId(assignment._id)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        mentorshipId={mentorshipId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Assignment Details Modal */}
      <AssignmentDetailsModal
        assignmentId={selectedAssignmentId}
        isOpen={selectedAssignmentId !== null}
        onClose={() => setSelectedAssignmentId(null)}
      />

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmStatusUpdate}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmText="Submit for Review"
        cancelText="Cancel"
      />

      {/* Assignment Scoring Modal */}
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

export default AssignmentsList;
