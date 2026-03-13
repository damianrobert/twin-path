"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  setMaintenanceMode: (enabled: boolean, message?: string) => void;
  checkMaintenanceStatus: () => Promise<boolean>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Immediately clear any maintenance cookie on page load to prevent loops
  useEffect(() => {
    // Force clear the cookie immediately when context loads
    document.cookie = "maintenance-mode=; path=/; max-age=0; samesite=strict; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    console.log("Maintenance cookie cleared on context load");
  }, []);
  
  // Fetch platform settings from database
  const platformSettingsQuery = useQuery(api.platformSettings.getPlatformSettings);
  const isLoading = platformSettingsQuery === undefined;
  const platformSettings = platformSettingsQuery;
  const updateMaintenanceModeMutation = useMutation(api.platformSettings.updateMaintenanceMode);
  
  // Set initial state from database
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "Platform is currently under maintenance. Please check back later."
  );

  // Update local state when database data changes
  useEffect(() => {
    if (platformSettings) {
      setIsMaintenanceMode(platformSettings.maintenanceMode);
      setMaintenanceMessage(platformSettings.maintenanceMessage);
      
      // Update cookie for middleware - clear when disabled
      if (platformSettings.maintenanceMode) {
        document.cookie = "maintenance-mode=true; path=/; max-age=3600; samesite=strict";
      } else {
        // Clear the maintenance cookie completely
        document.cookie = "maintenance-mode=; path=/; max-age=0; samesite=strict; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, [platformSettings]);

  // Check maintenance status on mount and more frequently
  useEffect(() => {
    // Database query will handle real-time updates
    const interval = setInterval(() => {
      // Refetch will trigger automatic updates
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for storage events from other tabs (legacy support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "platformSettings") {
        // Legacy localStorage support - will be phased out
        console.log("Legacy localStorage change detected");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Listen for custom maintenance events (legacy support)
  useEffect(() => {
    const handleMaintenanceEvent = (e: CustomEvent) => {
      if (e.detail?.maintenanceMode !== undefined) {
        // Update via database instead of direct state change
        setMaintenanceMode(e.detail.maintenanceMode, e.detail.message);
      }
    };

    window.addEventListener("maintenance-changed", handleMaintenanceEvent as EventListener);
    
    return () => {
      window.removeEventListener("maintenance-changed", handleMaintenanceEvent as EventListener);
    };
  }, []);

  // Redirect to maintenance page if maintenance mode is enabled (but not for admins)
  useEffect(() => {
    if (isMaintenanceMode && !isLoading) {
      // Check if current user is admin before redirecting
      const isAdminUser = window.location.pathname.includes("/admin") || 
                       localStorage.getItem("userRole") === "admin";
      
      // Only redirect non-admin users and only if not already on maintenance page
      // Also exclude auth pages from redirect
      const isAuthPage = window.location.pathname.includes("/auth/");
      const isMaintenancePage = window.location.pathname === "/maintenance";
      
      if (!isAdminUser && !isAuthPage && !isMaintenancePage) {
        console.log("Redirecting to maintenance page");
        router.push("/maintenance");
      }
    }
  }, [isMaintenanceMode, router, isLoading]);

  const checkMaintenanceStatus = async (): Promise<boolean> => {
    // This function is kept for compatibility but now uses database
    return isMaintenanceMode;
  };

  const setMaintenanceMode = async (enabled: boolean, message?: string) => {
    const newMessage = message || "Platform is currently under maintenance. Please check back later.";
    
    try {
      // Update database
      await updateMaintenanceModeMutation({
        maintenanceMode: enabled,
        maintenanceMessage: newMessage,
      });
      
      // Dispatch custom event for same-tab listeners (legacy support)
      window.dispatchEvent(new CustomEvent("maintenance-changed", {
        detail: { maintenanceMode: enabled, message: newMessage }
      }));
      
      // Show appropriate toast messages
      if (enabled) {
        const isAdminUser = window.location.pathname.includes("/admin") || 
                         localStorage.getItem("userRole") === "admin";
        
        if (!isAdminUser && !window.location.pathname.includes("/auth/")) {
          toast.warning("Maintenance mode has been enabled. You will be logged out shortly.", {
            duration: 5000,
          });
          
          // Log out current user after a short delay
          setTimeout(() => {
            window.location.href = "/api/auth/logout";
          }, 3000);
        } else {
          toast.success("Maintenance mode has been enabled.", {
            duration: 3000,
          });
        }
      } else {
        toast.success("Maintenance mode has been disabled.");
      }
    } catch (error) {
      console.error("Failed to update maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    }
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        maintenanceMessage,
        setMaintenanceMode,
        checkMaintenanceStatus,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
}
