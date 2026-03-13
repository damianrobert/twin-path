import React from "react";
import { cn } from "@/lib/utils";
import { formatLastSeen } from "@/hooks/usePresence";

interface PresenceIndicatorProps {
  isOnline: boolean;
  lastSeen?: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  isOnline,
  lastSeen,
  size = "md",
  showText = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Only show indicator when user is online
  if (!isOnline) {
    return showText ? (
      <span className={cn("text-muted-foreground", textSizes[size], className)}>
        {formatLastSeen(lastSeen)}
      </span>
    ) : null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-full bg-green-500",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-500 animate-ping",
            sizeClasses[size]
          )}
        />
      </div>
      {showText && (
        <span className={cn("text-muted-foreground", textSizes[size])}>
          Online
        </span>
      )}
    </div>
  );
};

// User presence component that combines user info with presence
interface UserPresenceProps {
  userName: string;
  isOnline: boolean;
  lastSeen?: number;
  avatar?: string;
  showStatusText?: boolean;
  className?: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  userName,
  isOnline,
  lastSeen,
  avatar,
  showStatusText = true,
  className = "",
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        {avatar ? (
          <img
            src={avatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Only show presence indicator when user is online */}
        {isOnline && (
          <div className="absolute -bottom-1 -right-1">
            <PresenceIndicator isOnline={isOnline} size="sm" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{userName}</p>
        {showStatusText && (
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Online" : formatLastSeen(lastSeen)}
          </p>
        )}
      </div>
    </div>
  );
};
