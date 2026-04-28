"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Users, Clock, Search, GraduationCap, Play } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const difficultyPill = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":     return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "intermediate": return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    case "advanced":     return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
    default:             return "bg-white/[0.06] border border-white/15 text-white/40";
  }
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const router = useRouter();

  const courses = useQuery(api.courses.getPublishedCourses, { limit: 50 });
  const topics = useQuery(api.topics.getAllTopics);
  const enrollInCourse = useMutation(api.courses.enrollInCourse);
  const userEnrollments = useQuery(api.courses.getUserEnrollments);
  const currentUser = useQuery(api.users.getCurrentProfile);

  if (courses === undefined || topics === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  const enrolledMap = new Map(
    ((userEnrollments as any[]) || []).map((e: any) => [e.courseId, e])
  );

  const filteredCourses = ((courses as any[]) || []).filter((course: any) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty;
    const matchesTopic = selectedTopic === "all" || course.topic?._id === selectedTopic;
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse({ courseId: courseId as any });
      toast.success("Enrolled! Let's start learning.");
      router.push(`/courses/${courseId}/learn`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enroll");
      setEnrollingId(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">Courses</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Learn from{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Expert Mentors
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Structured courses created by experienced mentors — go from beginner to confident.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-10 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full md:w-44 bg-white/5 border-white/10 text-white rounded-xl h-10">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
              <SelectItem value="all" className="focus:bg-white/5">All Levels</SelectItem>
              <SelectItem value="beginner" className="focus:bg-white/5">Beginner</SelectItem>
              <SelectItem value="intermediate" className="focus:bg-white/5">Intermediate</SelectItem>
              <SelectItem value="advanced" className="focus:bg-white/5">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full md:w-44 bg-white/5 border-white/10 text-white rounded-xl h-10">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
              <SelectItem value="all" className="focus:bg-white/5">All Topics</SelectItem>
              {((topics as any[]) || []).map((topic: any) => (
                <SelectItem key={topic._id} value={topic._id} className="focus:bg-white/5">
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-7 w-7 text-white/25" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
            <p className="text-white/40">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course: any) => {
              const enrollment = enrolledMap.get(course._id);
              const isEnrolled = !!enrollment;
              const isInstructor = currentUser && course.instructorId === (currentUser as any)._id;
              const progress = (enrollment as any)?.progress || 0;

              return (
                <div
                  key={course._id}
                  className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                >
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${difficultyPill(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    {course.topic && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400">
                        {course.topic.name}
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <Link href={`/courses/${course._id}`}>
                    <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-2 leading-snug hover:text-violet-300 transition-colors cursor-pointer">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-white/40 text-sm line-clamp-3 leading-relaxed mb-4">
                    {course.description}
                  </p>

                  {/* Objectives preview */}
                  {course.learningObjectives && course.learningObjectives.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-2">You'll learn</p>
                      <ul className="space-y-1">
                        {course.learningObjectives.slice(0, 2).map((obj: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-white/40">
                            <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                            <span className="line-clamp-1">{obj}</span>
                          </li>
                        ))}
                        {course.learningObjectives.length > 2 && (
                          <li className="text-xs text-violet-400/60 pl-3">+{course.learningObjectives.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Progress bar for enrolled */}
                  {isEnrolled && !isInstructor && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/35">Progress</span>
                        <span className="text-xs font-semibold text-white/55">{progress}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/30 mb-5 flex-1">
                    {course.enrollmentCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{course.enrollmentCount}</span>
                      </div>
                    )}
                    {course.estimatedDuration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{Math.round(course.estimatedDuration / 60)}h</span>
                      </div>
                    )}
                    {course.instructor && <span className="truncate">by {course.instructor.name}</span>}
                  </div>

                  {/* CTA */}
                  {isInstructor ? (
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center mt-auto">
                      <p className="text-xs text-white/40">Your course</p>
                      <Link href="/dashboard/courses" className="text-xs text-violet-400/80 hover:text-violet-400 transition-colors">
                        Manage in Studio →
                      </Link>
                    </div>
                  ) : isEnrolled ? (
                    <Link href={`/courses/${course._id}/learn`} className="mt-auto">
                      <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 transition-colors">
                        <Play className="h-4 w-4" />
                        {progress > 0 ? "Resume Learning" : "Start Learning"}
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrollingId === course._id}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors mt-auto disabled:opacity-60"
                    >
                      {enrollingId === course._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><GraduationCap className="h-4 w-4" /> Enroll for Free</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
