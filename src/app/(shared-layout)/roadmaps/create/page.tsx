"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  ArrowLeft,
  Sparkles,
  Target,
  Gauge,
  Clock,
  BookOpen,
  Loader2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

type SkillLevel = "beginner" | "some_experience" | "intermediate" | "advanced";
type TimeBudget = "1-3h" | "3-5h" | "5-10h" | "10+h";
type LearningStyle = "video" | "text" | "mixed";

const skillOptions: { value: SkillLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "New to this" },
  { value: "some_experience", label: "Some experience", hint: "Tried a bit" },
  { value: "intermediate", label: "Intermediate", hint: "Comfortable" },
  { value: "advanced", label: "Advanced", hint: "Going deeper" },
];

const timeOptions: { value: TimeBudget; label: string }[] = [
  { value: "1-3h", label: "1-3h / week" },
  { value: "3-5h", label: "3-5h / week" },
  { value: "5-10h", label: "5-10h / week" },
  { value: "10+h", label: "10+h / week" },
];

const styleOptions: { value: LearningStyle; label: string; hint: string }[] = [
  { value: "video", label: "Video", hint: "YouTube, courses" },
  { value: "text", label: "Text", hint: "Articles, docs" },
  { value: "mixed", label: "Mixed", hint: "Best of both" },
];

const examples = [
  "I want to become a DevOps engineer",
  "I want to learn machine learning fundamentals",
  "I want to transition from frontend to fullstack",
  "I want to build and ship my first SaaS",
];

export default function CreateRoadmapPage() {
  const router = useRouter();
  const generateRoadmap = useAction(api.roadmaps.generateRoadmap);

  const [goal, setGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [timeBudget, setTimeBudget] = useState<TimeBudget>("3-5h");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("mixed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = goal.trim().length >= 10 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const result = await generateRoadmap({
        goal: goal.trim(),
        skillLevel,
        timeBudget,
        learningStyle,
      });
      toast.success("Generating your roadmap…");
      router.push(`/roadmaps/${result.roadmapId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate roadmap");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-purple-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <div className="mb-8">
          <Link href="/roadmaps">
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Roadmaps
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI-powered learning plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3 leading-[1.1]">
            What do you want to{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              learn
            </span>
            ?
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Describe your goal and we&apos;ll build a personalized step-by-step roadmap.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Goal */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Your goal</h2>
                <p className="text-xs text-white/40">Be specific — the AI does better with context</p>
              </div>
            </div>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I want to become a DevOps engineer and land a job in 6 months"
              rows={3}
              required
              minLength={10}
              maxLength={400}
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors resize-y"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-white/35">{goal.length}/400</p>
              {goal.length < 10 && (
                <p className="text-xs text-white/35">Tell us a bit more (10+ chars)</p>
              )}
            </div>

            {/* Examples */}
            <div className="mt-4">
              <p className="text-xs text-white/35 mb-2 font-medium uppercase tracking-wider">Try one</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setGoal(ex)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55 hover:text-white hover:bg-white/[0.07] hover:border-white/20 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skill level */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Current skill level</h2>
                <p className="text-xs text-white/40">Where are you right now?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {skillOptions.map((opt) => {
                const isActive = skillLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSkillLevel(opt.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-white/35">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time budget */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Time budget</h2>
                <p className="text-xs text-white/40">How much time can you commit weekly?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeOptions.map((opt) => {
                const isActive = timeBudget === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimeBudget(opt.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500/30 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning style */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Learning style</h2>
                <p className="text-xs text-white/40">We&apos;ll bias resources toward your preference</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((opt) => {
                const isActive = learningStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLearningStyle(opt.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/30 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-white/35">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-white/5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating roadmap…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Roadmap
                </>
              )}
            </button>
            <Link href="/roadmaps">
              <button
                type="button"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
            </Link>
          </div>

          {isSubmitting && (
            <p className="text-center text-xs text-white/35 pt-2">
              This takes a few seconds. We&apos;ll redirect you as soon as it&apos;s ready.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
