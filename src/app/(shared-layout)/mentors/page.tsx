"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MentorProfileModal from "@/components/web/MentorProfileModal";
import MentorshipRequestModal from "@/components/web/MentorshipRequestModal";
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Star, 
  MessageCircle, 
  User,
  Clock,
  Award,
  X
} from "lucide-react";
import { Loader2 } from "lucide-react";

// Helper functions for avatar
const generateColorFromString = (str: string) => {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
    "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
    "bg-emerald-500", "bg-rose-500", "bg-violet-500", "bg-amber-500", "bg-lime-500", "bg-sky-500"
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return "?";
};

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
    topic: {
      _id: Id<"topics">;
      name: string;
      description?: string;
    };
    type: "expertise" | "interest";
    skillLevel?: string;
  }>;
}

const MentorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<Mentor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get current user to filter them out
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentProfile);

  // Fetch real mentors from database
  const mentors = useQuery(api.users.getMentors);
  const allTopicsQuery = useQuery(api.topics.getAllTopics);
  const allUserTopics = useQuery(api.users.getAllUserTopics) || [];
  const userMentorships = useQuery(api.mentorships.getUserMentorships);

  // Create a map of userId to topics for efficient lookup
  const userTopicsMap = React.useMemo(() => {
    const map = new Map();
    allUserTopics.forEach(userTopic => {
      if (!map.has(userTopic.userId)) {
        map.set(userTopic.userId, []);
      }
      map.get(userTopic.userId).push(userTopic);
    });
    return map;
  }, [allUserTopics]);

  // Combine mentors with their topics and filter out current user and mentors with active mentorships
  const mentorsWithTopics = React.useMemo(() => {
    if (!mentors) return [];
    
    // Get IDs of mentors with whom user has active mentorships
    const activeMentorIds = userMentorships
      ? userMentorships
          .filter(m => m.status === "active")
          .map(m => m.mentorId)
      : [];
    
    return mentors
      .filter(mentor => {
        // Filter out current user if they're a mentor
        if (currentUser && mentor._id === currentUser._id) return false;
        
        // Filter out mentors with whom user already has active mentorships
        if (activeMentorIds.includes(mentor._id)) return false;
        
        return true;
      })
      .map(mentor => ({
        ...mentor,
        topics: userTopicsMap.get(mentor._id) || []
      }));
  }, [mentors, userTopicsMap, currentUser, userMentorships]);

  // Create a combined list of all topics from mentors
  const allTopics = React.useMemo(() => {
    return Array.from(new Set(
      mentorsWithTopics.flatMap(mentor => mentor.topics?.map((userTopic: any) => userTopic.topic) || [])
    ));
  }, [mentorsWithTopics]);

  // Filter mentors based on search and filters
  const filteredMentors = React.useMemo(() => {
    return mentorsWithTopics.filter(mentor => {
      const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.topics?.some((userTopic: any) => 
                             userTopic.topic?.name.toLowerCase().includes(searchTerm.toLowerCase())
                           );

      const matchesTopics = selectedTopics.length === 0 ||
                           mentor.topics?.some((userTopic: any) => 
                             selectedTopics.includes(userTopic.topic?._id)
                           );

      const matchesExperience = !experienceFilter ||
                           (experienceFilter === "0-2" && mentor.yearsOfExperience! <= 2) ||
                           (experienceFilter === "3-5" && mentor.yearsOfExperience! >= 3 && mentor.yearsOfExperience! <= 5) ||
                           (experienceFilter === "6-10" && mentor.yearsOfExperience! >= 6 && mentor.yearsOfExperience! <= 10) ||
                           (experienceFilter === "10+" && mentor.yearsOfExperience! > 10);

      const matchesAvailability = !availabilityFilter ||
                           mentor.availability?.toLowerCase().includes(availabilityFilter.toLowerCase());

      return matchesSearch && matchesTopics && matchesExperience && matchesAvailability;
    });
  }, [mentorsWithTopics, searchTerm, selectedTopics, experienceFilter, availabilityFilter]);

  // Show loading state while fetching data
  if (mentors === undefined || allTopicsQuery === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTopics([]);
    setExperienceFilter("");
    setAvailabilityFilter("");
  };

  const handleConnectMentor = (mentor: Mentor) => {
    setSelectedMentorForRequest(mentor);
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedMentorForRequest(null);
  };

  const handleViewProfile = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedMentor(null);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Find Your Perfect Mentor
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with experienced professionals who can guide you through your career journey
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search mentors by name, expertise, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(selectedTopics.length > 0 || experienceFilter || availabilityFilter) && (
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground ml-1">
                {selectedTopics.length + (experienceFilter ? 1 : 0) + (availabilityFilter ? 1 : 0)}
              </div>
            )}
          </Button>
          {(selectedTopics.length > 0 || experienceFilter || availabilityFilter) && (
            <Button variant="ghost" onClick={clearFilters} className="ml-2">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Topics Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Expertise Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {allTopicsQuery.map(topic => (
                      <div
                        key={topic._id}
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${
                          selectedTopics.includes(topic._id) 
                            ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" 
                            : "text-foreground border-border hover:bg-primary/10"
                        }`}
                        onClick={() => handleTopicToggle(topic._id)}
                      >
                        {topic.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Years of Experience</h3>
                  <div className="space-y-2">
                    {["0-2", "3-5", "6-10", "10+"].map(range => (
                      <label key={range} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="experience"
                          value={range}
                          checked={experienceFilter === range}
                          onChange={(e) => setExperienceFilter(e.target.value)}
                          className="text-primary"
                        />
                        <span className="text-sm">{range} years</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Availability</h3>
                  <div className="space-y-2">
                    {["Weekdays", "Weekends", "Evenings", "Flexible"].map(availability => (
                      <label key={availability} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value={availability.toLowerCase()}
                          checked={availabilityFilter === availability.toLowerCase()}
                          onChange={(e) => setAvailabilityFilter(e.target.value)}
                          className="text-primary"
                        />
                        <span className="text-sm">{availability}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 text-center">
        <p className="text-muted-foreground">
          Found <span className="font-semibold text-foreground">{filteredMentors.length}</span> mentor{filteredMentors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map(mentor => (
          <Card key={mentor._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium ${generateColorFromString(mentor.name)}`}>
                  {getInitials(mentor.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{mentor.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {mentor.yearsOfExperience} years experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {mentor.availability}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {mentor.bio}
              </p>

              {/* Expertise Areas */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">Expertise Areas</h4>
                <div className="flex flex-wrap gap-1">
                  {mentor.topics?.slice(0, 3).map((topic: any, index: number) => (
                    <div key={`${mentor._id}-${topic.topic._id}-${index}`} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {topic.topic.name}
                    </div>
                  ))}
                  {mentor.topics && mentor.topics.length > 3 && (
                    <div key={`${mentor._id}-more-topics`} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground border-border">
                      +{mentor.topics.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Background */}
              {mentor.professionalExperience && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-1">Background</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {mentor.professionalExperience}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleConnectMentor(mentor)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Connect
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewProfile(mentor)}
                >
                  <User className="h-3 w-3 mr-1" />
                  Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredMentors.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters to find more mentors.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear all filters
            </Button>
          </div>
        </div>
      )}

      {/* Mentor Profile Modal */}
      <MentorProfileModal
        mentor={selectedMentor}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
      />

      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        mentor={selectedMentorForRequest}
        isOpen={isRequestModalOpen}
        onClose={handleCloseRequestModal}
      />
    </div>
  );
};

export default MentorsPage;
