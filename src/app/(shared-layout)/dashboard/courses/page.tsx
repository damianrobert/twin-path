"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateCourseModal } from "@/components/web/CreateCourseModal";
import { CourseModuleManager } from "@/components/web/CourseModuleManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, BookOpen, Users, Clock, Play, Edit, Eye } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { toast } from "sonner";

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isManageModulesOpen, setIsManageModulesOpen] = useState(false);

  const courses = useQuery(api.courses.getInstructorCourses) || [];
  const updateCourse = useMutation(api.courses.updateCourse);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handlePublishCourse = async (courseId: any) => {
    try {
      await updateCourse({
        courseId,
        status: "published",
      });
      toast.success("Course published successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish course");
    }
  };

  const handleUnpublishCourse = async (courseId: any) => {
    try {
      await updateCourse({
        courseId,
        status: "draft",
      });
      toast.success("Course unpublished successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish course");
    }
  };

  if (courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your courses to share your knowledge with mentees
          </p>
        </div>
        
        <CreateCourseModal onSuccess={() => window.location.reload()}>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </CreateCourseModal>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              Start creating your first course to share your expertise with mentees
            </p>
            <CreateCourseModal onSuccess={() => window.location.reload()}>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </CreateCourseModal>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getStatusColor(course.status)}>
                    {course.status}
                  </Badge>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    {course.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {course.topic && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.topic.name}</span>
                      </div>
                    )}
                    {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollmentCount} students</span>
                      </div>
                    )}
                    {course.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(course.estimatedDuration / 60)}h</span>
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives Preview */}
                  {course.learningObjectives && course.learningObjectives.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Learning objectives:</p>
                      <ul className="text-muted-foreground space-y-1">
                        {course.learningObjectives.slice(0, 2).map((objective: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span className="line-clamp-1">{objective}</span>
                          </li>
                        ))}
                        {course.learningObjectives.length > 2 && (
                          <li className="text-primary">+{course.learningObjectives.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {course.status === "published" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Unpublish
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unpublish Course</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unpublish "{course.title}"? This will make the course unavailable to new students, but current enrollments will remain active.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnpublishCourse(course._id)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Unpublish Course
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm">
                            Publish
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Publish Course</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to publish "{course.title}"? This will make the course available for all mentees to discover and enroll in.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePublishCourse(course._id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Publish Course
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <Dialog open={isManageModulesOpen && selectedCourse?._id === course._id} onOpenChange={setIsManageModulesOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCourse(course)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Manage Modules
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Modules - {course.title}</DialogTitle>
                        </DialogHeader>
                        <CourseModuleManager courseId={course._id} isEditable={true} />
                      </DialogContent>
                    </Dialog>

                    {course.status === "published" && (
                      <Link href={`/courses/${course._id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
