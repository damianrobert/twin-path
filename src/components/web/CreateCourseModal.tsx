"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Loader2, Plus, X, Upload, FileText, Video } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  topicId: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDuration: z.number().optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export const CreateCourseModal = ({ children, onSuccess }: CreateCourseModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const onSubmit = async (data: CourseFormData) => {
    if (currentStep === 1) {
      setIsSubmitting(true);
      try {
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
        toast.error(error instanceof Error ? error.message : "Failed to create course");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const addModule = () => {
    setModules([...modules, {
      title: "",
      description: "",
      order: modules.length + 1,
    }]);
  };

  const updateModule = (index: number, field: string, value: any) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const finishCourseCreation = async () => {
    if (!createdCourseId) return;
    
    setIsSubmitting(true);
    try {
      // Import the API functions directly
      const { createModule, generateCourseUploadUrl, storeCourseUploadedFile, uploadModuleVideo, uploadModuleFile } = api.courseModules;

      for (const module of modules) {
        if (!module.title.trim()) continue;

        // Create module
        const moduleId = await createModule({
          courseId: createdCourseId,
          title: module.title,
          description: module.description,
          order: module.order,
        });

        // Upload video if provided
        if (module.videoFile) {
          const uploadUrl = await generateCourseUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": module.videoFile.type },
            body: module.videoFile,
          });
          
          if (response.ok) {
            const { storageId } = await response.json();
            const fileUrl = await storeCourseUploadedFile({ storageId });
            await uploadModuleVideo({
              moduleId,
              videoUrl: fileUrl,
              videoName: module.videoFile.name,
              videoSize: module.videoFile.size,
              videoType: module.videoFile.type,
            });
          }
        }

        // Upload document if provided
        if (module.documentFile) {
          const uploadUrl = await generateCourseUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": module.documentFile.type },
            body: module.documentFile,
          });
          
          if (response.ok) {
            const { storageId } = await response.json();
            const fileUrl = await storeCourseUploadedFile({ storageId });
            await uploadModuleFile({
              moduleId,
              fileUrl,
              fileName: module.documentFile.name,
              fileSize: module.documentFile.size,
              fileType: module.documentFile.type,
            });
          }
        }
      }

      toast.success("Course and modules created successfully!");
      reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1 ? "Create New Course" : "Add Course Modules"}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 1 ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Course Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter course title"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what students will learn in this course"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic">Primary Topic</Label>
                  <Select onValueChange={(value) => setValue("topicId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic._id} value={topic._id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.topicId && (
                    <p className="text-sm text-red-500 mt-1">Topic is required</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select onValueChange={(value) => setValue("difficulty", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.difficulty && (
                    <p className="text-sm text-red-500 mt-1">{errors.difficulty.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  {...register("estimatedDuration", { valueAsNumber: true })}
                  placeholder="e.g., 180"
                />
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prerequisites</h3>
              
              <div className="flex gap-2">
                <Input
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  placeholder="Add a prerequisite"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPrerequisite())}
                />
                <Button type="button" onClick={addPrerequisite} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {watchedPrerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedPrerequisites.map((prereq, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {prereq}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removePrerequisite(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Learning Objectives</h3>
              
              <div className="flex gap-2">
                <Input
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  placeholder="Add a learning objective"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addObjective())}
                />
                <Button type="button" onClick={addObjective} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {watchedObjectives.length > 0 && (
                <div className="space-y-2">
                  {watchedObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1">{objective}</span>
                      <X
                        className="h-4 w-4 cursor-pointer text-red-500"
                        onClick={() => removeObjective(index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Continue to Modules"
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Add Modules */
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Course Modules</h3>
                <Button onClick={addModule} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>

              {modules.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4" />
                    <p>No modules yet. Add your first module to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Module {index + 1}</CardTitle>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeModule(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Module Title</Label>
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(index, "title", e.target.value)}
                            placeholder="Enter module title"
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={module.description}
                            onChange={(e) => updateModule(index, "description", e.target.value)}
                            placeholder="Describe what this module covers"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Video File (optional)</Label>
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) => updateModule(index, "videoFile", e.target.files?.[0])}
                            />
                            {module.videoFile && (
                              <p className="text-sm text-green-600 mt-1">
                                {module.videoFile.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Document File (optional)</Label>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              onChange={(e) => updateModule(index, "documentFile", e.target.files?.[0])}
                            />
                            {module.documentFile && (
                              <p className="text-sm text-blue-600 mt-1">
                                {module.documentFile.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={reset}>
                  Cancel
                </Button>
                <Button 
                  onClick={finishCourseCreation} 
                  disabled={isSubmitting || modules.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
