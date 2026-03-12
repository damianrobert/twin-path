"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { X, Upload, Calendar, FileText } from "lucide-react";

interface CreateAssignmentModalProps {
  mentorshipId: Id<"mentorships">;
  isOpen: boolean;
  onClose: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ 
  mentorshipId, 
  isOpen, 
  onClose 
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const createAssignment = useMutation(api.assignments.createAssignment);
  const generateUploadUrl = useMutation(api.assignments.generateUploadUrl);
  const storeUploadedFile = useMutation(api.assignments.storeUploadedFile);
  const uploadAssignmentFiles = useMutation(api.assignments.uploadAssignmentFiles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Please enter an assignment description");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload files first if any
      let uploadedFileData: Array<{url: string, name: string, size: number, type: string}> = [];
      
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            console.log(`Starting upload for file: ${file.name}, type: ${file.type}, size: ${file.size}`);
            
            // Get upload URL
            const uploadUrl = await generateUploadUrl();
            console.log(`Got upload URL: ${uploadUrl}`);
            
            // Upload file to Convex storage
            const response = await fetch(uploadUrl, {
              method: "POST",
              body: file,
            });
            
            console.log(`Upload response status: ${response.status}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Upload failed for file "${file.name}". Status: ${response.status}, Error: ${errorText}`);
              throw new Error(`Upload failed for file "${file.name}". Server returned ${response.status}: ${errorText}`);
            }
            
            const { storageId } = await response.json();
            console.log(`Got storage ID: ${storageId}`);
            
            // Get file URL
            const fileUrl = await storeUploadedFile({ storageId });
            console.log(`Got file URL: ${fileUrl}`);
            
            if (fileUrl) {
              uploadedFileData.push({
                url: fileUrl,
                name: file.name,
                size: file.size,
                type: file.type,
              });
            } else {
              throw new Error(`Failed to store file "${file.name}" - no URL returned`);
            }
          } catch (error) {
            console.error(`Error uploading file "${file.name}":`, error);
            toast.error(`Failed to upload file "${file.name}". ${error instanceof Error ? error.message : 'Please try again.'}`);
            throw error; // Re-throw to stop the assignment creation process
          }
        }
      }

      const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;
      
      // Create assignment
      const assignmentId = await createAssignment({
        mentorshipId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDateTimestamp,
      });

      // If files were uploaded, attach them to the assignment
      if (uploadedFileData.length > 0) {
        await uploadAssignmentFiles({
          assignmentId,
          files: uploadedFileData,
          isMentor: true,
        });
      }

      toast.success("Assignment created successfully!");
      handleClose();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setUploadedFiles([]);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Check file sizes (Convex supports any file type, but we should limit size)
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Files added to upload list:', uploadedFiles.length + files.length);
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

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateForInput(tomorrow);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Assignment
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed instructions for this assignment..."
                rows={6}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date (Optional)
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={getMinDate()}
                disabled={isSubmitting}
              />
            </div>

            {/* File Upload */}
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Attach Files (Optional)
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center text-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Any file type supported (max 10MB each)
                  </p>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Uploaded Files:</p>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">
                          {getFileEmoji(file.name, file.type)}
                        </span>
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Assignment Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Provide clear and specific instructions</li>
                <li>• Include expected deliverables and deadlines</li>
                <li>• Attach any reference materials or examples</li>
                <li>• Set realistic due dates based on complexity</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssignmentModal;
