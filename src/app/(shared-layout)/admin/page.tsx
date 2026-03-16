"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Users, 
  Settings,
  ArrowRight,
  Shield,
  Headphones,
  Bell
} from "lucide-react";
import Link from "next/link";
import { useConvexErrorHandler } from "../../../hooks/useConvexErrorHandler";

export default function AdminHomePage() {
  const router = useRouter();
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);
  const pendingReports = useQuery(api.blogReports.getPendingReports);
  const adminUsers = useQuery(api.admin.getAdminUsers);
  const allUsers = useQuery(api.admin.getAllUsers);
  const supportStats = useQuery(api.supportCases.getSupportCaseStatistics);
  
  // Handle admin access errors - ALWAYS call this hook
  useConvexErrorHandler();

  // Calculate render conditions after all hooks are called
  const shouldShowAccessDenied = isAdmin === false;
  const shouldShowLoading = isAdmin === undefined;

  // Show access denied
  if (shouldShowAccessDenied) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access this area.
          </p>
          <Link href="/dashboard">
            <Button>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading
  if (shouldShowLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const adminCards = [
    {
      title: "Blog Reports",
      description: "Review and manage user-reported blog posts",
      icon: AlertTriangle,
      href: "/admin/blog-reports",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "User Management",
      description: "Manage admin rights and user accounts",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Settings",
      description: "Platform settings and configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      disabled: false,
    },
    {
      title: "Support Cases",
      description: "Manage user support requests",
      icon: Headphones,
      href: "/admin/support",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      disabled: false,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your TwinPath platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          const openCasesCount = card.title === "Support Cases" ? supportStats?.opened || 0 : 0;
          
          return (
            <Card 
              key={card.title} 
              className={`hover:shadow-lg transition-shadow cursor-pointer relative ${
                card.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => !card.disabled && router.push(card.href)}
            >
              {card.title === "Support Cases" && openCasesCount > 0 && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    {openCasesCount}
                  </div>
                </div>
              )}
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {card.title}
                  {card.disabled && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {card.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={card.disabled}
                >
                  {card.disabled ? "Coming Soon" : (
                    <>
                      Manage
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {pendingReports?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending Reports</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {adminUsers?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Admin Users</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allUsers?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {supportStats?.opened || 0}
                </div>
                <div className="text-sm text-muted-foreground">Open Cases</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {supportStats?.inProgress || 0}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {supportStats?.resolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {supportStats?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Cases</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {supportStats?.byPriority?.urgent || 0}
                </div>
                <div className="text-sm text-muted-foreground">Urgent Cases</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
