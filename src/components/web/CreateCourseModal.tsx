"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Loader2, Plus, X, FileText, Video, AlertCircle, Presentation, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { contentSchemas } from "@/lib/validation";
import { validateTopicContentAI } from "@/lib/ai-content-filter";

const courseSchema = contentSchemas.course;
type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors";
const labelCls = "block text-white/55 text-xs font-medium mb-1.5";
const sectionHeadingCls = "text-white/35 text-xs font-semibold uppercase tracking-widest mb-4";

export const CreateCourseModal = ({ children, onSuccess }: CreateCourseModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionIssues, setRejectionIssues] = useState<string[]>([]);
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [createdCourseId, setCreatedCourseId] = useState<any>(null);
  const [modules, setModules] = useState<Array<{
    title: string;
    description: string;
    order: number;
    videoFile?: File;
    documentFile?: File;
  }>>([]);

  const createCourse = useMutation(api.courses.createCourse);
  const topics = useQuery(api.topics.getAllTopics) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset: resetForm,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const watchedPrerequisites = watch("prerequisites") || [];
  const watchedObjectives = watch("learningObjectives") || [];

  const validateCourseContent = async (data: CourseFormData) => {
    const issues: string[] = [];
    const titleValidation = await validateTopicContentAI(data.title.trim());
    if (!titleValidation.isValid) issues.push(`Course title ${titleValidation.error || 'contains inappropriate content'}`);
    const descValidation = await validateTopicContentAI(data.description.trim());
    if (!descValidation.isValid) issues.push(`Course description ${descValidation.error || 'contains inappropriate content'}`);
    for (const prereq of data.prerequisites || []) {
      const v = await validateTopicContentAI(prereq.trim());
      if (!v.isValid) issues.push(`Prerequisite "${prereq}" ${v.error || 'contains inappropriate content'}`);
    }
    for (const obj of data.learningObjectives || []) {
      const v = await validateTopicContentAI(obj.trim());
      if (!v.isValid) issues.push(`Learning objective "${obj}" ${v.error || 'contains inappropriate content'}`);
    }
    return issues;
  };

  const validateModuleContent = async (mods: Array<{ title: string; description: string }>) => {
    const issues: string[] = [];
    for (const mod of mods) {
      if (!mod.title.trim()) continue;
      const titleV = await validateTopicContentAI(mod.title.trim());
      if (!titleV.isValid) issues.push(`Module title "${mod.title}" ${titleV.error || 'contains inappropriate content'}`);
      if (mod.description.trim()) {
        const descV = await validateTopicContentAI(mod.description.trim());
        if (!descV.isValid) issues.push(`Module description "${mod.description}" ${descV.error || 'contains inappropriate content'}`);
      }
    }
    return issues;
  };

  const validateSingleModule = async (mod: { title: string; description: string }, index: number) => {
    const issues: string[] = [];
    if (mod.title.trim()) {
      const v = await validateTopicContentAI(mod.title.trim());
      if (!v.isValid) issues.push(`Module ${index + 1} title ${v.error || 'contains inappropriate content'}`);
    }
    if (mod.description.trim()) {
      const v = await validateTopicContentAI(mod.description.trim());
      if (!v.isValid) issues.push(`Module ${index + 1} description ${v.error || 'contains inappropriate content'}`);
    }
    return issues;
  };

  const onSubmit = async (data: CourseFormData) => {
    if (currentStep !== 1) return;
    setIsSubmitting(true);
    try {
      setIsAnalyzingContent(true);
      toast.loading("Checking content with AI…", { id: "content-analysis" });
      const issues = await validateCourseContent(data);
      toast.dismiss("content-analysis");
      setIsAnalyzingContent(false);
      if (issues.length > 0) {
        setRejectionIssues(issues);
        setRejectionModalOpen(true);
        setIsSubmitting(false);
        return;
      }
      const courseId = await createCourse({
        title: data.title,
        description: data.description,
        topicId: data.topicId as any,
        difficulty: data.difficulty,
        estimatedDuration: data.estimatedDuration,
        prerequisites: data.prerequisites,
        learningObjectives: data.learningObjectives,
      });
      setCreatedCourseId(courseId);
      setCurrentStep(2);
      toast.success("Course created! Now add your modules.");
    } catch (error) {
      toast.dismiss("content-analysis");
      setIsAnalyzingContent(false);
      toast.error(error instanceof Error ? error.message : "Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    handleSubmit(
      (data) => onSubmit(data),
      () => toast.error("Please fill in all required fields correctly")
    )();
  };

  const addModule = () => {
    setModules([...modules, { title: "", description: "", order: modules.length + 1 }]);
  };

  const updateModule = async (index: number, field: string, value: any) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
    if (field === "title" || field === "description") {
      const mod = updated[index];
      if (mod.title.trim() || mod.description.trim()) {
        const issues = await validateSingleModule(mod, index);
        if (issues.length > 0) toast.error(issues[0]);
      }
    }
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const finishCourseCreation = async () => {
    if (!createdCourseId) return;
    setIsSubmitting(true);
    try {
      setIsAnalyzingContent(true);
      toast.loading("Checking module content with AI…", { id: "module-analysis" });
      const moduleIssues = await validateModuleContent(modules);
      toast.dismiss("module-analysis");
      setIsAnalyzingContent(false);
      if (moduleIssues.length > 0) {
        setRejectionIssues(moduleIssues);
        setRejectionModalOpen(true);
        setIsSubmitting(false);
        return;
      }
      const createModuleMutation = useMutation(api.courseModules.createModule);
      const generateCourseUploadUrlMutation = useMutation(api.courseModules.generateCourseUploadUrl);
      const storeCourseUploadedFileMutation = useMutation(api.courseModules.storeCourseUploadedFile);
      const uploadModuleVideoMutation = useMutation(api.courseModules.uploadModuleVideo);
      const uploadModuleFileMutation = useMutation(api.courseModules.uploadModuleFile);

      for (const mod of modules) {
        if (!mod.title.trim()) continue;
        const moduleId = await createModuleMutation({
          courseId: createdCourseId,
          title: mod.title,
          description: mod.description,
          order: mod.order,
        });
        if (mod.videoFile) {
          const uploadUrl = await generateCourseUploadUrlMutation();
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mod.videoFile.type },
            body: mod.videoFile,
          });
          if (res.ok) {
            const { storageId } = await res.json();
            const fileUrl = await storeCourseUploadedFileMutation({ storageId });
            if (fileUrl) {
              await uploadModuleVideoMutation({
                moduleId,
                videoUrl: fileUrl,
                videoName: mod.videoFile.name,
                videoSize: mod.videoFile.size,
                videoType: mod.videoFile.type,
              });
            }
          }
        }
        if (mod.documentFile) {
          const uploadUrl = await generateCourseUploadUrlMutation();
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mod.documentFile.type },
            body: mod.documentFile,
          });
          if (res.ok) {
            const { storageId } = await res.json();
            const fileUrl = await storeCourseUploadedFileMutation({ storageId });
            if (fileUrl) {
              await uploadModuleFileMutation({
                moduleId,
                fileUrl,
                fileName: mod.documentFile.name,
                fileSize: mod.documentFile.size,
                fileType: mod.documentFile.type,
              });
            }
          }
        }
      }
      toast.success("Course and modules created successfully!");
      reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.dismiss("module-analysis");
      setIsAnalyzingContent(false);
      toast.error(error instanceof Error ? error.message : "Failed to create modules");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    resetForm();
    setCurrentStep(1);
    setCreatedCourseId(null);
    setModules([]);
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      setValue("prerequisites", [...watchedPrerequisites, prerequisiteInput.trim()]);
      setPrerequisiteInput("");
    }
  };

  const removePrerequisite = (index: number) => {
    setValue("prerequisites", watchedPrerequisites.filter((_, i) => i !== index));
  };

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setValue("learningObjectives", [...watchedObjectives, objectiveInput.trim()]);
      setObjectiveInput("");
    }
  };

  const removeObjective = (index: number) => {
    setValue("learningObjectives", watchedObjectives.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#020617] border border-white/10 text-white">
        <DialogHeader>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
              currentStep === 1 ? "bg-pink-500 text-white" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
            }`}>
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <div className={`h-px flex-1 transition-colors ${currentStep > 1 ? "bg-emerald-500/30" : "bg-white/10"}`} />
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
              currentStep === 2 ? "bg-pink-500 text-white" : "bg-white/[0.06] border border-white/15 text-white/30"
            }`}>
              2
            </div>
          </div>
          <DialogTitle className="text-white text-lg">
            {currentStep === 1 ? "Course Details" : "Add Modules"}
          </DialogTitle>
          <p className="text-white/40 text-sm">
            {currentStep === 1
              ? "Set up the basics — you can always edit later."
              : "Break your course into modules. Each can have a video and supporting documents."}
          </p>
        </DialogHeader>

        {currentStep === 1 ? (
          <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-7 mt-2">
            {/* Basic Information */}
            <div>
              <p className={sectionHeadingCls}>Basic Information</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Course Title</label>
                  <input
                    {...register("title")}
                    placeholder="e.g. Mastering React Hooks"
                    className={inputCls}
                  />
                  {errors.title && <p className="text-rose-400 text-xs mt-1.5">{errors.title.message}</p>}
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="What will students learn? What problems will this course solve?"
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                  {errors.description && <p className="text-rose-400 text-xs mt-1.5">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Primary Topic</label>
                    <Select onValueChange={(v) => setValue("topicId", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-10 focus:border-pink-500/50 focus:ring-pink-500/20">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
                        {topics.map((topic) => (
                          <SelectItem key={topic._id} value={topic._id} className="focus:bg-white/5 focus:text-white">
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.topicId && <p className="text-rose-400 text-xs mt-1.5">Topic is required</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Difficulty</label>
                    <Select onValueChange={(v) => setValue("difficulty", v as any)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-10 focus:border-pink-500/50 focus:ring-pink-500/20">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
                        <SelectItem value="beginner" className="focus:bg-white/5 focus:text-white">Beginner</SelectItem>
                        <SelectItem value="intermediate" className="focus:bg-white/5 focus:text-white">Intermediate</SelectItem>
                        <SelectItem value="advanced" className="focus:bg-white/5 focus:text-white">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.difficulty && <p className="text-rose-400 text-xs mt-1.5">{errors.difficulty.message}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    {...register("estimatedDuration", { valueAsNumber: true })}
                    placeholder="e.g. 180"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <p className={sectionHeadingCls}>Prerequisites</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  placeholder="e.g. Basic JavaScript knowledge"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPrerequisite())}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addPrerequisite}
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {watchedPrerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedPrerequisites.map((prereq, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/15 text-white/70 text-xs px-3 py-1.5 rounded-full">
                      {prereq}
                      <button type="button" onClick={() => removePrerequisite(i)} className="text-white/40 hover:text-white transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Objectives */}
            <div>
              <p className={sectionHeadingCls}>Learning Objectives</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  placeholder="e.g. Build a full-stack app with Next.js"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addObjective())}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addObjective}
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {watchedObjectives.length > 0 && (
                <div className="space-y-2">
                  {watchedObjectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5">
                      <span className="text-pink-400 text-xs shrink-0">•</span>
                      <span className="flex-1 text-sm text-white/75">{obj}</span>
                      <button type="button" onClick={() => removeObjective(i)} className="text-white/30 hover:text-rose-400 transition-colors shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSubmitting || isAnalyzingContent}
                className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-9 px-5 text-sm"
              >
                {isAnalyzingContent ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Checking content…</>
                ) : isSubmitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Creating…</>
                ) : (
                  <>Continue <ChevronRight className="h-3.5 w-3.5 ml-1" /></>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Modules */
          <div className="space-y-6 mt-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className={sectionHeadingCls}>Course Modules</p>
                <button
                  onClick={addModule}
                  className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-10 text-center">
                  <div className="w-12 h-12 bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Video className="h-5 w-5 text-white/25" />
                  </div>
                  <p className="text-white/35 text-sm">No modules yet. Add your first module above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod, index) => (
                    <div key={index} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
                          Module {index + 1}
                        </span>
                        <button
                          onClick={() => removeModule(index)}
                          className="text-white/30 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className={labelCls}>Module Title</label>
                          <input
                            value={mod.title}
                            onChange={(e) => updateModule(index, "title", e.target.value)}
                            placeholder="e.g. Introduction to Hooks"
                            className={inputCls}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Description</label>
                          <textarea
                            value={mod.description}
                            onChange={(e) => updateModule(index, "description", e.target.value)}
                            placeholder="What will students learn in this module?"
                            rows={2}
                            className={`${inputCls} resize-none`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Video (optional)</label>
                            <label className={`flex items-center gap-2 cursor-pointer ${inputCls} py-2`}>
                              <Video className="h-4 w-4 text-white/30 shrink-0" />
                              <span className={`text-sm truncate ${mod.videoFile ? "text-emerald-400" : "text-white/25"}`}>
                                {mod.videoFile ? mod.videoFile.name : "Choose video"}
                              </span>
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => updateModule(index, "videoFile", e.target.files?.[0])}
                              />
                            </label>
                          </div>

                          <div>
                            <label className={labelCls}>Document (optional)</label>
                            <label className={`flex items-center gap-2 cursor-pointer ${inputCls} py-2`}>
                              <FileText className="h-4 w-4 text-white/30 shrink-0" />
                              <span className={`text-sm truncate ${mod.documentFile ? "text-blue-400" : "text-white/25"}`}>
                                {mod.documentFile ? mod.documentFile.name : "Choose file"}
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                                className="hidden"
                                onChange={(e) => updateModule(index, "documentFile", e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={finishCourseCreation}
                  disabled={isSubmitting || isAnalyzingContent || modules.length === 0}
                  className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-9 px-5 text-sm"
                >
                  {isAnalyzingContent ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Checking content…</>
                  ) : isSubmitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Creating…</>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Content Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-md bg-[#020617] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <div className="w-8 h-8 bg-rose-500/15 border border-rose-500/25 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              Content Not Approved
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 my-1">
            <p className="text-white/45 text-sm">Your course could not be created due to the following issues:</p>
            {rejectionIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-rose-500/[0.07] border border-rose-500/20 rounded-xl p-3">
                <X className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <span className="text-sm text-white/75">{issue}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-white/55 text-xs font-semibold uppercase tracking-widest mb-2">Guidelines</p>
            <ul className="text-xs text-white/40 space-y-1">
              <li>• Use a professional, meaningful course title</li>
              <li>• Write a substantial, clear description</li>
              <li>• Keep prerequisites relevant and appropriate</li>
              <li>• Module titles and descriptions should be professional</li>
            </ul>
          </div>

          <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-3">
            <p className="text-amber-400/80 text-xs">
              AI moderation may occasionally make errors. If you believe your content was wrongly flagged, contact support.
            </p>
          </div>

          <Button
            onClick={() => setRejectionModalOpen(false)}
            className="w-full bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10"
          >
            Review & Fix
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
