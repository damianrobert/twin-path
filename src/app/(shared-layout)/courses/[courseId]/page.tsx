"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, Users, Clock, Play, FileText, CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const course = useQuery(api.courses.getCourseById, { courseId: resolvedParams.courseId as Id<"courses"> });
  const updateModuleProgress = useMutation(api.courseModules.updateModuleProgress);

  if (course === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Course not found</h3>
            <p className="text-muted-foreground">
              This course may not exist or you may not have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleModuleComplete = async (moduleId: Id<"courseModules">) => {
    try {
      await updateModuleProgress({
        moduleId,
        isCompleted: true,
      });
      toast.success("Module marked as completed!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update progress");
    }
  };

  const handleModuleIncomplete = async (moduleId: Id<"courseModules">) => {
    try {
      await updateModuleProgress({
        moduleId,
        isCompleted: false,
      });
      toast.success("Module marked as incomplete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update progress");
    }
  };

  const isModuleCompleted = (moduleId: Id<"courseModules">) => {
    return course.enrollment?.completedModules.includes(moduleId);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Badge className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                {course.topic && (
                  <Badge variant="outline">{course.topic.name}</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.enrollmentCount || 0} students</span>
                </div>
                {course.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.round(course.estimatedDuration / 60)} hours</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{course.modules.length} modules</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          {course.enrollment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {course.enrollment.progress}% Complete
                    </span>
                  </div>
                  <Progress value={course.enrollment.progress} className="h-2" />
                  
                  <div className="text-sm text-muted-foreground">
                    {course.enrollment.completedModules.length} of {course.modules.length} modules completed
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Objectives */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.modules.map((module: any, index: number) => {
                const isCompleted = isModuleCompleted(module._id);
                
                return (
                  <div
                    key={module._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedModule?._id === module._id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Module {index + 1}
                          </span>
                          {isCompleted && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <h4 className="font-medium mt-1">{module.title}</h4>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Module Resources */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {module.videoUrl && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Play className="h-4 w-4" />
                          <span>Video</span>
                        </div>
                      )}
                      {module.fileUrl && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <FileText className="h-4 w-4" />
                          <span>File</span>
                        </div>
                      )}
                    </div>

                    {/* Mark Complete Button */}
                    {course.enrollment && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              handleModuleIncomplete(module._id);
                            } else {
                              handleModuleComplete(module._id);
                            }
                          }}
                        >
                          {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedModule(null)}
                >
                  Close
                </Button>
              </div>

              {selectedModule.description && (
                <p className="text-muted-foreground mb-6">{selectedModule.description}</p>
              )}

              {/* Video Player */}
              {selectedModule.videoUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Video Content</h3>
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                    <video
                      controls
                      className="w-full h-full rounded-lg"
                      src={selectedModule.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* File Download */}
              {selectedModule.fileUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
                  <a
                    href={selectedModule.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {selectedModule.fileName}
                    <span className="text-muted-foreground">
                      ({selectedModule.fileSize && (selectedModule.fileSize / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </a>
                </div>
              )}

              {/* Progress Actions */}
              {course.enrollment && (
                <div className="pt-4 border-t">
                  <Button
                    size="lg"
                    variant={isModuleCompleted(selectedModule._id) ? "outline" : "default"}
                    onClick={() => {
                      if (isModuleCompleted(selectedModule._id)) {
                        handleModuleIncomplete(selectedModule._id);
                      } else {
                        handleModuleComplete(selectedModule._id);
                      }
                    }}
                  >
                    {isModuleCompleted(selectedModule._id) ? "Mark Incomplete" : "Mark as Complete"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
