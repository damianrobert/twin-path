"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Loader2, CheckCircle2, Lock, Play, FileText, ChevronLeft, ChevronRight, ArrowLeft, Trophy, RotateCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const initialized = useRef(false);
  const router = useRouter();

  const course = useQuery(api.courses.getCourseById, { courseId: courseId as Id<"courses"> });
  const updateProgress = useMutation(api.courseModules.updateModuleProgress);

  // Access control redirect
  useEffect(() => {
    if (course !== undefined && course !== null) {
      if (!course.enrollment && !course.isInstructor) {
        router.replace(`/courses/${courseId}`);
      }
    }
    if (course === null) {
      router.replace(`/courses`);
    }
  }, [course, courseId, router]);

  // Resume where left off — runs once when course data first arrives
  useEffect(() => {
    if (!course || initialized.current) return;
    initialized.current = true;

    const modules = course.modules as any[];
    if (modules.length === 0) return;

    const lastModule = (course.enrollment as any)?.currentModule;
    if (lastModule && modules.some((m) => m._id === lastModule)) {
      setActiveModuleId(lastModule);
      return;
    }

    // Find first incomplete module
    const completedIds: string[] = (course.enrollment as any)?.completedModules || [];
    const firstIncomplete = modules.find((m) => !completedIds.includes(m._id));
    setActiveModuleId(firstIncomplete?._id ?? modules[0]._id);
  }, [course]);

  if (course === undefined) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!course || (!course.enrollment && !course.isInstructor)) {
    return null; // redirect in progress
  }

  const modules = (course.modules as any[]);
  const activeModule = modules.find((m) => m._id === activeModuleId) ?? modules[0];
  const activeModuleIndex = modules.findIndex((m) => m._id === activeModule?._id);
  const completedIds: string[] = (course.enrollment as any)?.completedModules || [];
  const progress: number = (course.enrollment as any)?.progress || 0;
  const isCourseDone = !!(course.enrollment as any)?.completedAt;

  const isModuleCompleted = (id: string) => completedIds.includes(id);
  const isModuleUnlocked = (index: number): boolean => {
    if (course.isInstructor) return true;
    if (index === 0) return true;
    return completedIds.includes(modules[index - 1]._id);
  };

  const prevModule = activeModuleIndex > 0 ? modules[activeModuleIndex - 1] : null;
  const nextModule = activeModuleIndex < modules.length - 1 ? modules[activeModuleIndex + 1] : null;
  const isCurrentCompleted = activeModule ? isModuleCompleted(activeModule._id) : false;
  const canGoNext = nextModule && isModuleUnlocked(activeModuleIndex + 1);

  const handleMarkComplete = async () => {
    if (!activeModule || !course.enrollment) return;
    setIsMarkingComplete(true);
    try {
      await updateProgress({ moduleId: activeModule._id as Id<"courseModules">, isCompleted: true });
      if (nextModule) {
        setActiveModuleId(nextModule._id);
      }
      // If last module, Convex will reactively update enrollment.completedAt
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark complete");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleMarkIncomplete = async () => {
    if (!activeModule || !course.enrollment) return;
    try {
      await updateProgress({ moduleId: activeModule._id as Id<"courseModules">, isCompleted: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#020617]">

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col bg-white/[0.02] border-r border-white/[0.07] overflow-hidden">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Course Overview
          </Link>
          <h2 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{course.title}</h2>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/35">Progress</span>
              <span className="text-xs font-bold text-white/60">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isCourseDone
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-violet-500 to-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/25 mt-1">
              {completedIds.length} / {modules.length} modules
            </p>
          </div>
        </div>

        {/* Module list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {modules.map((mod: any, index: number) => {
            const completed = isModuleCompleted(mod._id);
            const unlocked = isModuleUnlocked(index);
            const isCurrent = mod._id === activeModule?._id;

            return (
              <button
                key={mod._id}
                onClick={() => unlocked && setActiveModuleId(mod._id)}
                disabled={!unlocked}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 border-l-2 ${
                  isCurrent
                    ? "bg-violet-500/10 border-violet-500"
                    : unlocked
                    ? "border-transparent hover:bg-white/[0.04] hover:border-white/20"
                    : "border-transparent opacity-40 cursor-not-allowed"
                }`}
              >
                {/* Status icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  completed
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : isCurrent
                    ? "bg-violet-500/20 border border-violet-500/40"
                    : unlocked
                    ? "bg-white/[0.06] border border-white/15"
                    : "bg-white/[0.03] border border-white/10"
                }`}>
                  {completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : !unlocked ? (
                    <Lock className="h-3 w-3 text-white/25" />
                  ) : isCurrent ? (
                    <Play className="h-3 w-3 text-violet-400 ml-0.5" />
                  ) : (
                    <span className="text-xs text-white/35">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug truncate ${
                    isCurrent ? "text-white" : completed ? "text-white/55" : unlocked ? "text-white/65" : "text-white/30"
                  }`}>
                    {mod.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {mod.videoUrl && <span className="text-[10px] text-white/25">Video</span>}
                    {mod.fileUrl && <span className="text-[10px] text-white/25">File</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {isCourseDone && activeModuleIndex === modules.length - 1 ? (
          /* Course completion screen */
          <div className="flex flex-col items-center justify-center min-h-full px-8 py-16 text-center">
            <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-9 w-9 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Course Complete!</h2>
            <p className="text-white/45 text-lg max-w-md mb-8">
              You've completed every module in <span className="text-white">{course.title}</span>. Great work!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard/my-courses">
                <button className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                  <BookOpen className="h-4 w-4" /> My Courses
                </button>
              </Link>
              <button
                onClick={() => setActiveModuleId(modules[0]._id)}
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Review from Start
              </button>
            </div>
          </div>
        ) : activeModule ? (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {/* Module header */}
            <div>
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
                Module {activeModuleIndex + 1} of {modules.length}
              </p>
              <h1 className="text-2xl font-bold text-white">{activeModule.title}</h1>
              {activeModule.description && (
                <p className="text-white/50 mt-2 leading-relaxed">{activeModule.description}</p>
              )}
            </div>

            {/* Video player */}
            {activeModule.videoUrl && (
              <div className="rounded-2xl overflow-hidden bg-black border border-white/[0.06]">
                <video
                  key={activeModule._id}
                  controls
                  className="w-full aspect-video"
                  src={activeModule.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* No video placeholder */}
            {!activeModule.videoUrl && (
              <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/10 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-10 w-10 text-white/15 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No video for this module</p>
                </div>
              </div>
            )}

            {/* File attachment */}
            {activeModule.fileUrl && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">Resources</p>
                <a
                  href={activeModule.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/75 group-hover:text-white transition-colors">
                      {activeModule.fileName}
                    </p>
                    {activeModule.fileSize && (
                      <p className="text-xs text-white/30">
                        {(activeModule.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </a>
              </div>
            )}

            {/* Completion action */}
            {course.enrollment && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                {isCurrentCompleted ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">Module completed</span>
                    </div>
                    <button
                      onClick={handleMarkIncomplete}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                      Mark incomplete
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {nextModule ? "Complete & Continue" : "Complete Course"}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between pt-2 pb-8">
              {prevModule ? (
                <button
                  onClick={() => setActiveModuleId(prevModule._id)}
                  className="flex items-center gap-2 text-sm text-white/45 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:block">Previous</span>
                </button>
              ) : <div />}

              {canGoNext ? (
                <button
                  onClick={() => setActiveModuleId(nextModule._id)}
                  className="flex items-center gap-2 text-sm text-white/45 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <span className="hidden sm:block">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : nextModule ? (
                <div className="flex items-center gap-1.5 text-sm text-white/20 px-4 py-2">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="hidden sm:block text-xs">Complete this module to unlock</span>
                </div>
              ) : <div />}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-white/30" />
          </div>
        )}
      </main>
    </div>
  );
}
