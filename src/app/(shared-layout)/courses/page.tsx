"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Users, Clock, Search, Star, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  const courses = useQuery(api.courses.getPublishedCourses, { limit: 50 }) || [];
  const topics = useQuery(api.topics.getAllTopics) || [];
  const enrollInCourse = useMutation(api.courses.enrollInCourse);
  const userEnrollments = useQuery(api.courses.getUserEnrollments) || [];

  const enrolledCourseIds = new Set(userEnrollments.map((e: any) => e.courseId));

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty;
    
    const matchesTopic = selectedTopic === "all" || course.topic?._id === selectedTopic;

    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const handleEnroll = async (courseId: any) => {
    try {
      await enrollInCourse({ courseId });
      toast.success("Successfully enrolled in the course!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enroll in course");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (courses === undefined || topics === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Discover Courses</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Learn from experienced mentors and take your skills to the next level with our comprehensive courses
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-6 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((topic: any) => (
              <SelectItem key={topic._id} value={topic._id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find courses that match your interests
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const isEnrolled = enrolledCourseIds.has(course._id);
            
            return (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    {course.rating && course.rating > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {course.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Course Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {course.topic && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.topic.name}</span>
                        </div>
                      )}
                      {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrollmentCount} students</span>
                        </div>
                      )}
                      {course.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(course.estimatedDuration / 60)}h</span>
                        </div>
                      )}
                    </div>

                    {/* Instructor Info */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="font-medium">{course.instructor.name}</span>
                        {course.instructor.professionalExperience && (
                          <span className="text-muted-foreground">
                            • {course.instructor.professionalExperience}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Learning Objectives Preview */}
                    {course.learningObjectives && course.learningObjectives.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">What you'll learn:</p>
                        <ul className="text-muted-foreground space-y-1">
                          {course.learningObjectives.slice(0, 2).map((objective: string, index: number) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span className="line-clamp-1">{objective}</span>
                            </li>
                          ))}
                          {course.learningObjectives.length > 2 && (
                            <li className="text-primary">+{course.learningObjectives.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {isEnrolled ? (
                        <Link href={`/courses/${course._id}`} className="flex-1">
                          <Button className="w-full">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleEnroll(course._id)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Enroll for Free
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
