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
import { Loader2, Plus, X, Upload, FileText, Video, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { contentSchemas } from "@/lib/validation";
import { validateTopicContentAI } from "@/lib/ai-content-filter";

const courseSchema = contentSchemas.course;

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

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

  // AI-powered content validation for courses
  const validateCourseContent = async (data: CourseFormData) => {
    const issues: string[] = [];

    // Validate course title
    const titleValidation = await validateTopicContentAI(data.title.trim());
    if (!titleValidation.isValid) {
      issues.push(`Course title ${titleValidation.error || 'contains inappropriate content'}`);
    }

    // Validate course description
    const descValidation = await validateTopicContentAI(data.description.trim());
    if (!descValidation.isValid) {
      issues.push(`Course description ${descValidation.error || 'contains inappropriate content'}`);
    }

    // Validate prerequisites
    for (const prereq of data.prerequisites || []) {
      const prereqValidation = await validateTopicContentAI(prereq.trim());
      if (!prereqValidation.isValid) {
        issues.push(`Prerequisite "${prereq}" ${prereqValidation.error || 'contains inappropriate content'}`);
      }
    }

    // Validate learning objectives
    for (const objective of data.learningObjectives || []) {
      const objValidation = await validateTopicContentAI(objective.trim());
      if (!objValidation.isValid) {
        issues.push(`Learning objective "${objective}" ${objValidation.error || 'contains inappropriate content'}`);
      }
    }

    return issues;
  };

  // AI-powered content validation for modules
  const validateModuleContent = async (modules: Array<{ title: string; description: string }>) => {
    const issues: string[] = [];
    console.log('validateModuleContent called with modules:', modules);

    for (const module of modules) {
      if (!module.title.trim()) continue;
      
      console.log('Validating module:', module.title);

      // Validate module title
      const titleValidation = await validateTopicContentAI(module.title.trim());
      console.log('Title validation result:', titleValidation);
      
      if (!titleValidation.isValid) {
        issues.push(`Module title "${module.title}" ${titleValidation.error || 'contains inappropriate content'}`);
      }

      // Validate module description if provided
      if (module.description.trim()) {
        console.log('Validating description:', module.description);
        const descValidation = await validateTopicContentAI(module.description.trim());
        console.log('Description validation result:', descValidation);
        
        if (!descValidation.isValid) {
          issues.push(`Module description "${module.description}" ${descValidation.error || 'contains inappropriate content'}`);
        }
      }
    }

    console.log('Final issues array:', issues);
    return issues;
  };

  const onSubmit = async (data: CourseFormData) => {
    if (currentStep === 1) {
      setIsSubmitting(true);
      try {
        setIsAnalyzingContent(true);
        toast.loading("Please wait while AI checks your content...", { id: "content-analysis" });
        
        // AI-powered content validation
        const issues = await validateCourseContent(data);
        
        toast.dismiss("content-analysis");
        setIsAnalyzingContent(false);
        
        if (issues.length > 0) {
          setRejectionIssues(issues);
          setRejectionModalOpen(true);
          setIsSubmitting(false);
          return;
        }

        console.log('Attempting to create course...');
        const courseId = await createCourse({
          title: data.title,
          description: data.description,
          topicId: data.topicId as any,
          difficulty: data.difficulty,
          estimatedDuration: data.estimatedDuration,
          prerequisites: data.prerequisites,
          learningObjectives: data.learningObjectives,
        });
        console.log('Course created with ID:', courseId);

        setCreatedCourseId(courseId);
        setCurrentStep(2);
        toast.success("Course created! Now add your modules.");
      } catch (error) {
        toast.dismiss("content-analysis");
        setIsAnalyzingContent(false);
        console.error('Error creating course:', error);
        toast.error(error instanceof Error ? error.message : "Failed to create course");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const debugSubmit = (data: any) => {
    console.log('Form submitted successfully, calling onSubmit...');
    onSubmit(data);
  };

  const handleFormSubmit = () => {
    console.log('handleFormSubmit called');
    console.log('Form errors:', errors);
    console.log('Form values:', watch());
    
    // Force form validation and submission
    handleSubmit((data) => {
      console.log('handleSubmit callback triggered with data:', data);
      onSubmit(data);
    }, (errors) => {
      console.log('Form validation errors:', errors);
      toast.error('Please fill in all required fields correctly');
    })();
  };

  const addModule = () => {
    setModules([...modules, {
      title: "",
      description: "",
      order: modules.length + 1,
    }]);
  };

  const updateModule = async (index: number, field: string, value: any) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
    
    // Real-time AI validation for module content
    if (field === 'title' || field === 'description') {
      const module = updatedModules[index];
      if (module.title.trim() || module.description.trim()) {
        const issues = await validateSingleModule(module, index);
        if (issues.length > 0) {
          // Show validation error for this specific module
          toast.error(issues[0]); // Show first issue
        }
      }
    }
  };

  // Validate a single module
  const validateSingleModule = async (module: { title: string; description: string }, index: number) => {
    const issues: string[] = [];

    // Validate module title
    if (module.title.trim()) {
      const titleValidation = await validateTopicContentAI(module.title.trim());
      if (!titleValidation.isValid) {
        issues.push(`Module ${index + 1} title ${titleValidation.error || 'contains inappropriate content'}`);
      }
    }

    // Validate module description if provided
    if (module.description.trim()) {
      const descValidation = await validateTopicContentAI(module.description.trim());
      if (!descValidation.isValid) {
        issues.push(`Module ${index + 1} description ${descValidation.error || 'contains inappropriate content'}`);
      }
    }

    return issues;
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const finishCourseCreation = async () => {
    console.log('finishCourseCreation called');
    console.log('modules:', modules);
    
    // Simple test to make sure button click works
    toast("Button clicked! Checking modules...");
    
    if (!createdCourseId) {
      console.log('No createdCourseId, returning');
      return;
    }
    
    console.log('createdCourseId exists:', createdCourseId);
    setIsSubmitting(true);
    try {
      setIsAnalyzingContent(true);
      toast.loading("Please wait while AI checks your module content...", { id: "module-analysis" });
      
      console.log('Starting AI validation for modules...');
      // AI-powered content validation for modules
      const moduleIssues = await validateModuleContent(modules);
      console.log('Module validation results:', moduleIssues);
      
      toast.dismiss("module-analysis");
      setIsAnalyzingContent(false);
      
      if (moduleIssues.length > 0) {
        console.log('Module issues found:', moduleIssues);
        setRejectionIssues(moduleIssues);
        setRejectionModalOpen(true);
        setIsSubmitting(false);
        return;
      }
      // Use useMutation hooks for Convex mutations
      const createModuleMutation = useMutation(api.courseModules.createModule);
      const generateCourseUploadUrlMutation = useMutation(api.courseModules.generateCourseUploadUrl);
      const storeCourseUploadedFileMutation = useMutation(api.courseModules.storeCourseUploadedFile);
      const uploadModuleVideoMutation = useMutation(api.courseModules.uploadModuleVideo);
      const uploadModuleFileMutation = useMutation(api.courseModules.uploadModuleFile);

      for (const module of modules) {
        if (!module.title.trim()) continue;

        // Create module
        const moduleId = await createModuleMutation({
          courseId: createdCourseId,
          title: module.title,
          description: module.description,
          order: module.order,
        });

        // Upload video if provided
        if (module.videoFile) {
          const uploadUrl = await generateCourseUploadUrlMutation();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": module.videoFile.type },
            body: module.videoFile,
          });
          
          if (response.ok) {
            const { storageId } = await response.json();
            const fileUrl = await storeCourseUploadedFileMutation({ storageId });
            
            if (fileUrl) {
              await uploadModuleVideoMutation({
                moduleId,
                videoUrl: fileUrl,
                videoName: module.videoFile.name,
                videoSize: module.videoFile.size,
                videoType: module.videoFile.type,
              });
            }
          }
        }

        // Upload document if provided
        if (module.documentFile) {
          const uploadUrl = await generateCourseUploadUrlMutation();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": module.documentFile.type },
            body: module.documentFile,
          });
          
          if (response.ok) {
            const { storageId } = await response.json();
            const fileUrl = await storeCourseUploadedFileMutation({ storageId });
            
            if (fileUrl) {
              await uploadModuleFileMutation({
                moduleId,
                fileUrl,
                fileName: module.documentFile.name,
                fileSize: module.documentFile.size,
                fileType: module.documentFile.type,
              });
            } else {
              console.error("Failed to get file URL from storage");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1 ? "Create New Course" : "Add Course Modules"}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 1 ? (
          <form onSubmit={handleSubmit(debugSubmit)} className="space-y-6">
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
              <Button type="button" onClick={handleFormSubmit} disabled={isSubmitting || isAnalyzingContent}>
                {isAnalyzingContent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Analyzing Content...
                  </>
                ) : isSubmitting ? (
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
                  disabled={isSubmitting || isAnalyzingContent || modules.length === 0}
                >
                  {isAnalyzingContent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Analyzing Content...
                    </>
                  ) : isSubmitting ? (
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

      {/* Content Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Content Not Approved
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your course could not be created due to the following content issues:
            </p>
            {rejectionIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-sm">{issue}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Please review and revise your content:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Ensure your title is professional and meaningful</li>
              <li>• Provide substantial course description</li>
              <li>• Use professional language and avoid inappropriate words</li>
              <li>• Make sure prerequisites are relevant and appropriate</li>
              <li>• Keep learning objectives professional and clear</li>
              <li>• Module titles and descriptions should be professional</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Content moderation is performed by AI and may occasionally make errors. 
              If you believe your content was incorrectly flagged, please contact our support team for review.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => setRejectionModalOpen(false)}
              className="flex-1"
            >
              I'll Fix It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
