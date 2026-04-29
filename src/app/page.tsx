"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  BookOpen,
  Target,
  MessageCircle,
  Award,
  Shield,
  Star,
  Loader2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Zap,
  Map as MapIcon,
  Wand2,
  Play,
  FileText,
  Clock,
  Check,
  Palette,
  MessageSquare,
} from "lucide-react";
import Logo from "@/components/web/Logo";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ─── Canvas animation data ────────────────────────────────────────────────────

type CBar = { label: string; h: number };
type CFrame = { bars: CBar[]; a: number; b: number; sorted: number; step: number; label: string };

function cswap(arr: CBar[], i: number, j: number): CBar[] {
  const n = arr.map((b) => ({ ...b }));
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

const B0: CBar[] = [
  { label: "12", h: 15 }, { label: "23", h: 30 }, { label: "64", h: 82 },
  { label: "45", h: 58 }, { label: "31", h: 40 }, { label: "78", h: 100 }, { label: "15", h: 19 },
];
const B1 = cswap(B0, 2, 3); // 64↔45
const B2 = cswap(B1, 3, 4); // 64↔31
const B3 = cswap(B2, 5, 6); // 78↔15 → 78 sorted
const B4 = cswap(B3, 2, 3); // 45↔31
const B5 = cswap(B4, 4, 5); // 64↔15 → 64 sorted

const C_FRAMES: CFrame[] = [
  { bars: B0, a: -1, b: -1, sorted: 0, step: 1,  label: "Starting Bubble Sort…" },
  { bars: B0, a: 0,  b: 1,  sorted: 0, step: 2,  label: "Comparing 12 and 23" },
  { bars: B0, a: 1,  b: 2,  sorted: 0, step: 3,  label: "Comparing 23 and 64" },
  { bars: B0, a: 2,  b: 3,  sorted: 0, step: 4,  label: "64 > 45 — Swapping ↕" },
  { bars: B1, a: 2,  b: 3,  sorted: 0, step: 5,  label: "Swapped! 45 and 64" },
  { bars: B1, a: 3,  b: 4,  sorted: 0, step: 6,  label: "64 > 31 — Swapping ↕" },
  { bars: B2, a: 3,  b: 4,  sorted: 0, step: 7,  label: "Swapped! 31 and 64" },
  { bars: B2, a: 4,  b: 5,  sorted: 0, step: 8,  label: "Comparing 64 and 78" },
  { bars: B2, a: 5,  b: 6,  sorted: 0, step: 9,  label: "78 > 15 — Swapping ↕" },
  { bars: B3, a: -1, b: -1, sorted: 1, step: 10, label: "78 placed in final position ✓" },
  { bars: B3, a: 0,  b: 1,  sorted: 1, step: 11, label: "Pass 2 — Comparing 12 and 23" },
  { bars: B3, a: 1,  b: 2,  sorted: 1, step: 12, label: "Comparing 23 and 45" },
  { bars: B3, a: 2,  b: 3,  sorted: 1, step: 13, label: "45 > 31 — Swapping ↕" },
  { bars: B4, a: 2,  b: 3,  sorted: 1, step: 14, label: "Swapped! 31 and 45" },
  { bars: B4, a: 3,  b: 4,  sorted: 1, step: 15, label: "Comparing 45 and 64" },
  { bars: B4, a: 4,  b: 5,  sorted: 1, step: 16, label: "64 > 15 — Swapping ↕" },
  { bars: B5, a: -1, b: -1, sorted: 2, step: 17, label: "64 placed in final position ✓" },
];

export default function LandingPage() {
  const router = useRouter();
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [queryTimedOut, setQueryTimedOut] = React.useState(false);
  const [lumenTab, setLumenTab] = React.useState<"chat" | "canvas">("chat");
  const [canvasFrame, setCanvasFrame] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(
      () => setCanvasFrame((f) => (f + 1) % C_FRAMES.length),
      1400
    );
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentProfile === undefined) {
        setQueryTimedOut(true);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [currentProfile]);

  useEffect(() => {
    if (isAuthenticated && currentProfile && authLoading === false && !queryTimedOut) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, currentProfile, authLoading, router, queryTimedOut]);

  if (authLoading || (!queryTimedOut && currentProfile === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <Loader2 className="size-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (isAuthenticated && currentProfile && !queryTimedOut) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl px-4">
        <nav className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 flex justify-between items-center shadow-xl shadow-black/20">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm font-semibold rounded-xl h-9 px-5">
                Get started free
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4">
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-10 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>Trusted by <span className="text-white/80 font-medium">10,000+</span> professionals worldwide</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
            <span className="text-white">Find Your Perfect</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Mentor Match
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with industry experts, get personalized 1-on-1 guidance, and accelerate your career growth with TwinPath.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
            <Link href="/auth/login">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base font-semibold rounded-xl shadow-lg shadow-white/10 gap-2"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="ghost"
                className="border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.07] h-12 px-8 text-base rounded-xl backdrop-blur-sm"
              >
                Explore Platform
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="inline-grid grid-cols-3 divide-x divide-white/10 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
            {[
              { value: "500+", label: "Expert Mentors" },
              { value: "10K+", label: "Mentees Helped" },
              { value: "95%", label: "Success Rate" },
            ].map((stat) => (
              <div key={stat.label} className="px-8 py-5 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40 mt-0.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-widest uppercase animate-bounce select-none">
          scroll
        </div>
      </section>

      {/* Social proof bar */}
      <div className="relative z-10 border-y border-white/[0.06] bg-white/[0.02] py-5">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-2 text-white/30 text-sm font-medium">
          <span className="text-white/20 text-xs uppercase tracking-widest">Professionals from</span>
          {["Google", "Meta", "Stripe", "Airbnb", "Shopify", "Figma"].map((co) => (
            <span key={co} className="text-white/40 font-semibold">{co}</span>
          ))}
        </div>
      </div>

      {/* Features — Bento Grid */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/50 mb-6">
              <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
              Why TwinPath
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Everything you need to grow
            </h2>
            <p className="text-white/40 mt-4 text-lg max-w-xl mx-auto">
              One platform. Every tool to accelerate your professional journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            {/* Large feature card */}
            <div className="lg:col-span-2 group relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-violet-500/15 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-500/25 transition-colors">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Expert Mentors</h3>
                <p className="text-white/45 leading-relaxed">
                  Learn from verified industry professionals with proven track records across tech, product, design, finance, and more.
                </p>
                <div className="mt-6 flex gap-2">
                  {["Engineering", "Product", "Design", "Finance"].map((tag) => (
                    <span key={tag} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tall card */}
            <div className="group relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/15 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/25 transition-colors">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Personalized Paths</h3>
                <p className="text-white/45 leading-relaxed">
                  Customized guidance tailored to your specific goals, skills, and career aspirations.
                </p>
              </div>
            </div>

            {/* Small card */}
            <div className="group relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/25 transition-colors">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Real-time Chat</h3>
                <p className="text-white/45 leading-relaxed">
                  Message, collaborate, and learn in real time with your mentor.
                </p>
              </div>
            </div>

            {/* Wide card */}
            <div className="lg:col-span-2 group relative bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10 flex items-start gap-8">
                <div>
                  <div className="w-12 h-12 bg-pink-500/15 border border-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-500/25 transition-colors">
                    <BookOpen className="h-5 w-5 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Structured Courses</h3>
                  <p className="text-white/45 leading-relaxed">
                    Follow curated learning paths with clear milestones and progress tracking built for real results.
                  </p>
                </div>
                <div className="hidden lg:flex flex-col gap-3 min-w-48 mt-2">
                  {["Set clear goals", "Track milestones", "Celebrate wins"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                      <CheckCircle2 className="h-4 w-4 text-pink-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Small card */}
            <div className="group relative bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500/25 transition-colors">
                  <Award className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Achievement Tracking</h3>
                <p className="text-white/45 leading-relaxed">
                  Monitor your growth with detailed analytics and celebrate every milestone.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/25 transition-colors">
                  <Shield className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Safe & Moderated</h3>
                <p className="text-white/45 leading-relaxed">
                  AI-powered moderation ensures a professional and respectful environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Roadmap Spotlight */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New · AI-powered
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Your personal{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                learning roadmap
              </span>
            </h2>
            <p className="text-white/40 mt-4 text-lg max-w-2xl mx-auto">
              Tell AI your goal. Get a step-by-step plan with curated articles, videos, and tutorials — all hand-picked for how you learn.
            </p>
          </div>

          <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10 border border-white/10 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />

            <div className="relative grid lg:grid-cols-2 gap-10 p-8 md:p-12">
              {/* Left: copy */}
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white/60 mb-6 w-fit">
                  <MapIcon className="h-3 w-3 text-violet-400" />
                  AI Roadmaps
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  From &ldquo;I want to learn X&rdquo; to a concrete plan in seconds.
                </h3>
                <p className="text-white/50 leading-relaxed mb-6">
                  Describe what you want to become — a DevOps engineer, an ML researcher, a fullstack dev — and TwinPath generates a personalized roadmap with real resources from across the web.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    { icon: Wand2, text: "8-14 structured steps tailored to your skill level" },
                    { icon: BookOpen, text: "Real articles & videos — no hallucinated links" },
                    { icon: CheckCircle2, text: "Track progress with per-step completion" },
                    { icon: Clock, text: "Paced around your weekly time budget" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <item.icon className="h-3.5 w-3.5 text-violet-300" />
                      </div>
                      <span className="pt-1">{item.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/roadmaps/create">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 h-11 px-6 text-sm font-semibold rounded-xl gap-2 w-full sm:w-auto"
                    >
                      <Wand2 className="h-4 w-4" />
                      Create your roadmap
                    </Button>
                  </Link>
                  <Link href="/roadmaps">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 h-11 px-6 text-sm rounded-xl w-full sm:w-auto"
                    >
                      See examples
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: mock preview */}
              <div className="relative">
                <div className="relative bg-[#0b0f1a]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  {/* Mock header */}
                  <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06] mb-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                    <p className="text-xs text-white/35 ml-2 truncate">
                      Become a DevOps Engineer
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/35 font-medium uppercase tracking-wider">Progress</span>
                      <span className="text-xs font-semibold text-white/60">33%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="relative">
                    <div className="absolute left-[18px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-500/30 via-white/10 to-white/5" />
                    <div className="space-y-3">
                      {/* Step 1 - completed */}
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-3 w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center ring-4 ring-[#0b0f1a]">
                          <Check className="h-4 w-4" />
                        </div>
                        <div className="bg-white/[0.03] border border-emerald-500/15 rounded-xl p-3 opacity-70">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-white/60 line-through">Master Linux Fundamentals</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Done</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 - active */}
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-3 w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-300 flex items-center justify-center ring-4 ring-[#0b0f1a]">
                          <span className="text-xs font-bold">02</span>
                        </div>
                        <div className="bg-white/[0.05] border border-white/15 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-white">CI/CD with GitHub Actions</p>
                          </div>
                          <div className="flex gap-1.5 mb-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Intermediate</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/50">15h</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                              <div className="w-5 h-5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Play className="h-2.5 w-2.5 text-rose-300" />
                              </div>
                              <p className="text-[11px] text-white/65 truncate flex-1">GitHub Actions in 15 minutes</p>
                              <span className="text-[10px] text-white/25">youtube.com</span>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                              <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <FileText className="h-2.5 w-2.5 text-blue-300" />
                              </div>
                              <p className="text-[11px] text-white/65 truncate flex-1">Building your first CI/CD pipeline</p>
                              <span className="text-[10px] text-white/25">dev.to</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 - upcoming */}
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-3 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-white/35 flex items-center justify-center ring-4 ring-[#0b0f1a]">
                          <span className="text-xs font-bold">03</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3">
                          <p className="text-sm font-semibold text-white/55 mb-1.5">Containerize with Docker</p>
                          <div className="flex gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">Advanced</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/50">25h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating label */}
                <div className="absolute -top-3 -right-3 bg-violet-500/15 border border-violet-500/30 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-semibold text-violet-200 uppercase tracking-wider shadow-lg">
                  Live preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lumen AI Section ── */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New · Lumen AI
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Your AI mentor, now with{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                interactive Canvas
              </span>
            </h2>
            <p className="text-white/40 mt-4 text-lg max-w-2xl mx-auto">
              Chat with Lumen for guidance and explanations, or switch to Canvas
              mode and get live interactive visualizations of any algorithm or
              concept — built by AI, just for you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: feature copy */}
            <div className="flex flex-col justify-center">
              {/* Mode pills */}
              <div className="flex gap-3 mb-8">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                  Chat mode
                </div>
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 text-sm text-violet-300">
                  <Palette className="h-3.5 w-3.5" />
                  Canvas mode
                </div>
              </div>

              <ul className="space-y-5 mb-10">
                {[
                  {
                    icon: MessageSquare,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10 border-blue-500/20",
                    title: "Always-available AI tutor",
                    desc: "Ask anything — concepts, career advice, code reviews. Lumen responds with clear structured markdown.",
                  },
                  {
                    icon: Palette,
                    color: "text-violet-400",
                    bg: "bg-violet-500/10 border-violet-500/20",
                    title: "Canvas: live visualizations",
                    desc: "Switch to Canvas and describe any algorithm. Lumen generates a live interactive React app with step controls.",
                  },
                  {
                    icon: Sparkles,
                    color: "text-pink-400",
                    bg: "bg-pink-500/10 border-pink-500/20",
                    title: "Powered by Gemini Pro",
                    desc: "Backed by Google's most capable model for deep understanding, code generation, and creative visualizations.",
                  },
                  {
                    icon: CheckCircle2,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10 border-emerald-500/20",
                    title: "Persistent session history",
                    desc: "All your conversations are saved locally. Switch between sessions and pick up exactly where you left off.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl border ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                      <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/lumen">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white h-11 px-7 text-sm font-semibold rounded-xl gap-2 w-full sm:w-auto shadow-lg shadow-violet-900/30"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Lumen free
                </Button>
              </Link>
            </div>

            {/* Right: interactive mock */}
            <div className="relative">
              {/* Ambient glow behind mock */}
              <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)] pointer-events-none" />

              {/* Mode toggle */}
              <div className="relative flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1 mb-4 w-fit">
                <button
                  onClick={() => setLumenTab("chat")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    lumenTab === "chat"
                      ? "bg-white/10 text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
                <button
                  onClick={() => setLumenTab("canvas")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    lumenTab === "canvas"
                      ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  Canvas
                </button>
              </div>

              {/* Mock window */}
              {lumenTab === "chat" ? (
                /* ── Chat mock ── */
                <div className="relative bg-[#080c17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                  {/* Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    <div className="ml-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs text-white/40 font-medium">Lumen · Chat</span>
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="p-4 space-y-4 h-80">
                    <div className="flex justify-end">
                      <div className="bg-white text-black text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] font-medium">
                        How does async/await work in JavaScript?
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm p-3.5 text-sm space-y-2.5">
                        <p className="text-white/80 text-sm leading-relaxed">
                          <strong className="text-white font-semibold">async/await</strong> is syntactic sugar over Promises that makes asynchronous code read like synchronous code.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-white/10">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
                            <span className="text-[10px] text-white/30 font-mono">javascript</span>
                          </div>
                          <pre className="p-3 bg-[#060a12] text-[11px] text-white/70 font-mono leading-relaxed overflow-x-auto">
{`async function fetchUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  return await res.json();
}`}
                          </pre>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-white/55">
                          <span>✦ <code className="text-violet-300 bg-white/8 px-1 rounded">await</code> pauses until Promise resolves</span>
                          <span>✦ Always use <code className="text-violet-300 bg-white/8 px-1 rounded">try/catch</code> for errors</span>
                        </div>
                        <p className="text-white/45 text-xs">Want me to show you error handling patterns or how to run async calls in parallel?</p>
                      </div>
                    </div>
                  </div>
                  {/* Input bar */}
                  <div className="border-t border-white/[0.06] p-3">
                    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <span className="flex-1 text-xs text-white/25">Ask Lumen anything about learning…</span>
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Canvas mock (animated) ── */
                (() => {
                  const frame = C_FRAMES[canvasFrame];
                  const getColor = (i: number) => {
                    if (i >= frame.bars.length - frame.sorted) return "bg-emerald-500/80";
                    if (i === frame.a) return "bg-violet-500";
                    if (i === frame.b) return "bg-pink-500";
                    return "bg-white/20";
                  };
                  const isActive = (i: number) => i === frame.a || i === frame.b;
                  return (
                    <div className="relative bg-[#080c17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                      {/* Chrome */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                        <div className="ml-2 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                            <Palette className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-xs text-white/40 font-medium">Lumen · Canvas</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] text-white/30">Live</span>
                        </div>
                      </div>

                      {/* Canvas area */}
                      <div className="p-5">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold text-white/70">Bubble Sort Visualization</p>
                            <p className="text-[10px] text-violet-300/70 mt-0.5 h-3 transition-all duration-300">
                              {frame.label}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-white/25">Step</p>
                            <p className="text-sm font-bold text-white/60 tabular-nums">
                              {String(frame.step).padStart(2, "0")}
                              <span className="text-white/20 font-normal text-[10px]">/{C_FRAMES.length}</span>
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-0.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${(frame.step / C_FRAMES.length) * 100}%` }}
                          />
                        </div>

                        {/* Bars */}
                        <div className="flex items-end gap-1.5 bg-white/[0.02] rounded-xl px-4 pt-4 pb-2 border border-white/[0.06] mb-4" style={{ height: 140 }}>
                          {frame.bars.map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                              <span className={`text-[9px] font-mono transition-colors duration-300 ${isActive(i) ? "text-white/80" : "text-white/30"}`}>
                                {bar.label}
                              </span>
                              <div
                                className={`w-full rounded-t-md transition-all duration-500 ${getColor(i)} ${
                                  isActive(i) ? "ring-1 ring-white/40 shadow-md shadow-violet-500/30 scale-105" : ""
                                }`}
                                style={{ height: bar.h * 0.88 }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-[10px] text-white/30 mb-4">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500/80 inline-block" />Sorted</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" />A</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-pink-500 inline-block" />B</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-white/20 inline-block" />Unsorted</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-lg text-xs font-medium">
                            <Play className="h-3 w-3" />
                            Auto-playing
                          </button>
                          <button className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs cursor-default">Step →</button>
                          <button className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs cursor-default">Reset</button>
                          <span className="ml-auto text-[10px] text-white/20">1× speed</span>
                        </div>
                      </div>

                      {/* Input bar */}
                      <div className="border-t border-white/[0.06] p-3">
                        <div className="bg-white/[0.04] border border-violet-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                          <Palette className="h-3 w-3 text-violet-400/60 shrink-0" />
                          <span className="flex-1 text-xs text-white/25">Describe a concept to visualize…</span>
                          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <ArrowRight className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Floating label */}
              <div className="absolute -top-3 -right-3 bg-violet-500/15 border border-violet-500/30 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-semibold text-violet-200 uppercase tracking-wider shadow-lg">
                Interactive preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/50 mb-6">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              How it works
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Up and running in minutes
            </h2>
            <p className="text-white/40 mt-4 text-lg">
              Three simple steps to start your mentorship journey.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/40 via-blue-500/20 to-transparent" />

            <div className="space-y-6">
              {[
                {
                  step: "01",
                  color: "violet",
                  title: "Create Your Profile",
                  description: "Sign up and build your profile in minutes. Share your goals, experience, and what you want to learn or teach.",
                  accent: "text-violet-400",
                  bg: "bg-violet-500/10",
                  border: "border-violet-500/20",
                },
                {
                  step: "02",
                  color: "blue",
                  title: "Find Your Match",
                  description: "Browse mentors by expertise, industry, and availability. Our smart matching surfaces the best fit for your goals.",
                  accent: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/20",
                },
                {
                  step: "03",
                  color: "emerald",
                  title: "Start Growing",
                  description: "Connect with your mentor, set milestones, and track your progress on a personalized learning journey.",
                  accent: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="group relative bg-white/[0.02] border border-white/8 rounded-3xl p-8 pl-8 md:pl-24 hover:border-white/15 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex w-5 h-5 rounded-full ${item.bg} border ${item.border} items-center justify-center ring-4 ring-[#020617]`}>
                    <div className={`w-2 h-2 rounded-full ${item.bg.replace('/10', '/60')}`} />
                  </div>
                  <div className={`text-6xl font-black ${item.accent} opacity-20 leading-none select-none w-20 shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-white/45 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/50 mb-6">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              Success stories
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Real results, real people
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                initials: "JD",
                name: "John Doe",
                role: "Software Developer",
                quote: "TwinPath helped me transition from junior to senior developer in just 6 months. My mentor's guidance was absolutely invaluable.",
                gradient: "from-violet-500/20 to-violet-500/5",
                textColor: "text-violet-400",
              },
              {
                initials: "SM",
                name: "Sarah Miller",
                role: "Product Manager",
                quote: "The personalized learning approach and real-world insights from my mentor helped me land my dream job at a top-tier company.",
                gradient: "from-blue-500/20 to-blue-500/5",
                textColor: "text-blue-400",
              },
              {
                initials: "MC",
                name: "Mike Chen",
                role: "Data Scientist & Mentor",
                quote: "As a mentor I've helped 15+ mentees achieve their goals. TwinPath makes the entire mentorship process seamless and rewarding.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                textColor: "text-emerald-400",
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative bg-gradient-to-br ${t.gradient} border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300`}
              >
                <div className="flex gap-0.5 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/65 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold ${t.textColor}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/30 via-purple-600/20 to-blue-600/30 border border-white/15 p-12 md:p-16 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.2),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Ready to transform<br />your career?
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of professionals already accelerating their growth with TwinPath. It&apos;s free to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 h-12 px-10 text-base font-semibold rounded-xl gap-2"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 h-12 px-8 text-base rounded-xl"
                  >
                    Browse mentors
                  </Button>
                </Link>
              </div>
              <p className="text-white/25 text-sm mt-6">No credit card required &middot; Free forever plan available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-white/35 text-sm leading-relaxed">
                Connecting mentors and mentees to accelerate professional growth worldwide.
              </p>
            </div>

            {[
              {
                heading: "Platform",
                links: [
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Lumen AI", href: "/lumen" },
                  { label: "AI Roadmaps", href: "/roadmaps" },
                  { label: "Courses", href: "/courses" },
                ],
              },
              {
                heading: "Resources",
                links: [
                  { label: "Blog", href: "#" },
                  { label: "Help Center", href: "#" },
                  { label: "Community", href: "#" },
                ],
              },
              {
                heading: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">{col.heading}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-white/35 hover:text-white/70 text-sm transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/25 text-sm">&copy; 2026 TwinPath. All rights reserved.</p>
            <p className="text-white/20 text-xs">Built for ambitious professionals</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
