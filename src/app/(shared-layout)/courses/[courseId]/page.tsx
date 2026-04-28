"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2, BookOpen, Users, Clock, CheckCircle2, Lock, Play, FileText, Video, ArrowRight, GraduationCap, Star, User } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";

const difficultyPill = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":     return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "intermediate": return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    case "advanced":     return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
    default:             return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();

  const course = useQuery(api.courses.getCourseById, { courseId: courseId as Id<"courses"> });
  const enrollInCourse = useMutation(api.courses.enrollInCourse);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollInCourse({ courseId: courseId as Id<"courses"> });
      toast.success("Enrolled! Let's start learning.");
      router.push(`/courses/${courseId}/learn`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enroll");
      setEnrolling(false);
    }
  };

  if (course === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center max-w-md">
          <div className="w-14 h-14 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-6 w-6 text-white/25" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Course not found</h3>
          <p className="text-white/40 mb-6">This course may not exist or you may not have access to it.</p>
          <Link href="/courses">
            <button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10 px-6 text-sm transition-colors">
              Browse Courses
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = !!course.enrollment?.completedAt;
  const progress = course.enrollment?.progress || 0;
  const completedCount = course.enrollment?.completedModules?.length || 0;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* Left — course content */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/35">
              <Link href="/courses" className="hover:text-white/70 transition-colors">Courses</Link>
              <span>/</span>
              {course.topic && <span>{course.topic.name}</span>}
            </div>

            {/* Hero */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${difficultyPill(course.difficulty)}`}>
                  {course.difficulty}
                </span>
                {course.topic && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400">
                    {course.topic.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{course.title}</h1>
              <p className="text-white/55 text-lg leading-relaxed">{course.description}</p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/40 border-y border-white/[0.06] py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount || 0} students enrolled</span>
              </div>
              {course.estimatedDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(course.estimatedDuration / 60)} hours total</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{course.modules.length} modules</span>
              </div>
              {course.instructor && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>by {course.instructor.name}</span>
                </div>
              )}
            </div>

            {/* What you'll learn */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">What you'll learn</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learningObjectives.map((obj: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-white/65">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">Prerequisites</p>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/55">
                      <span className="text-amber-400 mt-1 shrink-0">›</span>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            <div>
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">Course Curriculum</p>
              <div className="space-y-2">
                {course.modules.map((mod: any, index: number) => {
                  const isModuleCompleted = course.enrollment?.completedModules?.includes(mod._id);
                  return (
                    <div
                      key={mod._id}
                      className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isModuleCompleted
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-white/[0.06] border border-white/15"
                      }`}>
                        {isModuleCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <span className="text-xs text-white/35">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/75">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{mod.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {mod.videoUrl && <Video className="h-3.5 w-3.5 text-white/25" />}
                        {mod.fileUrl && <FileText className="h-3.5 w-3.5 text-white/25" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructor */}
            {course.instructor && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">Instructor</p>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-500/15 border border-violet-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{course.instructor.name}</p>
                    {course.instructor.professionalExperience && (
                      <p className="text-sm text-white/45 mt-0.5">{course.instructor.professionalExperience}</p>
                    )}
                    {course.instructor.bio && (
                      <p className="text-sm text-white/40 mt-2 leading-relaxed">{course.instructor.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky CTA card */}
          <div className="lg:sticky lg:top-[76px] h-fit">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">

              {/* Progress (enrolled) */}
              {course.enrollment && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/35 uppercase tracking-widest font-semibold">Your Progress</span>
                    <span className="text-sm font-bold text-white">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-violet-500 to-blue-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/35">{completedCount} of {course.modules.length} modules complete</p>
                </div>
              )}

              {/* Main CTA */}
              {course.isInstructor ? (
                <Link href="/dashboard/courses">
                  <button className="w-full h-12 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    Manage in Course Studio
                  </button>
                </Link>
              ) : course.enrollment ? (
                <Link href={`/courses/${courseId}/learn`}>
                  <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                    <Play className="h-4 w-4" />
                    {progress > 0 ? "Resume Learning" : "Start Learning"}
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-60"
                >
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><GraduationCap className="h-4 w-4" /> Enroll for Free</>
                  )}
                </button>
              )}

              {/* Course quick stats */}
              <div className="space-y-3 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Modules</span>
                  <span className="text-white/70">{course.modules.length}</span>
                </div>
                {course.estimatedDuration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Duration</span>
                    <span className="text-white/70">{Math.round(course.estimatedDuration / 60)}h</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Level</span>
                  <span className="text-white/70 capitalize">{course.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Students</span>
                  <span className="text-white/70">{course.enrollmentCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
