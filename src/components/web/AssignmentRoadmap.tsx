"use client";

import React from "react";
import { Flag, CheckCircle2, Circle, Trophy } from "lucide-react";

interface AssignmentRoadmapProps {
  assignments: Array<{
    _id: string;
    status: "pending" | "in_progress" | "completed" | "reviewed";
    index: number;
    total: number;
  }>;
}

export default function AssignmentRoadmap({ assignments }: AssignmentRoadmapProps) {
  if (assignments.length === 0) return null;

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative flex items-center">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-muted top-1/2 transform -translate-y-1/2" />
        
        {/* Dashed Line Overlay */}
        <div 
          className="absolute left-0 h-0.5 bg-primary top-1/2 transform -translate-y-1/2 transition-all duration-500"
          style={{
            right: `${100 - (assignments.filter(a => a.status === "reviewed").length / assignments.length * 100)}%`,
            backgroundImage: 'repeating-linear-gradient(to right, currentColor 0px, currentColor 4px, transparent 4px, transparent 8px)',
          }}
        />
        
        {/* Assignment Points */}
        <div className="relative flex items-center justify-between w-full">
          {assignments.map((assignment, index) => {
            const isCompleted = assignment.status === "reviewed";
            const isCurrent = assignment.status === "completed" || assignment.status === "in_progress";
            const isFirst = index === 0;
            const isLast = index === assignments.length - 1;
            
            return (
              <div key={assignment._id} className="relative flex flex-col items-center">
                {/* Point */}
                <div className="relative z-10">
                  {isFirst && assignments.length === 1 ? (
                    // Single assignment - show trophy
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Trophy className="h-4 w-4" />
                    </div>
                  ) : isFirst ? (
                    // Start line
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Flag className="h-4 w-4" />
                    </div>
                  ) : isLast ? (
                    // Finish line
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Trophy className="h-4 w-4" />
                    </div>
                  ) : (
                    // Checkpoint
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-primary text-white' : isCurrent ? 'bg-primary/50 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isCurrent ? (
                        <Circle className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <div className="absolute top-10 text-xs text-muted-foreground whitespace-nowrap">
                  {isFirst && assignments.length === 1 ? (
                    "Complete"
                  ) : isFirst ? (
                    "Start"
                  ) : isLast ? (
                    "Finish"
                  ) : (
                    `Step ${index}`
                  )}
                </div>
                
                {/* Status indicator for current/active */}
                {isCurrent && !isCompleted && (
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
