"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

interface UserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className, size = "md" }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentProfile = useQuery(api.users.getCurrentProfile);

  if (!isAuthenticated || isLoading || !currentProfile) {
    return null;
  }

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Generate initials from name
  const initials = currentProfile.name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  // Get role-specific border styling
  const getRoleBorderClass = (role: string) => {
    switch (role) {
      case "mentor":
        return "border-4 border-purple-500";
      case "mentee":
        return "border-4 border-blue-900";
      case "both":
        return "border-4 border-l-purple-500 border-r-blue-900 border-t-purple-500 border-b-blue-900";
      default:
        return "border-4 border-gray-500";
    }
  };

  const roleBorderClass = getRoleBorderClass(currentProfile.role || "mentee");

  return (
    <Link href="/profile" className="block">
      <Avatar className={`${sizeClasses[size]} ${className} ${roleBorderClass} cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all duration-200`}>
        <AvatarFallback className={`${textSizes[size]} font-medium bg-primary text-primary-foreground`}>
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
};

export default UserAvatar;
