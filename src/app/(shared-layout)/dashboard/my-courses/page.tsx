"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, Users, Clock, Play, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";

export default function MyCoursesPage() {
  const userEnrollments = useQuery(api.courses.getUserEnrollments) || [];

  if (userEnrollments === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress === 100) return "bg-green-100 text-green-800";
    if (progress > 0) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (progress: number) => {
    if (progress === 100) return "Completed";
    if (progress > 0) return "In Progress";
    return "Not Started";
  };

  if (userEnrollments.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">Courses you're enrolled in will appear here</p>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your learning journey by enrolling in courses
            </p>
            <Link href="/courses">
              <Button>Discover Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-muted-foreground">Track your learning progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userEnrollments.map((enrollment: any) => {
          // Ensure course and modules exist
          if (!enrollment.course) return null;
          
          const course = enrollment.course;
          const modules = course.modules || [];
          
          return (
            <Card key={enrollment._id} className="hover:shadow-lg transition-shadow">
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
                  <Badge className={getStatusColor(enrollment.progress)}>
                    {getStatusText(enrollment.progress)}
                  </Badge>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    {course.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </div>

                  {/* Course Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{modules.length} modules</span>
                    </div>
                    {course.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(course.estimatedDuration / 60)}h</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor Info */}
                  {course.instructor && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Instructor: </span>
                      <span className="font-medium">{course.instructor.name}</span>
                    </div>
                  )}

                  {/* Completed Modules */}
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      {(enrollment.completedModules && enrollment.completedModules.length > 0) ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>
                        {(enrollment.completedModules?.length || 0)} of {modules.length} modules completed
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/courses/${course._id}`}>
                    <Button className="w-full">
                      {enrollment.progress > 0 ? "Continue Learning" : "Start Course"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}
