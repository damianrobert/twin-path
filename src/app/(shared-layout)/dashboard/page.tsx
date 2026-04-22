"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Loader2,
  Bell,
  User,
  Users,
  Presentation,
  GraduationCap,
  Search,
  MessageCircle,
  Tag,
  Headphones,
  Flag,
  Shield,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  badge?: string;
  disabled?: boolean;
};

const DashboardPage = () => {
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const userMentorships = useQuery(api.mentorships.getUserMentorships);
  const unseenMessageCount = useQuery(api.messages.getUnseenMessageCount) || { mentorshipUnseen: 0, dmUnseen: 0 };
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (currentProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-violet-500/15 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="h-6 w-6 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Required</h2>
          <p className="text-white/45 mb-8">
            Complete your profile to get started with mentorship
          </p>
          <Link href="/profile">
            <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-8">
              Create Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeMentorships = userMentorships?.filter((m) => m.status === "active").length ?? 0;
  const totalUnseen =
    (unseenMessageCount?.mentorshipUnseen || 0) + (unseenMessageCount?.dmUnseen || 0);

  const isMentor = currentProfile.role === "mentor" || currentProfile.role === "both";
  const isMentee = currentProfile.role === "mentee" || currentProfile.role === "both";

  const cards: DashboardCard[] = [
    {
      title: "My Profile",
      description: "Manage your profile information",
      href: "/profile",
      icon: <User className="h-5 w-5 text-violet-400" />,
      gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/15 border border-violet-500/20",
    },
    {
      title: "My Mentorships",
      description:
        activeMentorships > 0
          ? `${activeMentorships} active mentorship${activeMentorships > 1 ? "s" : ""}`
          : "View and manage your active mentorships",
      href: "/mentorships",
      icon: <Users className="h-5 w-5 text-blue-400" />,
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/15 border border-blue-500/20",
    },
    ...(isMentor
      ? [
          {
            title: "Course Studio",
            description: "Publish and manage the courses you teach",
            href: "/dashboard/courses",
            icon: <Presentation className="h-5 w-5 text-pink-400" />,
            gradient: "from-pink-500/10 via-pink-500/5 to-transparent",
            iconBg: "bg-pink-500/15 border border-pink-500/20",
          },
        ]
      : []),
    ...(isMentee
      ? [
          {
            title: "My Learning",
            description: "View your enrolled courses and progress",
            href: "/dashboard/my-courses",
            icon: <GraduationCap className="h-5 w-5 text-emerald-400" />,
            gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
            iconBg: "bg-emerald-500/15 border border-emerald-500/20",
          },
          {
            title: "Find Mentors",
            description: "Discover mentors in your areas of interest",
            href: "/mentors",
            icon: <Search className="h-5 w-5 text-amber-400" />,
            gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
            iconBg: "bg-amber-500/15 border border-amber-500/20",
          },
        ]
      : []),
    {
      title: "Messages",
      description:
        totalUnseen > 0
          ? `${totalUnseen} unread message${totalUnseen > 1 ? "s" : ""}`
          : "Your conversations with mentors and mentees",
      href: "/chat",
      icon: <MessageCircle className="h-5 w-5 text-cyan-400" />,
      gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
      iconBg: "bg-cyan-500/15 border border-cyan-500/20",
      badge: totalUnseen > 0 ? String(totalUnseen) : undefined,
    },
    {
      title: "Topics",
      description: "Manage your expertise and learning interests",
      href: "/topics",
      icon: <Tag className="h-5 w-5 text-indigo-400" />,
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/15 border border-indigo-500/20",
    },
    ...(!isAdmin
      ? [
          {
            title: "Support Cases",
            description: "Get help from our support team",
            href: "/dashboard/support",
            icon: <Headphones className="h-5 w-5 text-teal-400" />,
            gradient: "from-teal-500/10 via-teal-500/5 to-transparent",
            iconBg: "bg-teal-500/15 border border-teal-500/20",
          },
          {
            title: "My Reports",
            description: "Track blog posts you've reported",
            href: "/dashboard/reports",
            icon: <Flag className="h-5 w-5 text-rose-400" />,
            gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
            iconBg: "bg-rose-500/15 border border-rose-500/20",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Admin Panel",
            description: "Manage platform administration",
            href: "/admin",
            icon: <Shield className="h-5 w-5 text-orange-400" />,
            gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
            iconBg: "bg-orange-500/15 border border-orange-500/20",
          },
        ]
      : []),
    {
      title: "Settings",
      description: "Account and platform settings — coming soon",
      href: "#",
      icon: <Settings className="h-5 w-5 text-white/25" />,
      gradient: "from-white/[0.02] to-transparent",
      iconBg: "bg-white/5 border border-white/10",
      disabled: true,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3">
            Dashboard
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              {currentProfile.name}
            </span>
          </h1>
          <p className="text-white/40 mt-3 text-lg">
            Your mentorship hub — everything in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) =>
            card.disabled ? (
              <div
                key={card.title}
                className={`relative bg-gradient-to-br ${card.gradient} border border-white/10 rounded-3xl p-7 opacity-40`}
              >
                <div className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{card.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{card.description}</p>
              </div>
            ) : (
              <Link key={card.title} href={card.href}>
                <div
                  className={`group relative bg-gradient-to-br ${card.gradient} border border-white/10 rounded-3xl p-7 h-full hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 cursor-pointer`}
                >
                  {card.badge && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Bell className="h-3 w-3" />
                      {card.badge}
                    </div>
                  )}
                  <div
                    className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{card.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{card.description}</p>
                  <div className="mt-5 flex items-center gap-1 text-xs text-white/20 group-hover:text-white/45 transition-colors">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
