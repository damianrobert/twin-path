"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Bell } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DashboardPage = () => {
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const userMentorships = useQuery(api.mentorships.getUserMentorships);
  const unseenMessageCount = useQuery(api.messages.getUnseenMessageCount) || { mentorshipUnseen: 0, dmUnseen: 0 };
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (currentProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Welcome to TwinPath
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete your profile to get started with mentorship
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Profile Required</CardTitle>
            <CardDescription>
              You need to create a profile before you can use the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button className="w-full">Create Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Welcome back, {currentProfile.name}!
        </h1>
        <p className="text-xl text-muted-foreground">
          Your mentorship dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>👤 My Profile</CardTitle>
            <CardDescription>
              Manage your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤝 My Mentorships</CardTitle>
            <CardDescription>
              {userMentorships && userMentorships.length > 0 
                ? `You have ${userMentorships.filter(m => m.status === "active").length} active mentorship(s)`
                : "View and manage your active mentorships"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mentorships">
              <Button variant="outline" className="w-full">
                View All Mentorships
              </Button>
            </Link>
          </CardContent>
        </Card>

        {(currentProfile.role === "mentee" || currentProfile.role === "both") && (
          <Card>
            <CardHeader>
              <CardTitle>🔍 Find Mentors</CardTitle>
              <CardDescription>
                Discover mentors in your areas of interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link className={clsx(buttonVariants({ variant: "outline" }), "w-full")} href="/mentors">
                Find your mentor
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="relative">
          {(() => {
            const totalUnseen = (unseenMessageCount?.mentorshipUnseen || 0) + (unseenMessageCount?.dmUnseen || 0);
            return (
              <>
                {totalUnseen > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      {totalUnseen}
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💬 Messages
                    {totalUnseen > 0 && (
                      <span className="text-blue-500 text-sm font-medium">
                        New
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {totalUnseen > 0 
                      ? `You have ${totalUnseen} unread message${totalUnseen === 1 ? '' : 's'}`
                      : "Your conversations with mentors and mentees"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/chat">
                    <Button variant="outline" className="w-full">
                      {totalUnseen > 0 ? "Read Messages" : "View Messages"}
                    </Button>
                  </Link>
                </CardContent>
              </>
            );
          })()}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📚 Topics</CardTitle>
            <CardDescription>
              Manage your expertise and learning interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/topics">
              <Button variant="outline" className="w-full">
                Manage Topics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>🎧 Support Cases</CardTitle>
            <CardDescription>
              Get help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/support">
              <Button variant="outline" className="w-full">
                View Support Cases
              </Button>
            </Link>
          </CardContent>
        </Card>
        )}

        {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>🚩 My Reports</CardTitle>
            <CardDescription>
              Track blog posts you've reported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reports">
              <Button variant="outline" className="w-full">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>🛡️ Admin Panel</CardTitle>
              <CardDescription>
                Manage platform administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin" className={clsx(buttonVariants({ variant: "outline" }), "w-full")}>
                Admin Dashboard
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Settings</CardTitle>
            <CardDescription>
              Account and platform settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
