"use client";

import { useEffect } from "react";

export function useConvexErrorHandler() {
  useEffect(() => {
    const handleConvexError = (event: any) => {
      const error = event.detail?.error;
      
      // Check for admin access errors
      if (error?.message?.includes("Unauthorized: Admin access required") ||
          error?.message?.includes("Admin access required")) {
        
        // Prevent the error from showing in console
        event.preventDefault();
        
        // Dispatch custom event for AdminGuard to handle
        window.dispatchEvent(new CustomEvent('admin-access-lost', {
          detail: { error: error.message }
        }));
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      const error = event.reason;
      
      if (error?.message?.includes("Unauthorized: Admin access required") ||
          error?.message?.includes("Admin access required")) {
        
        // Prevent the error from showing
        event.preventDefault();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('admin-access-lost', {
          detail: { error: error.message }
        }));
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    };

    // Handle regular console errors
    const handleError = (event: any) => {
      const error = event.error;
      
      if (error?.message?.includes("Unauthorized: Admin access required") ||
          error?.message?.includes("Admin access required")) {
        
        // Prevent the error from showing
        event.preventDefault();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('admin-access-lost', {
          detail: { error: error.message }
        }));
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    };

    window.addEventListener('convex-error', handleConvexError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('convex-error', handleConvexError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}
