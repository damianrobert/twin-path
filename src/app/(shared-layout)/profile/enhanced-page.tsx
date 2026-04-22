"use client";

import React, { useTransition } from "react";
import { enhancedProfileSchema } from "@/app/schemas/enhanced-profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  Loader2,
  Briefcase,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  User,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import GlobalAvatar from "@/components/web/GlobalAvatar";

/* ── helpers ── */
const inputCls =
  "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-colors";

const textareaCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-colors resize-none leading-relaxed";

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">
      {children}
      {optional && <span className="ml-1.5 normal-case text-white/25 tracking-normal font-normal">optional</span>}
    </label>
  );
}

function FieldErr({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

function CharCount({ value, max }: { value?: string; max: number }) {
  const len = value?.length ?? 0;
  const pct = len / max;
  return (
    <p className={`text-right text-xs mt-1 ${pct > 0.9 ? "text-red-400" : pct > 0.7 ? "text-yellow-400" : "text-white/25"}`}>
      {len}/{max}
    </p>
  );
}

/* ── completeness ── */
function useCompleteness(values: any, isMentor: boolean) {
  const checks = [
    { label: "Name", done: !!values.name },
    { label: "Role", done: !!values.role },
    { label: "Bio", done: !!(values.bio?.length > 10) },
    { label: "Availability", done: !!values.availability },
    ...(isMentor
      ? [
          { label: "Professional experience", done: !!(values.professionalExperience?.length > 10) },
          { label: "Years of experience", done: values.yearsOfExperience != null && values.yearsOfExperience > 0 },
          { label: "Teaching experience", done: !!(values.teachingExperience?.length > 10) },
          { label: "A link (portfolio / GitHub / LinkedIn)", done: !!(values.portfolioUrl || values.githubUrl || values.linkedinUrl) },
        ]
      : []),
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  return { checks, pct, done, total: checks.length };
}

/* ── role cards ── */
const roles = [
  {
    value: "mentee",
    label: "Mentee",
    sub: "I want to learn",
    Icon: GraduationCap,
    gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    border: "border-blue-500/40",
    iconBg: "bg-blue-500/15 border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    value: "mentor",
    label: "Mentor",
    sub: "I want to teach",
    Icon: Briefcase,
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    border: "border-violet-500/40",
    iconBg: "bg-violet-500/15 border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    value: "both",
    label: "Both",
    sub: "Learn & teach",
    Icon: Sparkles,
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/40",
    iconBg: "bg-emerald-500/15 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
];

/* ── profile preview ── */
function ProfilePreview({ values, isMentor }: { values: any; isMentor: boolean }) {
  const role = values.role || "mentee";
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
      <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Live Preview</p>

      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <GlobalAvatar user={{ name: values.name || "Your Name", role }} size="lg" clickable={false} />
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">
            {values.name || <span className="text-white/25">Your Name</span>}
          </h3>
          <span
            className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full border ${
              role === "mentor"
                ? "bg-violet-500/15 border-violet-500/20 text-violet-400"
                : role === "mentee"
                ? "bg-blue-500/15 border-blue-500/20 text-blue-400"
                : "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {role === "both" ? "Mentor & Mentee" : role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-white/40">
        {isMentor && values.yearsOfExperience > 0 && (
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" />
            {values.yearsOfExperience} yr{values.yearsOfExperience !== 1 ? "s" : ""} exp.
          </span>
        )}
        {values.availability && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {values.availability}
          </span>
        )}
      </div>

      {/* Bio */}
      {values.bio ? (
        <p className="text-sm text-white/55 leading-relaxed line-clamp-4">{values.bio}</p>
      ) : (
        <p className="text-sm text-white/20 italic">Your bio will appear here…</p>
      )}

      {/* Professional experience snippet */}
      {isMentor && values.professionalExperience && (
        <div className="pt-3 border-t border-white/8">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-1.5">Experience</p>
          <p className="text-xs text-white/45 leading-relaxed line-clamp-3">
            {values.professionalExperience}
          </p>
        </div>
      )}

      {/* Links */}
      {(values.portfolioUrl || values.githubUrl || values.linkedinUrl) && (
        <div className="pt-3 border-t border-white/8 flex flex-wrap gap-3">
          {values.portfolioUrl && (
            <span className="flex items-center gap-1.5 text-xs text-violet-400">
              <Globe className="h-3.5 w-3.5" /> Portfolio
            </span>
          )}
          {values.githubUrl && (
            <span className="flex items-center gap-1.5 text-xs text-white/45">
              <Github className="h-3.5 w-3.5" /> GitHub
            </span>
          )}
          {values.linkedinUrl && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main component ── */
const EnhancedProfilePage = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const mutation = useMutation(api.users.createOrUpdateProfile);
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading } = useConvexAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/auth/login");
  }, [isLoading, isAuthenticated, router]);

  const form = useForm({
    resolver: zodResolver(enhancedProfileSchema),
    defaultValues: {
      name: "",
      role: "mentee" as "mentor" | "mentee" | "both",
      bio: "",
      availability: "",
      professionalExperience: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      yearsOfExperience: undefined as number | undefined,
      teachingExperience: "",
    },
  });

  React.useEffect(() => {
    if (currentProfile) {
      form.reset({
        name: currentProfile.name || "",
        role: (currentProfile.role as any) || "mentee",
        bio: currentProfile.bio || "",
        availability: currentProfile.availability || "",
        professionalExperience: currentProfile.professionalExperience || "",
        portfolioUrl: currentProfile.portfolioUrl || "",
        githubUrl: currentProfile.githubUrl || "",
        linkedinUrl: currentProfile.linkedinUrl || "",
        yearsOfExperience: currentProfile.yearsOfExperience ?? undefined,
        teachingExperience: currentProfile.teachingExperience || "",
      });
    }
  }, [currentProfile, form]);

  const values = useWatch({ control: form.control });
  const selectedRole = values.role || "mentee";
  const isMentor = selectedRole === "mentor" || selectedRole === "both";
  const { checks, pct } = useCompleteness(values, isMentor);

  function onSubmit(data: any) {
    startTransition(async () => {
      try {
        await mutation(data);
        toast.success("Profile updated!");
        router.push("/dashboard");
      } catch {
        toast.error("Failed to update profile.");
      }
    });
  }

  if (isLoading || currentProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  const isNew = !currentProfile?._id;

  return (
    <div className="relative min-h-screen">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">Profile</p>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            {isNew ? "Create Your Profile" : "Edit Your Profile"}
          </h1>
          <p className="text-white/40 mt-2">
            {isNew
              ? "Tell us about yourself to get started with mentorship."
              : "Keep your profile up to date to get the best mentorship matches."}
          </p>

          {/* Completeness bar */}
          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">Profile completeness</span>
              <span className={`text-xs font-semibold ${pct === 100 ? "text-emerald-400" : pct >= 60 ? "text-yellow-400" : "text-white/50"}`}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct === 100 ? "bg-emerald-400" : pct >= 60 ? "bg-yellow-400" : "bg-violet-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ── Left: form ── */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Role selector */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-violet-500/15 border border-violet-500/20 rounded-lg flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Your Role</h2>
              </div>

              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-3">
                      {roles.map((r) => {
                        const active = field.value === r.value;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => field.onChange(r.value)}
                            className={`group relative bg-gradient-to-br ${r.gradient} border rounded-2xl p-4 text-left transition-all duration-200 ${
                              active ? r.border : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className={`w-9 h-9 ${r.iconBg} border rounded-xl flex items-center justify-center mb-3`}>
                              <r.Icon className={`h-4 w-4 ${r.iconColor}`} />
                            </div>
                            <p className="text-sm font-semibold text-white">{r.label}</p>
                            <p className="text-xs text-white/40 mt-0.5">{r.sub}</p>
                            {active && (
                              <div className="absolute top-3 right-3">
                                <CheckCircle2 className={`h-4 w-4 ${r.iconColor}`} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <FieldErr message={fieldState.error?.message} />
                  </div>
                )}
              />
            </div>

            {/* Basic Info */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-blue-500/15 border border-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Basic Information</h2>
              </div>

              {/* Name (readonly) */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label>Full Name</Label>
                    <input
                      {...field}
                      readOnly
                      className={`${inputCls} opacity-50 cursor-not-allowed`}
                    />
                    <p className="text-xs text-white/25 mt-1.5">
                      Automatically synced from your account.
                    </p>
                    <FieldErr message={fieldState.error?.message} />
                  </div>
                )}
              />

              {/* Bio */}
              <Controller
                name="bio"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label optional>Bio</Label>
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Tell us about yourself — your background, what you're passionate about, what you're working on…"
                      className={textareaCls}
                    />
                    <div className="flex justify-between">
                      <FieldErr message={fieldState.error?.message} />
                      <CharCount value={field.value} max={500} />
                    </div>
                  </div>
                )}
              />

              {/* Availability */}
              <Controller
                name="availability"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label optional>Availability</Label>
                    <textarea
                      {...field}
                      rows={2}
                      placeholder="e.g. Weekdays after 6 PM, weekends flexible"
                      className={textareaCls}
                    />
                    <div className="flex justify-between">
                      <FieldErr message={fieldState.error?.message} />
                      <CharCount value={field.value} max={200} />
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Mentor info */}
            {isMentor && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-violet-500/15 border border-violet-500/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Mentor Information</h2>
                    <p className="text-xs text-white/35 mt-0.5">Helps mentees choose you as their mentor</p>
                  </div>
                </div>

                {/* Professional experience */}
                <Controller
                  name="professionalExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Label>Professional Experience</Label>
                      <textarea
                        {...field}
                        rows={5}
                        placeholder="Describe your professional background, key achievements, companies worked at, and areas of expertise…"
                        className={textareaCls}
                      />
                      <div className="flex justify-between">
                        <FieldErr message={fieldState.error?.message} />
                        <CharCount value={field.value} max={1000} />
                      </div>
                    </div>
                  )}
                />

                {/* Years of experience */}
                <Controller
                  name="yearsOfExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Label optional>Years of Experience</Label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        placeholder="e.g. 5"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className={inputCls}
                      />
                      <FieldErr message={fieldState.error?.message} />
                    </div>
                  )}
                />

                {/* Teaching experience */}
                <Controller
                  name="teachingExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Label optional>
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap className="h-3 w-3" />
                          Teaching / Mentoring Experience
                        </span>
                      </Label>
                      <textarea
                        {...field}
                        rows={3}
                        placeholder="Previous teaching, coaching, or mentoring roles…"
                        className={textareaCls}
                      />
                      <div className="flex justify-between">
                        <FieldErr message={fieldState.error?.message} />
                        <CharCount value={field.value} max={500} />
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Links */}
            {isMentor && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-emerald-500/15 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Links</h2>
                    <p className="text-xs text-white/35 mt-0.5">At least one helps mentees trust you</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "portfolioUrl", Icon: Globe, placeholder: "https://yoursite.com", label: "Portfolio", color: "text-violet-400" },
                    { name: "githubUrl", Icon: Github, placeholder: "https://github.com/you", label: "GitHub", color: "text-white/50" },
                    { name: "linkedinUrl", Icon: Linkedin, placeholder: "https://linkedin.com/in/you", label: "LinkedIn", color: "text-blue-400" },
                  ].map(({ name, Icon, placeholder, label, color }) => (
                    <Controller
                      key={name}
                      name={name as any}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <div>
                          <Label optional>
                            <span className="inline-flex items-center gap-1.5">
                              <Icon className={`h-3 w-3 ${color}`} />
                              {label}
                            </span>
                          </Label>
                          <input
                            type="url"
                            placeholder={placeholder}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={inputCls}
                          />
                          <FieldErr message={fieldState.error?.message} />
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white text-black hover:bg-white/90 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {isNew ? "Create Profile" : "Save Changes"}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Right: sidebar ── */}
          <div className="space-y-5 lg:sticky lg:top-[76px]">
            {/* Live preview */}
            <ProfilePreview values={values} isMentor={isMentor} />

            {/* Checklist */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                  Checklist
                </p>
                <span className="text-xs text-white/35">{checks.filter((c) => c.done).length}/{checks.length}</span>
              </div>
              <div className="space-y-2">
                {checks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2.5">
                    {check.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/20 shrink-0" />
                    )}
                    <span className={`text-sm ${check.done ? "text-white/60" : "text-white/30"}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-xs text-violet-400 font-semibold">Profile Tips</p>
              </div>
              {[
                "A detailed bio increases your match rate by 3×",
                "Mentors with links get 2× more requests",
                "Be specific about your availability",
              ].map((tip) => (
                <p key={tip} className="text-xs text-white/35 leading-relaxed pl-5 border-l border-violet-500/20">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfilePage;
