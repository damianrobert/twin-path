import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UsePresenceOptions {
  heartbeatInterval?: number; // in milliseconds
  enableHeartbeat?: boolean;
}

export const usePresence = (options: UsePresenceOptions = {}) => {
  const {
    heartbeatInterval = 30000, // 30 seconds default
    enableHeartbeat = true,
  } = options;

  const updateOnlineStatus = useMutation(api.presence.updateOnlineStatus);
  const heartbeatMutation = useMutation(api.presence.heartbeat);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set user as online when component mounts
  useEffect(() => {
    const setOnline = async () => {
      try {
        await updateOnlineStatus({ isOnline: true });
      } catch (error) {
        console.error("Failed to set online status:", error);
      }
    };

    setOnline();

    // Set up heartbeat to keep user online
    if (enableHeartbeat) {
      intervalRef.current = setInterval(async () => {
        try {
          await heartbeatMutation();
        } catch (error) {
          console.error("Heartbeat failed:", error);
        }
      }, heartbeatInterval);
    }

    // Cleanup: set user as offline when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      const setOffline = async () => {
        try {
          await updateOnlineStatus({ isOnline: false });
        } catch (error) {
          console.error("Failed to set offline status:", error);
        }
      };

      setOffline();
    };
  }, [updateOnlineStatus, heartbeatMutation, heartbeatInterval, enableHeartbeat]);

  return {
    updateOnlineStatus,
    heartbeat: heartbeatMutation,
  };
};

// Hook to get online status of a specific user
export const useUserOnlineStatus = (userId: string) => {
  const status = useQuery(api.presence.getOnlineStatus, { userId });
  
  if (!status) {
    return { isOnline: false, lastSeen: undefined };
  }

  return status;
};

// Hook to get online status of multiple users
export const useMultipleOnlineStatus = (userIds: string[]) => {
  const statuses = useQuery(api.presence.getMultipleOnlineStatus, { userIds });
  
  return statuses || {};
};

// Helper function to format last seen time
export const formatLastSeen = (lastSeen?: number): string => {
  if (!lastSeen) return "Unknown";
  
  const now = Date.now();
  const diff = now - lastSeen;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};
