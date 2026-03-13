"use client";

import React, { useEffect } from "react";
import { useMaintenance } from "../../contexts/MaintenanceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  Clock,
  Wrench
} from "lucide-react";

export default function MaintenancePage() {
  const { isMaintenanceMode, maintenanceMessage, checkMaintenanceStatus } = useMaintenance();

  // Check if maintenance mode is disabled and redirect
  useEffect(() => {
    if (!isMaintenanceMode) {
      window.location.href = "/";
    }
  }, [isMaintenanceMode]);

  const handleRefresh = () => {
    checkMaintenanceStatus();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Maintenance Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
            <Wrench className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Under Maintenance
          </h1>
          <p className="text-muted-foreground">
            We're working hard to improve your experience
          </p>
        </div>

        {/* Maintenance Message Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Platform Temporarily Unavailable
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceMessage}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>We expect to be back shortly</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Contact support if you need urgent assistance</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleRefresh} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = "mailto:support@twinpath.com"}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            This page will automatically refresh when maintenance is complete
          </p>
        </div>
      </div>
    </div>
  );
}
