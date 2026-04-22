"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import GlobalAvatar from "@/components/web/GlobalAvatar";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  Star,
  Clock,
  Award,
  ArrowLeft,
  Github,
  Linkedin,
  Globe,
  Heart,
  MessageCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import AssignmentsList from "@/components/web/AssignmentsList";
import MentorshipClosureModal from "@/components/web/MentorshipClosureModal";
import MentorshipCompletionModal from "@/components/web/MentorshipCompletionModal";
import MentorshipChatModal from "@/components/web/MentorshipChatModal";
import Navbar from "@/components/web/Navbar";

const statusStyles = {
  active: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
  completed: "bg-violet-500/15 border border-violet-500/30 text-violet-400",
  closed: "bg-red-500/15 border border-red-500/30 text-red-400",
};

const MentorshipPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const mentorshipId = params.mentorshipId as string;
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const currentProfile = useQuery(api.users.getCurrentProfile);
  const mentorship = useQuery(api.mentorships.getMentorshipById, {
    mentorshipId: mentorshipId as any,
  });
  const unseenCount =
    useQuery(api.messages.getUnseenCountForSession, {
      mentorshipId: mentorshipId as any,
    }) || 0;

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getExperienceLevel = (years?: number) => {
    if (!years) return "Not specified";
    if (years <= 2) return "Junior (0-2 yrs)";
    if (years <= 5) return "Mid-level (3-5 yrs)";
    if (years <= 10) return "Senior (6-10 yrs)";
    return "Expert (10+ yrs)";
  };

  if (isLoading || !currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  const errorCard = (title: string, message: string, href: string, linkLabel: string) => (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/45 mb-8">{message}</p>
        <Link href={href}>
          <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-8">
            {linkLabel}
          </Button>
        </Link>
      </div>
    </div>
  );

  if (!isAuthenticated)
    return errorCard("Authentication Required", "Please log in to view this mentorship.", "/auth/login", "Login");

  if (!mentorship)
    return errorCard("Mentorship Not Found", "This mentorship doesn't exist or you don't have access to it.", "/mentorship-requests", "Back to Requests");

  const isParticipant =
    mentorship.mentee?._id === currentProfile._id ||
    mentorship.mentor?._id === currentProfile._id;

  if (!isParticipant)
    return errorCard("Access Denied", "You don't have access to this mentorship.", "/dashboard", "Back to Dashboard");

  const isCurrentUserMentee = mentorship.mentee?._id === currentProfile._id;
  const isCurrentUserMentor = mentorship.mentor?._id === currentProfile._id;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Back + Title */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
            Private Space
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Mentorship Space
          </h1>
          <p className="text-white/40 mt-2">
            {mentorship.mentee?.name} &amp; {mentorship.mentor?.name}
          </p>
        </div>

        {/* Overview card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Topic & dates */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Topic</p>
                  <h2 className="text-lg font-semibold text-white">{mentorship.topic?.name}</h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/45">
                  <Calendar className="h-3.5 w-3.5" />
                  Started {formatDate(mentorship.createdAt)}
                </div>
                {mentorship.completedAt && (
                  <div className="flex items-center gap-2 text-white/45">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed {formatDate(mentorship.completedAt)}
                  </div>
                )}
              </div>

              {mentorship.request && (
                <div className="space-y-3 pt-2 border-t border-white/8">
                  {mentorship.request.learningGoal && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Learning Goal</p>
                      <p className="text-sm text-white/70">{mentorship.request.learningGoal}</p>
                    </div>
                  )}
                  {mentorship.request.message && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Initial Message</p>
                      <p className="text-sm text-white/70">{mentorship.request.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status + actions */}
            <div className="flex flex-col gap-3 sm:items-end shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                  statusStyles[mentorship.status] ?? "bg-white/5 border border-white/10 text-white/40"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {mentorship.status}
              </span>

              {mentorship.status === "active" && (
                <Button
                  size="sm"
                  onClick={() => setIsChatModalOpen(true)}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                  {unseenCount > 0 && (
                    <span className="flex items-center gap-1 bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      <Bell className="h-3 w-3" />
                      {unseenCount}
                    </span>
                  )}
                </Button>
              )}

              {mentorship.status === "active" && isCurrentUserMentor && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsCompletionModalOpen(true)}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Complete Path
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsClosureModalOpen(true)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Conclude Path
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Mentee */}
          <ParticipantCard
            role="Mentee"
            isYou={isCurrentUserMentee}
            accentClass="violet"
            profile={mentorship.mentee}
            showTeaching={false}
            getExperienceLevel={getExperienceLevel}
          />
          {/* Mentor */}
          <ParticipantCard
            role="Mentor"
            isYou={isCurrentUserMentor}
            accentClass="blue"
            profile={mentorship.mentor}
            showTeaching
            getExperienceLevel={getExperienceLevel}
          />
        </div>

        {/* Assignments */}
        <AssignmentsList
          mentorshipId={mentorshipId as any}
          isCurrentUserMentor={isCurrentUserMentor}
          mentorshipStatus={mentorship?.status}
        />
      </div>

      {/* Modals — unchanged */}
      {mentorship.mentee && mentorship.topic && (
        <MentorshipClosureModal
          mentorshipId={mentorshipId as any}
          menteeName={mentorship.mentee.name}
          topic={mentorship.topic.name}
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
        />
      )}
      {mentorship.mentee && mentorship.topic && (
        <MentorshipCompletionModal
          mentorshipId={mentorshipId as any}
          menteeName={mentorship.mentee.name}
          topic={mentorship.topic.name}
          isOpen={isCompletionModalOpen}
          onClose={() => setIsCompletionModalOpen(false)}
        />
      )}
      {mentorship.status === "active" && currentProfile && (
        <MentorshipChatModal
          mentorshipId={mentorshipId as any}
          currentUserId={currentProfile._id}
          otherParticipant={
            isCurrentUserMentor
              ? { _id: mentorship.mentee!._id, name: mentorship.mentee!.name, role: mentorship.mentee!.role }
              : { _id: mentorship.mentor!._id, name: mentorship.mentor!.name, role: mentorship.mentor!.role }
          }
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
    </div>
  );
};

/* ── Participant card sub-component ── */
interface ProfileData {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  role: "mentor" | "mentee" | "both";
  professionalExperience?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  yearsOfExperience?: number;
  teachingExperience?: string;
  availability?: string;
}

const accentMap = {
  violet: {
    iconBg: "bg-violet-500/15 border border-violet-500/20",
    icon: "text-violet-400",
    badge: "bg-violet-500/15 border-violet-500/20 text-violet-400",
    link: "text-violet-400 hover:text-violet-300",
  },
  blue: {
    iconBg: "bg-blue-500/15 border border-blue-500/20",
    icon: "text-blue-400",
    badge: "bg-blue-500/15 border-blue-500/20 text-blue-400",
    link: "text-blue-400 hover:text-blue-300",
  },
};

function ParticipantCard({
  role,
  isYou,
  accentClass,
  profile,
  showTeaching,
  getExperienceLevel,
}: {
  role: "Mentor" | "Mentee";
  isYou: boolean;
  accentClass: "violet" | "blue";
  profile?: ProfileData;
  showTeaching: boolean;
  getExperienceLevel: (years?: number) => string;
}) {
  const accent = accentMap[accentClass];
  const RoleIcon = role === "Mentor" ? Award : User;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${accent.iconBg} rounded-xl flex items-center justify-center`}>
            <RoleIcon className={`h-4 w-4 ${accent.icon}`} />
          </div>
          <span className="text-sm font-semibold text-white/70">{role}</span>
        </div>
        {isYou && (
          <span className={`text-xs px-2.5 py-1 rounded-full border ${accent.badge} font-medium`}>
            You
          </span>
        )}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        {profile && (
          <GlobalAvatar
            user={{ name: profile.name, role: profile.role }}
            size="lg"
            clickable={false}
          />
        )}
        <div>
          <h3 className="text-lg font-bold text-white">{profile?.name}</h3>
          <p className="text-sm text-white/40">{profile?.email}</p>
          {profile?.yearsOfExperience && (
            <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {getExperienceLevel(profile.yearsOfExperience)}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">About</p>
          <p className="text-sm text-white/60 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Professional experience */}
      {profile?.professionalExperience && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">Experience</p>
          <p className="text-sm text-white/60 leading-relaxed">{profile.professionalExperience}</p>
        </div>
      )}

      {/* Teaching experience (mentor only) */}
      {showTeaching && profile?.teachingExperience && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">Teaching</p>
          <p className="text-sm text-white/60 leading-relaxed">{profile.teachingExperience}</p>
        </div>
      )}

      {/* Availability (mentor only) */}
      {showTeaching && profile?.availability && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Availability
          </p>
          <p className="text-sm text-white/60">{profile.availability}</p>
        </div>
      )}

      {/* Links */}
      {(profile?.portfolioUrl || profile?.githubUrl || profile?.linkedinUrl) && (
        <div className="pt-3 border-t border-white/8 flex flex-wrap gap-4">
          {profile?.portfolioUrl && (
            <a
              href={profile.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-sm transition-colors ${accent.link}`}
            >
              <Globe className="h-4 w-4" />
              Portfolio
            </a>
          )}
          {profile?.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          )}
          {profile?.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-sm transition-colors ${accent.link}`}
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default MentorshipPage;
