"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Loader2,
  Map as MapIcon,
  Target,
  Clock,
  Gauge,
  BookOpen,
  Check,
  Play,
  FileText,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const difficultyPill = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "intermediate":
      return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    case "advanced":
      return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
    default:
      return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

const skillLevelLabel = (level: string) => {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "some_experience":
      return "Some experience";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return level;
  }
};

const learningStyleLabel = (style: string) => {
  switch (style) {
    case "video":
      return "Video";
    case "text":
      return "Text";
    case "mixed":
      return "Mixed";
    default:
      return style;
  }
};

export default function RoadmapDetailPage() {
  const params = useParams();
  const roadmapId = params.id as Id<"roadmaps">;

  const roadmap = useQuery(api.roadmaps.getRoadmapWithSteps, { roadmapId });
  const toggleStep = useMutation(api.roadmaps.toggleStepComplete);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const handleToggle = async (stepId: string) => {
    setTogglingId(stepId);
    try {
      await toggleStep({ stepId: stepId as Id<"roadmapSteps"> });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update step");
    } finally {
      setTogglingId(null);
    }
  };

  if (roadmap === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (roadmap === null) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-20">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapIcon className="h-7 w-7 text-white/25" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Roadmap Not Found</h1>
            <p className="text-white/40 mb-6">
              This roadmap doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/roadmaps">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Roadmaps
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isGenerating = roadmap.status === "generating";
  const isEnriching = roadmap.status === "enriching";
  const isFailed = roadmap.status === "failed";

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-purple-600/[0.03] blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-blue-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back */}
        <div className="mb-8">
          <Link href="/roadmaps">
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Roadmaps
            </button>
          </Link>
        </div>

        {/* Generating state */}
        {isGenerating ? (
          <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10 border border-white/10 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_60%)]" />
            <div className="relative text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-violet-300 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Crafting your roadmap…</h2>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                AI is analyzing your goal and designing a personalized learning path. This usually takes 5-15 seconds.
              </p>

              <div className="inline-flex items-start gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 max-w-md">
                <Target className="h-4 w-4 text-violet-300 mt-0.5 shrink-0" />
                <p className="text-sm text-white/60 italic text-left">&ldquo;{roadmap.goal}&rdquo;</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                  <Gauge className="h-3 w-3" />
                  {skillLevelLabel(roadmap.skillLevel)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                  <Clock className="h-3 w-3" />
                  {roadmap.timeBudget} / week
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                  <BookOpen className="h-3 w-3" />
                  {learningStyleLabel(roadmap.learningStyle)}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        ) : isFailed ? (
          <div className="bg-white/[0.03] border border-rose-500/20 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-7 w-7 text-rose-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Generation failed</h2>
            <p className="text-white/40 mb-1">{roadmap.error || "Something went wrong."}</p>
            <p className="text-white/30 text-sm mb-6">Try creating a new roadmap.</p>
            <Link href="/roadmaps/create">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                Try Again
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Roadmap Hero */}
            <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10 border border-white/10 rounded-3xl p-8 mb-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.1),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                    <Sparkles className="h-3 w-3" />
                    AI Roadmap
                  </span>
                  {isEnriching && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading resources…
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 leading-tight">
                  {roadmap.title}
                </h1>
                <p className="text-white/55 leading-relaxed mb-2">{roadmap.description}</p>

                <div className="flex items-start gap-2 mt-4 mb-6">
                  <Target className="h-4 w-4 text-white/30 mt-1 shrink-0" />
                  <p className="text-sm text-white/45 italic">&ldquo;{roadmap.goal}&rdquo;</p>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
                      Progress
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {roadmap.completedCount} / {roadmap.steps.length} · {roadmap.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${roadmap.progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                    <Gauge className="h-3 w-3" />
                    {skillLevelLabel(roadmap.skillLevel)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                    <Clock className="h-3 w-3" />
                    {roadmap.timeBudget} / week
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                    <BookOpen className="h-3 w-3" />
                    {learningStyleLabel(roadmap.learningStyle)}
                  </span>
                  {roadmap.estimatedWeeks && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                      ~{roadmap.estimatedWeeks} weeks
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/40 via-white/10 to-white/5" />

              <div className="space-y-5">
                {roadmap.steps.map((step, idx) => {
                  const isCompleted = !!step.completedAt;
                  const isToggling = togglingId === step._id;
                  const isResourcesPending = step.resourcesStatus === "pending";
                  const isResourcesFailed = step.resourcesStatus === "failed";

                  return (
                    <div key={step._id} className="relative pl-16">
                      {/* Step number node (sits on connector line) */}
                      <div
                        className={`absolute left-0 top-6 w-14 h-14 rounded-2xl flex items-center justify-center ring-4 ring-[#020617] transition-colors ${
                          isCompleted
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                            : "bg-violet-500/10 border border-violet-500/25 text-violet-300"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-bold">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>

                      {/* Step card */}
                      <div
                        className={`group bg-white/[0.03] border rounded-3xl p-6 transition-all duration-300 ${
                          isCompleted
                            ? "border-emerald-500/15 opacity-70"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3
                            className={`text-lg font-semibold leading-snug ${
                              isCompleted ? "text-white/60 line-through" : "text-white"
                            }`}
                          >
                            {step.title}
                          </h3>

                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggle(step._id)}
                            disabled={isToggling}
                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              isCompleted
                                ? "bg-emerald-500 text-white hover:bg-emerald-500/80"
                                : "bg-white/[0.04] border border-white/15 text-transparent hover:border-white/30 hover:text-white/30"
                            }`}
                            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${difficultyPill(step.difficulty)}`}
                          >
                            {step.difficulty}
                          </span>
                          {step.estimatedHours && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/50 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {step.estimatedHours}h
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p
                          className={`text-sm leading-relaxed mb-5 ${
                            isCompleted ? "text-white/35" : "text-white/55"
                          }`}
                        >
                          {step.description}
                        </p>

                        {/* Resources */}
                        <div>
                          <p className="text-xs text-white/35 mb-2 font-medium uppercase tracking-wider">
                            Resources
                          </p>
                          {isResourcesPending ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="h-11 bg-white/[0.03] border border-white/5 rounded-xl animate-pulse"
                                />
                              ))}
                              <p className="text-xs text-white/30 pt-1 flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Finding the best articles and videos…
                              </p>
                            </div>
                          ) : isResourcesFailed || step.resources.length === 0 ? (
                            <p className="text-xs text-white/30 italic">
                              No resources found for this step. Try searching manually for &ldquo;
                              {step.searchQueries?.[0] || step.title}&rdquo;.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {step.resources.map((resource) => {
                                const Icon = resource.type === "video" ? Play : FileText;
                                return (
                                  <li key={resource._id}>
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/15 transition-colors group/resource"
                                    >
                                      <div
                                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                          resource.type === "video"
                                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                                            : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                                        }`}
                                      >
                                        <Icon className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white/80 group-hover/resource:text-white line-clamp-1">
                                          {resource.title}
                                        </p>
                                        <p className="text-xs text-white/35 mt-0.5">
                                          {resource.source}
                                        </p>
                                      </div>
                                      <ExternalLink className="h-3.5 w-3.5 text-white/25 group-hover/resource:text-white/60 mt-1 shrink-0 transition-colors" />
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion card */}
              {roadmap.progress === 100 && roadmap.steps.length > 0 && (
                <div className="relative pl-16 mt-5">
                  <div className="absolute left-0 top-6 w-14 h-14 rounded-2xl flex items-center justify-center ring-4 ring-[#020617] bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-blue-500/15 border border-violet-500/30 rounded-3xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      🎉 You finished the roadmap!
                    </h3>
                    <p className="text-white/50">
                      Great work. Time to put your new skills into practice.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
