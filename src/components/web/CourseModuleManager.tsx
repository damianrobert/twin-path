"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Loader2, Plus, X, Upload, FileText, Video, Edit, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface CourseModule {
  _id: Id<"courseModules">;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  videoName?: string;
  videoSize?: number;
  videoType?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isPublished: boolean;
  createdAt: number;
  updatedAt?: number;
}

interface CourseModuleManagerProps {
  courseId: Id<"courses">;
  isEditable?: boolean;
}

export const CourseModuleManager = ({ courseId, isEditable = true }: CourseModuleManagerProps) => {
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const modules = useQuery(api.courseModules.getCourseModules, { courseId }) || [];
  const createModule = useMutation(api.courseModules.createModule);
  const updateModule = useMutation(api.courseModules.updateModule);
  const deleteModule = useMutation(api.courseModules.deleteModule);
  const uploadModuleVideo = useMutation(api.courseModules.uploadModuleVideo);
  const uploadModuleFile = useMutation(api.courseModules.uploadModuleFile);
  const generateUploadUrl = useMutation(api.courseModules.generateCourseUploadUrl);
  const storeUploadedFile = useMutation(api.courseModules.storeCourseUploadedFile);

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    order: modules.length + 1,
  });

  const resetForm = () => {
    setModuleForm({
      title: "",
      description: "",
      order: modules.length + 1,
    });
    setEditingModule(null);
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }

    try {
      await createModule({
        courseId,
        title: moduleForm.title,
        description: moduleForm.description,
        order: moduleForm.order,
      });

      toast.success("Module created successfully!");
      resetForm();
      setIsCreateModuleOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create module");
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }

    try {
      await updateModule({
        moduleId: editingModule._id,
        title: moduleForm.title,
        description: moduleForm.description,
        order: moduleForm.order,
        isPublished: editingModule.isPublished,
      });

      toast.success("Module updated successfully!");
      resetForm();
      setIsCreateModuleOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    }
  };

  const handleDeleteModule = async (moduleId: Id<"courseModules">) => {
    if (!confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteModule({ moduleId });
      toast.success("Module deleted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete module");
    }
  };

  const handleVideoUpload = async (moduleId: Id<"courseModules">, file: File) => {
    setUploadingVideo(moduleId);
    
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      // Get storage ID from response
      const { storageId } = await response.json();
      
      // Get file URL
      const fileUrl = await storeUploadedFile({ storageId });
      
      // Update module with video info
      await uploadModuleVideo({
        moduleId,
        videoUrl: fileUrl,
        videoName: file.name,
        videoSize: file.size,
        videoType: file.type,
      });
      
      toast.success("Video uploaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload video");
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleFileUpload = async (moduleId: Id<"courseModules">, file: File) => {
    setUploadingFile(moduleId);
    
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      // Get storage ID from response
      const { storageId } = await response.json();
      
      // Get file URL
      const fileUrl = await storeUploadedFile({ storageId });
      
      // Update module with file info
      await uploadModuleFile({
        moduleId,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploadingFile(null);
    }
  };

  const toggleModulePublish = async (moduleId: Id<"courseModules">, isPublished: boolean) => {
    try {
      await updateModule({
        moduleId,
        isPublished: !isPublished,
      });
      
      toast.success(`Module ${!isPublished ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    }
  };

  const startEdit = (module: CourseModule) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || "",
      order: module.order,
    });
    setIsCreateModuleOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Modules</h3>
        {isEditable && (
          <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? "Edit Module" : "Create New Module"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="moduleTitle">Module Title</Label>
                  <Input
                    id="moduleTitle"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter module title"
                  />
                </div>

                <div>
                  <Label htmlFor="moduleDescription">Description</Label>
                  <Textarea
                    id="moduleDescription"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this module covers"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="moduleOrder">Order</Label>
                  <Input
                    id="moduleOrder"
                    type="number"
                    value={moduleForm.order}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingModule ? handleUpdateModule : handleCreateModule}>
                    {editingModule ? "Update Module" : "Create Module"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No modules yet. Create your first module to get started.
            </CardContent>
          </Card>
        ) : (
          modules.map((module) => (
            <Card key={module._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <Badge variant={module.isPublished ? "default" : "secondary"}>
                        {module.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  
                  {isEditable && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleModulePublish(module._id, module.isPublished)}
                      >
                        {module.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(module)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteModule(module._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4">
                  {/* Video Upload */}
                  <div className="flex items-center gap-2">
                    {module.videoUrl ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{module.videoName}</span>
                        {module.videoSize && (
                          <span className="text-muted-foreground">
                            ({(module.videoSize / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        )}
                      </div>
                    ) : isEditable ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVideoUpload(module._id, file);
                          }}
                          className="hidden"
                          id={`video-${module._id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingVideo === module._id}
                          asChild
                        >
                          <label htmlFor={`video-${module._id}`} className="cursor-pointer">
                            {uploadingVideo === module._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload Video
                          </label>
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {/* File Upload */}
                  <div className="flex items-center gap-2">
                    {module.fileUrl ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <a
                          href={module.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {module.fileName}
                        </a>
                        {module.fileSize && (
                          <span className="text-muted-foreground">
                            ({(module.fileSize / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        )}
                      </div>
                    ) : isEditable ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(module._id, file);
                          }}
                          className="hidden"
                          id={`file-${module._id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingFile === module._id}
                          asChild
                        >
                          <label htmlFor={`file-${module._id}`} className="cursor-pointer">
                            {uploadingFile === module._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload File
                          </label>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
