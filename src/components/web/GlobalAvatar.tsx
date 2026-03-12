"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

interface GlobalAvatarProps {
  /** User data - if not provided, will use current user */
  user?: {
    name: string;
    role?: "mentor" | "mentee" | "both";
    image?: string;
  };
  /** User ID to fetch user data */
  userId?: string;
  /** Avatar size */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Whether to make it clickable and link to profile */
  clickable?: boolean;
  /** Custom initials override */
  initials?: string;
}

const GlobalAvatar: React.FC<GlobalAvatarProps> = ({ 
  user, 
  userId, 
  size = "md", 
  className = "",
  clickable = true,
  initials: customInitials
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentProfile = useQuery(api.users.getCurrentProfile);

  // Determine which user data to use
  const userData = user || currentProfile;
  
  if (!userData || isLoading) {
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

  // Generate initials from name or use custom initials
  const initials = customInitials || userData.name
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  // Get role-specific border styling
  const getRoleBorderClass = (role: string) => {
    switch (role) {
      case "mentor":
        return "border-4 border-purple-500";
      case "mentee":
        return "border-4 border-yellow-500";
      case "both":
        return "border-4 border-l-purple-500 border-r-yellow-500 border-t-purple-500 border-b-yellow-500";
      default:
        return "border-4 border-gray-500";
    }
  };

  const roleBorderClass = getRoleBorderClass(userData.role || "mentee");

  const avatarContent = (
    <Avatar className={`${sizeClasses[size]} ${className} ${roleBorderClass} cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all duration-200`}>
      <AvatarFallback className={`${textSizes[size]} font-medium bg-primary text-primary-foreground`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  // If not clickable, return just the avatar
  if (!clickable) {
    return avatarContent;
  }

  // Determine profile link (for now, only current user profile)
  const profileLink = "/profile";

  return (
    <Link href={profileLink} className="block">
      {avatarContent}
    </Link>
  );
};

export default GlobalAvatar;
