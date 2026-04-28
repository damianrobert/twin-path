"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Loader2,
  Map as MapIcon,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const statusPill = (status: string) => {
  switch (status) {
    case "generating":
      return "bg-violet-500/10 border border-violet-500/20 text-violet-300";
    case "enriching":
      return "bg-blue-500/10 border border-blue-500/20 text-blue-300";
    case "ready":
      return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300";
    case "failed":
      return "bg-rose-500/10 border border-rose-500/20 text-rose-300";
    default:
      return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "generating":
      return "Generating";
    case "enriching":
      return "Enriching";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
};

export default function RoadmapsPage() {
  const roadmaps = useQuery(api.roadmaps.getMyRoadmaps);
  const deleteRoadmap = useMutation(api.roadmaps.deleteRoadmap);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (roadmapId: string) => {
    if (!confirm("Delete this roadmap? This cannot be undone.")) return;
    setDeletingId(roadmapId);
    try {
      await deleteRoadmap({ roadmapId: roadmapId as Id<"roadmaps"> });
      toast.success("Roadmap deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (roadmaps === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-purple-600/[0.03] blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI-generated learning paths</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
            Your{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Roadmaps
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-8">
            Tell AI your goal and get a personalized, step-by-step learning plan with curated resources.
          </p>

          <Link href="/roadmaps/create">
            <button className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors shadow-lg shadow-white/5">
              <Plus className="h-4 w-4" />
              Create New Roadmap
            </button>
          </Link>
        </div>

        {/* Empty state */}
        {roadmaps.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapIcon className="h-7 w-7 text-white/25" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No roadmaps yet</h3>
            <p className="text-white/40 mb-6">
              Start by telling AI what you want to learn or become.
            </p>
            <Link href="/roadmaps/create">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                <Plus className="h-4 w-4" />
                Create Your First Roadmap
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roadmaps.map((roadmap) => (
              <div
                key={roadmap._id}
                className="group relative flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
              >
                {/* Status + delete */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusPill(roadmap.status)}`}
                  >
                    {statusLabel(roadmap.status)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(roadmap._id);
                    }}
                    disabled={deletingId === roadmap._id}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all disabled:opacity-50"
                    aria-label="Delete roadmap"
                  >
                    {deletingId === roadmap._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Title + description */}
                <Link href={`/roadmaps/${roadmap._id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors">
                    {roadmap.title}
                  </h3>
                </Link>

                <div className="flex items-start gap-2 mb-4">
                  <Target className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
                  <p className="text-white/45 text-sm line-clamp-2 leading-relaxed italic">
                    &ldquo;{roadmap.goal}&rdquo;
                  </p>
                </div>

                {/* Progress */}
                {roadmap.status === "ready" && roadmap.stepCount > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/35">
                        {roadmap.completedCount} of {roadmap.stepCount} completed
                      </span>
                      <span className="text-xs font-semibold text-white/55">
                        {roadmap.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${roadmap.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-white/30 mb-5 flex-1">
                  {roadmap.stepCount > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {roadmap.stepCount} steps
                    </span>
                  )}
                  {roadmap.estimatedWeeks && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {roadmap.estimatedWeeks} weeks
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link href={`/roadmaps/${roadmap._id}`} className="mt-auto">
                  <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 transition-colors">
                    {roadmap.status === "ready" ? "Open Roadmap" : "View Progress"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
