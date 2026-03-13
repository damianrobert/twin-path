"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  Download,
  User,
  X,
  Mail,
  Globe,
  Github,
  Linkedin,
  Star
} from "lucide-react";

interface AssignmentDetailsModalProps {
  assignmentId: Id<"assignments"> | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Assignment {
  _id: Id<"assignments">;
  mentorshipId: Id<"mentorships">;
  title: string;
  description: string;
  mentorFiles: Array<string | {url: string, name: string, size: number, type: string}>;
  menteeFiles: Array<string | {url: string, name: string, size: number, type: string}>;
  status: "pending" | "in_progress" | "completed" | "reviewed";
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  grade?: number; // Grade might not exist for older assignments
  feedback?: string; // Feedback might not exist for older assignments
  mentorship?: {
    mentor: {
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
    mentee: {
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
    topic: {
      _id: string;
      name: string;
      description?: string;
    };
  };
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({ 
  assignmentId, 
  isOpen, 
  onClose 
}) => {
  const assignment = useQuery(
    api.assignments.getAssignmentById, 
    assignmentId ? { assignmentId } : "skip"
  );

  const getFileNameFromUrl = (file: string | {url: string, name: string, size: number, type: string}) => {
    if (typeof file === 'string') {
      const parts = file.split('/');
      return parts[parts.length - 1] || file;
    } else {
      return file.name || (() => {
        const parts = file.url.split('/');
        return parts[parts.length - 1] || file.url;
      })();
    }
  };

  const getFileExtension = (file: string | {url: string, name: string, size: number, type: string}) => {
    const fileName = typeof file === 'string' ? file : (file.name || file.url);
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const getFileUrl = (file: string | {url: string, name: string, size: number, type: string}) => {
    return typeof file === 'string' ? file : file.url;
  };

  const getFileSize = (file: string | {url: string, name: string, size: number, type: string}) => {
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
    };
    return iconMap[extension] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

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

  if (!isOpen || !assignmentId || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {assignment.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(assignment.status)}
              {assignment.dueDate && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {formatDate(assignment.dueDate)}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created:</p>
                <p className="font-medium">{formatDate(assignment.createdAt)}</p>
              </div>
              {assignment.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed:</p>
                  <p className="font-medium">{formatDate(assignment.completedAt)}</p>
                </div>
              )}
              {assignment.mentorship?.topic && (
                <div>
                  <p className="text-sm text-muted-foreground">Topic:</p>
                  <p className="font-medium">{assignment.mentorship.topic.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{assignment.description}</p>
            </div>
          </div>

          {/* Grade and Feedback */}
          {assignment.grade !== undefined && assignment.grade !== null && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Grade & Feedback</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <span className="text-2xl font-bold text-yellow-600">{assignment.grade}/100</span>
                    <div className="text-sm text-muted-foreground">
                      {assignment.grade >= 90 ? "Excellent" :
                       assignment.grade >= 80 ? "Good" :
                       assignment.grade >= 70 ? "Satisfactory" :
                       assignment.grade >= 60 ? "Needs Improvement" : "Poor"}
                    </div>
                  </div>
                </div>
                {assignment.feedback && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Mentor Feedback:</h4>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <p className="text-sm">{assignment.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          {assignment.mentorship && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Participants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mentor */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mentor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium">{assignment.mentorship.mentor.name}</p>
                      <p className="text-sm text-muted-foreground">{assignment.mentorship.mentor.email}</p>
                    </div>
                    {assignment.mentorship.mentor.bio && (
                      <p className="text-sm text-muted-foreground">{assignment.mentorship.mentor.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {assignment.mentorship.mentor.portfolioUrl && (
                        <a href={assignment.mentorship.mentor.portfolioUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Globe className="h-3 w-3 mr-1" />
                            Portfolio
                          </Button>
                        </a>
                      )}
                      {assignment.mentorship.mentor.githubUrl && (
                        <a href={assignment.mentorship.mentor.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Github className="h-3 w-3 mr-1" />
                            GitHub
                          </Button>
                        </a>
                      )}
                      {assignment.mentorship.mentor.linkedinUrl && (
                        <a href={assignment.mentorship.mentor.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Linkedin className="h-3 w-3 mr-1" />
                            LinkedIn
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mentee */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mentee
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium">{assignment.mentorship.mentee.name}</p>
                      <p className="text-sm text-muted-foreground">{assignment.mentorship.mentee.email}</p>
                    </div>
                    {assignment.mentorship.mentee.bio && (
                      <p className="text-sm text-muted-foreground">{assignment.mentorship.mentee.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {assignment.mentorship.mentee.portfolioUrl && (
                        <a href={assignment.mentorship.mentee.portfolioUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Globe className="h-3 w-3 mr-1" />
                            Portfolio
                          </Button>
                        </a>
                      )}
                      {assignment.mentorship.mentee.githubUrl && (
                        <a href={assignment.mentorship.mentee.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Github className="h-3 w-3 mr-1" />
                            GitHub
                          </Button>
                        </a>
                      )}
                      {assignment.mentorship.mentee.linkedinUrl && (
                        <a href={assignment.mentorship.mentee.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Linkedin className="h-3 w-3 mr-1" />
                            LinkedIn
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Files */}
          {(assignment.mentorFiles.length > 0 || assignment.menteeFiles.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mentor Files */}
                {assignment.mentorFiles.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Mentor Files ({assignment.mentorFiles.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                                <span className="text-sm text-foreground truncate max-w-[150px]" title={fileName}>
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
                    </CardContent>
                  </Card>
                )}

                {/* Mentee Files */}
                {assignment.menteeFiles.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Mentee Files ({assignment.menteeFiles.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                                <span className="text-sm text-foreground truncate max-w-[150px]" title={fileName}>
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
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentDetailsModal;
