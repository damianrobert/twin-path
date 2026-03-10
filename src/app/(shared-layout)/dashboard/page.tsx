"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DashboardPage = () => {
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

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
            <CardTitle>My Profile</CardTitle>
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

        {(currentProfile.role === "mentor" || currentProfile.role === "both") && (
          <Card>
            <CardHeader>
              <CardTitle>My Mentorships</CardTitle>
              <CardDescription>
                View and manage your active mentorships
              </CardDescription>
            </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
        )}

        {(currentProfile.role === "mentee" || currentProfile.role === "both") && (
          <Card>
            <CardHeader>
              <CardTitle>Find Mentors</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Your conversations with mentors and mentees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
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
