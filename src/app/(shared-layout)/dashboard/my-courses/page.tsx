"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2, GraduationCap, BookOpen, Clock, CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

const difficultyPill = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":     return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "intermediate": return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    case "advanced":     return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
    default:             return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

export default function MyCoursesPage() {
  const userEnrollments = useQuery(api.courses.getUserEnrollments);

  if (userEnrollments === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  const validEnrollments = (userEnrollments as any[]).filter((e: any) => e?.course);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">My Learning</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Courses
            </span>
          </h1>
          <p className="text-white/40 mt-3 text-lg">Pick up where you left off.</p>
        </div>

        {validEnrollments.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-white/40 mb-8 max-w-sm mx-auto">
              Start your learning journey by enrolling in a course
            </p>
            <Link href="/courses">
              <button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl h-10 px-6 text-sm transition-colors">
                Discover Courses
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {validEnrollments.map((enrollment: any) => {
              const course = enrollment.course;
              const modules = course.modules || [];
              const progress = enrollment.progress || 0;
              const isCompleted = !!enrollment.completedAt;
              const completedCount = enrollment.completedModules?.length || 0;

              return (
                <div
                  key={enrollment._id}
                  className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                >
                  {/* Status + difficulty */}
                  <div className="flex items-center gap-2 mb-4">
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                        <Trophy className="h-3 w-3" /> Completed
                      </span>
                    ) : progress > 0 ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-white/[0.06] border-white/15 text-white/40">
                        Not Started
                      </span>
                    )}
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

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/35">Progress</span>
                      <span className="text-xs font-semibold text-white/55">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-violet-500 to-blue-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-1.5">
                      {completedCount} of {modules.length} modules complete
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/30 mb-5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{modules.length} modules</span>
                    </div>
                    {course.estimatedDuration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{Math.round(course.estimatedDuration / 60)}h</span>
                      </div>
                    )}
                    {course.instructor && (
                      <span className="truncate">by {course.instructor.name}</span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={`/courses/${course._id}/learn`} className="block mt-auto">
                    <button
                      className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all ${
                        isCompleted
                          ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                          : progress > 0
                          ? "bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20"
                          : "bg-white text-black hover:bg-white/90"
                      }`}
                    >
                      {isCompleted ? (
                        <><CheckCircle2 className="h-4 w-4" /> Review Course</>
                      ) : progress > 0 ? (
                        <>Resume <ArrowRight className="h-4 w-4" /></>
                      ) : (
                        <>Start Course <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
