"use client";

import React, { useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import MentorProfileModal from "@/components/web/MentorProfileModal";
import MentorshipRequestModal from "@/components/web/MentorshipRequestModal";
import {
  Search,
  Filter,
  Briefcase,
  MessageCircle,
  User,
  Clock,
  X,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import GlobalAvatar from "@/components/web/GlobalAvatar";

interface Mentor {
  _id: Id<"users">;
  name: string;
  bio?: string;
  role: "mentor" | "mentee" | "both";
  professionalExperience?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  yearsOfExperience?: number;
  teachingExperience?: string;
  availability?: string;
  topics?: Array<{
    topic: { _id: Id<"topics">; name: string; description?: string };
    type: "expertise" | "interest";
    skillLevel?: string;
  }>;
}

const experienceRanges = [
  { label: "0-2 yrs", value: "0-2" },
  { label: "3-5 yrs", value: "3-5" },
  { label: "6-10 yrs", value: "6-10" },
  { label: "10+ yrs", value: "10+" },
];

const availabilityOptions = ["Weekdays", "Weekends", "Evenings", "Flexible"];

const MentorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<Mentor | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentProfile);
  const mentors = useQuery(api.users.getMentors);
  const allTopicsQuery = useQuery(api.topics.getAllTopics);
  const allUserTopics = useQuery(api.users.getAllUserTopics) || [];
  const userMentorships = useQuery(api.mentorships.getUserMentorships);

  const userTopicsMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    allUserTopics.forEach((ut) => {
      if (!map.has(ut.userId)) map.set(ut.userId, []);
      map.get(ut.userId)!.push(ut);
    });
    return map;
  }, [allUserTopics]);

  const mentorsWithTopics = React.useMemo(() => {
    if (!mentors) return [];
    const activeMentorIds = userMentorships
      ? userMentorships.filter((m) => m.status === "active").map((m) => m.mentorId)
      : [];
    return mentors
      .filter((m) => {
        if (currentUser && m._id === currentUser._id) return false;
        if (activeMentorIds.includes(m._id)) return false;
        return true;
      })
      .map((m) => ({ ...m, topics: userTopicsMap.get(m._id) || [] }));
  }, [mentors, userTopicsMap, currentUser, userMentorships]);

  const filteredMentors = React.useMemo(() => {
    return mentorsWithTopics.filter((mentor) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        mentor.name.toLowerCase().includes(q) ||
        mentor.bio?.toLowerCase().includes(q) ||
        mentor.topics?.some((ut: any) => ut.topic?.name.toLowerCase().includes(q));

      const matchesTopics =
        selectedTopics.length === 0 ||
        mentor.topics?.some((ut: any) => selectedTopics.includes(ut.topic?._id));

      const yoe = mentor.yearsOfExperience;
      const matchesExperience =
        !experienceFilter ||
        (experienceFilter === "0-2" && yoe != null && yoe <= 2) ||
        (experienceFilter === "3-5" && yoe != null && yoe >= 3 && yoe <= 5) ||
        (experienceFilter === "6-10" && yoe != null && yoe >= 6 && yoe <= 10) ||
        (experienceFilter === "10+" && yoe != null && yoe > 10);

      const matchesAvailability =
        !availabilityFilter ||
        mentor.availability?.toLowerCase().includes(availabilityFilter.toLowerCase());

      return matchesSearch && matchesTopics && matchesExperience && matchesAvailability;
    });
  }, [mentorsWithTopics, searchTerm, selectedTopics, experienceFilter, availabilityFilter]);

  const activeFilterCount =
    selectedTopics.length + (experienceFilter ? 1 : 0) + (availabilityFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTopics([]);
    setExperienceFilter("");
    setAvailabilityFilter("");
  };

  if (mentors === undefined || allTopicsQuery === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">
            Mentors
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Mentor Match
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Connect with experienced professionals who can guide you through your career journey.
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="max-w-3xl mx-auto mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, expertise, or bio…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
                showFilters
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/8"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-violet-500/30 border border-violet-500/40 text-violet-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/35 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Topics */}
              <div>
                <p className="text-xs text-white/35 uppercase tracking-widest mb-3 font-semibold">
                  Expertise Areas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allTopicsQuery.map((topic) => {
                    const active = selectedTopics.includes(topic._id);
                    return (
                      <button
                        key={topic._id}
                        onClick={() =>
                          setSelectedTopics((prev) =>
                            active ? prev.filter((id) => id !== topic._id) : [...prev, topic._id]
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-violet-500/25 border-violet-500/40 text-violet-300"
                            : "bg-white/5 border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {topic.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience */}
              <div>
                <p className="text-xs text-white/35 uppercase tracking-widest mb-3 font-semibold">
                  Experience
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {experienceRanges.map(({ label, value }) => {
                    const active = experienceFilter === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setExperienceFilter(active ? "" : value)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-blue-500/25 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div>
                <p className="text-xs text-white/35 uppercase tracking-widest mb-3 font-semibold">
                  Availability
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availabilityOptions.map((opt) => {
                    const val = opt.toLowerCase();
                    const active = availabilityFilter === val;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAvailabilityFilter(active ? "" : val)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-emerald-500/25 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-center text-white/35 text-sm mb-8">
          <span className="text-white font-semibold">{filteredMentors.length}</span>{" "}
          mentor{filteredMentors.length !== 1 ? "s" : ""} found
        </p>

        {/* Mentor grid */}
        {filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor._id}
                mentor={mentor}
                isAuthenticated={isAuthenticated}
                onConnect={() => {
                  setSelectedMentorForRequest(mentor);
                  setIsRequestModalOpen(true);
                }}
                onViewProfile={() => {
                  setSelectedMentor(mentor);
                  setIsProfileModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-20">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No mentors found</h3>
            <p className="text-white/35 text-sm max-w-sm mb-6">
              Try adjusting your search terms or filters to find more mentors.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-xl text-sm bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <MentorProfileModal
        mentor={selectedMentor}
        isOpen={isProfileModalOpen}
        onClose={() => { setIsProfileModalOpen(false); setSelectedMentor(null); }}
      />
      <MentorshipRequestModal
        mentor={selectedMentorForRequest}
        isOpen={isRequestModalOpen}
        onClose={() => { setIsRequestModalOpen(false); setSelectedMentorForRequest(null); }}
      />
    </div>
  );
};

/* ── Mentor card ── */
function MentorCard({
  mentor,
  isAuthenticated,
  onConnect,
  onViewProfile,
}: {
  mentor: Mentor;
  isAuthenticated: boolean;
  onConnect: () => void;
  onViewProfile: () => void;
}) {
  const visibleTopics = mentor.topics?.slice(0, 3) ?? [];
  const extraTopics = (mentor.topics?.length ?? 0) - visibleTopics.length;

  return (
    <div className="group bg-white/[0.03] border border-white/10 rounded-3xl p-5 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex items-start gap-4">
        <GlobalAvatar
          user={{ name: mentor.name, role: mentor.role }}
          size="lg"
          clickable={false}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base leading-tight">{mentor.name}</h3>
          {mentor.yearsOfExperience != null && (
            <p className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
              <Briefcase className="h-3 w-3" />
              {mentor.yearsOfExperience} yr{mentor.yearsOfExperience !== 1 ? "s" : ""} experience
            </p>
          )}
          {mentor.availability && (
            <p className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
              <Clock className="h-3 w-3" />
              {mentor.availability}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {mentor.bio && (
        <p className="text-sm text-white/50 leading-relaxed line-clamp-3">{mentor.bio}</p>
      )}

      {/* Topics */}
      {visibleTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTopics.map((ut: any, i: number) => (
            <span
              key={`${mentor._id}-${ut.topic._id}-${i}`}
              className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs rounded-full"
            >
              {ut.topic.name}
            </span>
          ))}
          {extraTopics > 0 && (
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/30 text-xs rounded-full">
              +{extraTopics} more
            </span>
          )}
        </div>
      )}

      {/* Background snippet */}
      {mentor.professionalExperience && (
        <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">
          {mentor.professionalExperience}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2">
        {isAuthenticated && (
          <button
            onClick={onConnect}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-white text-black hover:bg-white/90 text-sm font-semibold rounded-xl transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
        <button
          onClick={onViewProfile}
          className="flex items-center justify-center gap-1.5 h-9 px-4 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm rounded-xl transition-colors"
        >
          <User className="h-3.5 w-3.5" />
          Profile
        </button>
      </div>
    </div>
  );
}

export default MentorsPage;
