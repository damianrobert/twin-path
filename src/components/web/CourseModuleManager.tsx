"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Loader2, Plus, Upload, FileText, Video, Edit, Trash2 } from "lucide-react";
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

const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";
const labelCls = "block text-white/55 text-xs font-medium mb-1.5";

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

  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order: 1 });

  const resetForm = () => {
    setModuleForm({ title: "", description: "", order: modules.length + 1 });
    setEditingModule(null);
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    try {
      await createModule({ courseId, title: moduleForm.title, description: moduleForm.description, order: moduleForm.order });
      toast.success("Module created!");
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
      await updateModule({ moduleId: editingModule._id, title: moduleForm.title, description: moduleForm.description, order: moduleForm.order, isPublished: editingModule.isPublished });
      toast.success("Module updated!");
      resetForm();
      setIsCreateModuleOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    }
  };

  const handleDeleteModule = async (moduleId: Id<"courseModules">) => {
    if (!confirm("Delete this module? This cannot be undone.")) return;
    try {
      await deleteModule({ moduleId });
      toast.success("Module deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete module");
    }
  };

  const handleVideoUpload = async (moduleId: Id<"courseModules">, file: File) => {
    setUploadingVideo(moduleId);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      const fileUrl = await storeUploadedFile({ storageId });
      await uploadModuleVideo({ moduleId, videoUrl: fileUrl, videoName: file.name, videoSize: file.size, videoType: file.type });
      toast.success("Video uploaded!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload video");
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleFileUpload = async (moduleId: Id<"courseModules">, file: File) => {
    setUploadingFile(moduleId);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      const fileUrl = await storeUploadedFile({ storageId });
      await uploadModuleFile({ moduleId, fileUrl, fileName: file.name, fileSize: file.size, fileType: file.type });
      toast.success("File uploaded!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploadingFile(null);
    }
  };

  const toggleModulePublish = async (moduleId: Id<"courseModules">, isPublished: boolean) => {
    try {
      await updateModule({ moduleId, isPublished: !isPublished });
      toast.success(`Module ${!isPublished ? "published" : "unpublished"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    }
  };

  const startEdit = (module: CourseModule) => {
    setEditingModule(module);
    setModuleForm({ title: module.title, description: module.description || "", order: module.order });
    setIsCreateModuleOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/35 text-xs font-semibold uppercase tracking-widest">Modules</p>
        {isEditable && (
          <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
            <DialogTrigger asChild>
              <button
                onClick={resetForm}
                className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Module
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#020617] border border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingModule ? "Edit Module" : "New Module"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Introduction to Hooks"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="What will students learn in this module?"
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <label className={labelCls}>Order</label>
                  <input
                    type="number"
                    value={moduleForm.order}
                    onChange={(e) => setModuleForm((p) => ({ ...p, order: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => setIsCreateModuleOpen(false)}
                    className="px-4 py-2 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={editingModule ? handleUpdateModule : handleCreateModule}
                    className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-9 px-5 text-sm"
                  >
                    {editingModule ? "Save Changes" : "Create Module"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Module list */}
      <div className="space-y-2">
        {modules.length === 0 ? (
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/30 text-sm">No modules yet. Add your first module above.</p>
          </div>
        ) : (
          modules.map((module) => (
            <div key={module._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              {/* Module header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{module.title}</span>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                      module.isPublished
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.06] border-white/15 text-white/35"
                    }`}>
                      {module.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{module.description}</p>
                  )}
                </div>

                {isEditable && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleModulePublish(module._id, module.isPublished)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        module.isPublished
                          ? "text-amber-400/80 hover:text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                          : "text-emerald-400/80 hover:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                      }`}
                    >
                      {module.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => startEdit(module)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module._id)}
                      className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="flex flex-wrap gap-2">
                {/* Video */}
                {module.videoUrl ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                    <Video className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 truncate max-w-[140px]">{module.videoName}</span>
                    {module.videoSize && (
                      <span className="text-xs text-emerald-400/50">({(module.videoSize / 1024 / 1024).toFixed(1)} MB)</span>
                    )}
                  </div>
                ) : isEditable ? (
                  <>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      id={`video-${module._id}`}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(module._id, f); }}
                    />
                    <label
                      htmlFor={`video-${module._id}`}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer transition-colors ${
                        uploadingVideo === module._id
                          ? "text-white/30 bg-white/[0.03]"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {uploadingVideo === module._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload Video
                    </label>
                  </>
                ) : null}

                {/* Document */}
                {module.fileUrl ? (
                  <a
                    href={module.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1 hover:bg-blue-500/15 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs text-blue-400 truncate max-w-[140px]">{module.fileName}</span>
                    {module.fileSize && (
                      <span className="text-xs text-blue-400/50">({(module.fileSize / 1024 / 1024).toFixed(1)} MB)</span>
                    )}
                  </a>
                ) : isEditable ? (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                      className="hidden"
                      id={`file-${module._id}`}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(module._id, f); }}
                    />
                    <label
                      htmlFor={`file-${module._id}`}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer transition-colors ${
                        uploadingFile === module._id
                          ? "text-white/30 bg-white/[0.03]"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {uploadingFile === module._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload File
                    </label>
                  </>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
