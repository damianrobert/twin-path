"use client";

import React, { useEffect } from "react";
import { usePresence } from "@/hooks/usePresence";

interface PresenceProviderProps {
  children: React.ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  // Initialize presence tracking for the entire app
  usePresence({
    heartbeatInterval: 30000, // 30 seconds
    enableHeartbeat: true,
  });

  return <>{children}</>;
};
