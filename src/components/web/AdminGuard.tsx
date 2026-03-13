"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useConvexErrorHandler } from "../../hooks/useConvexErrorHandler";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const router = useRouter();
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);
  const [error, setError] = useState<string | null>(null);
  
  // Use the Convex error handler - ALWAYS call this hook first
  useConvexErrorHandler();

  // Auto-redirect if access was revoked
  useEffect(() => {
    if (error === "access_revoked") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000); // Redirect after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error, router]);

  // Handle admin access check
  useEffect(() => {
    if (isAdmin === false) {
      setError("access_denied");
    } else if (isAdmin === undefined) {
      // Still loading, do nothing
    } else {
      // Admin access confirmed, clear any previous errors
      setError(null);
    }
  }, [isAdmin]);

  // Listen for admin access lost events
  useEffect(() => {
    const handleAccessLost = () => {
      setError("access_revoked");
    };

    window.addEventListener('admin-access-lost', handleAccessLost);
    
    return () => {
      window.removeEventListener('admin-access-lost', handleAccessLost);
    };
  }, []);

  // Calculate what to render after all hooks are called
  const shouldShowLoading = isAdmin === undefined && !error;
  const shouldShowError = error || isAdmin === false;

  // Show loading state
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show custom fallback or default error UI
  if (shouldShowError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {error === "access_revoked" ? (
                  <AlertTriangle className="h-12 w-12 text-orange-500" />
                ) : (
                  <Shield className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <CardTitle className="text-xl">
                {error === "access_revoked" ? "Admin Access Revoked" : "Access Denied"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error === "access_revoked" 
                  ? "Your admin access has been revoked. You no longer have permission to access this area."
                  : "You don't have admin privileges to access this area."
                }
              </p>
              
              {error === "access_revoked" && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    You have been automatically redirected to your dashboard.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                {error === "access_denied" && (
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-initial"
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin access confirmed, render children
  return <>{children}</>;
}
