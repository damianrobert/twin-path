"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CreateCourseModal } from "@/components/web/CreateCourseModal";
import { CourseModuleManager } from "@/components/web/CourseModuleManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Presentation, Users, Clock, Edit, Eye, BookOpen } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusPill = (status: string) => {
  switch (status) {
    case "published": return "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400";
    case "draft":     return "bg-white/[0.06] border border-white/15 text-white/40";
    case "archived":  return "bg-rose-500/15 border border-rose-500/30 text-rose-400";
    default:          return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

const difficultyPill = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":     return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "intermediate": return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    case "advanced":     return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
    default:             return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isManageModulesOpen, setIsManageModulesOpen] = useState(false);

  const courses = useQuery(api.courses.getInstructorCourses) || [];
  const updateCourse = useMutation(api.courses.updateCourse);

  const handlePublishCourse = async (courseId: any) => {
    try {
      await updateCourse({ courseId, status: "published" });
      toast.success("Course published successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish course");
    }
  };

  const handleUnpublishCourse = async (courseId: any) => {
    try {
      await updateCourse({ courseId, status: "draft" });
      toast.success("Course unpublished successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish course");
    }
  };

  if (courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.06),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">
              Course Studio
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Your{" "}
              <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Courses
              </span>
            </h1>
            <p className="text-white/40 mt-3 text-lg">
              Create and publish courses to share your expertise with mentees.
            </p>
          </div>
          <CreateCourseModal onSuccess={() => window.location.reload()}>
            <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10 px-5 text-sm shrink-0 mt-4">
              <Presentation className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </CreateCourseModal>
        </div>

        {/* Empty State */}
        {courses.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-pink-500/15 border border-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Presentation className="h-7 w-7 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-white/40 mb-8 max-w-sm mx-auto">
              Start creating your first course to share your expertise with mentees
            </p>
            <CreateCourseModal onSuccess={() => window.location.reload()}>
              <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10 px-6 text-sm">
                <Presentation className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </CreateCourseModal>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
              >
                {/* Status + difficulty pills */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusPill(course.status)}`}>
                    {course.status}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${difficultyPill(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-2 leading-snug">
                  {course.title}
                </h3>
                <p className="text-white/40 text-sm line-clamp-2 leading-relaxed mb-4">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-white/30 mb-4">
                  {course.topic && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{course.topic.name}</span>
                    </div>
                  )}
                  {course.enrollmentCount != null && course.enrollmentCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{course.enrollmentCount} students</span>
                    </div>
                  )}
                  {course.estimatedDuration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{Math.round(course.estimatedDuration / 60)}h</span>
                    </div>
                  )}
                </div>

                {/* Learning objectives preview */}
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <div className="mb-4 flex-1">
                    <p className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-2">Objectives</p>
                    <ul className="space-y-1">
                      {course.learningObjectives.slice(0, 2).map((obj: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-white/40">
                          <span className="text-pink-400 mt-0.5 shrink-0">•</span>
                          <span className="line-clamp-1">{obj}</span>
                        </li>
                      ))}
                      {course.learningObjectives.length > 2 && (
                        <li className="text-xs text-pink-400/60 pl-3">
                          +{course.learningObjectives.length - 2} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-white/[0.06] mt-auto">
                  {course.status === "published" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-xs text-amber-400/80 hover:text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                          Unpublish
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unpublish Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unpublish "{course.title}"? Current enrollments remain active, but no new students can discover it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => handleUnpublishCourse(course._id)}>
                            Unpublish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-xs text-emerald-400/80 hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
                          Publish
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Publish Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Publish "{course.title}"? It will be visible and enrollable by all mentees.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handlePublishCourse(course._id)}>
                            Publish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Dialog
                    open={isManageModulesOpen && selectedCourse?._id === course._id}
                    onOpenChange={setIsManageModulesOpen}
                  >
                    <DialogTrigger asChild>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Modules
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto bg-[#020617] border border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Modules — {course.title}
                        </DialogTitle>
                      </DialogHeader>
                      <CourseModuleManager courseId={course._id} isEditable={true} />
                    </DialogContent>
                  </Dialog>

                  {course.status === "published" && (
                    <Link href={`/courses/${course._id}`} className="ml-auto">
                      <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
