"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

  useConvexErrorHandler();

  const shouldShowAccessDenied = isAdmin === false;
  const shouldShowLoading = isAdmin === undefined;

  if (shouldShowAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="h-7 w-7 text-white/25" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/40 mb-6">You don't have admin privileges to access this area.</p>
        <Link href="/dashboard">
          <button className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  if (shouldShowLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-7 w-7 border-2 border-violet-400 border-t-transparent rounded-full mb-4" />
        <p className="text-white/35 text-sm">Loading admin panel...</p>
      </div>
    );
  }

  const adminCards = [
    {
      title: "Blog Reports",
      description: "Review and manage user-reported blog posts",
      icon: AlertTriangle,
      href: "/admin/blog-reports",
      accent: "text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "User Management",
      description: "Manage admin rights and user accounts",
      icon: Users,
      href: "/admin/users",
      accent: "text-blue-400",
      accentBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Support Cases",
      description: "Manage user support requests",
      icon: Headphones,
      href: "/admin/support",
      accent: "text-violet-400",
      accentBg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Settings",
      description: "Platform settings and configuration",
      icon: Settings,
      href: "/admin/settings",
      accent: "text-white/50",
      accentBg: "bg-white/5 border-white/10",
    },
  ];

  const quickStats = [
    { label: "Pending Reports", value: pendingReports?.length ?? 0, accent: "text-amber-400" },
    { label: "Admin Users", value: adminUsers?.length ?? 0, accent: "text-violet-400" },
    { label: "Total Users", value: allUsers?.length ?? 0, accent: "text-emerald-400" },
    { label: "Open Cases", value: supportStats?.opened ?? 0, accent: "text-blue-400" },
    { label: "In Progress", value: supportStats?.inProgress ?? 0, accent: "text-amber-400" },
    { label: "Resolved", value: supportStats?.resolved ?? 0, accent: "text-emerald-400" },
    { label: "Total Cases", value: supportStats?.total ?? 0, accent: "text-white/60" },
    { label: "Urgent Cases", value: supportStats?.byPriority?.urgent ?? 0, accent: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
          Overview
        </p>
        <h1 className="text-3xl font-bold text-white">
          Admin{" "}
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="text-white/40 mt-1">Manage your TwinPath platform</p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminCards.map((card) => {
          const Icon = card.icon;
          const openCasesCount =
            card.title === "Support Cases" ? supportStats?.opened || 0 : 0;

          return (
            <div
              key={card.title}
              onClick={() => router.push(card.href)}
              className="group relative bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20 transition-all duration-300 cursor-pointer"
            >
              {openCasesCount > 0 && (
                <div className="absolute top-5 right-5">
                  <div className="flex items-center gap-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold px-2 py-1 rounded-full">
                    <Bell className="h-3 w-3" />
                    {openCasesCount}
                  </div>
                </div>
              )}
              <div className={`w-11 h-11 ${card.accentBg} border rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">{card.title}</h3>
              <p className="text-white/40 text-sm mb-4">{card.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-white/35 group-hover:text-violet-400 transition-colors">
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div>
        <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">
          Quick Stats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center"
            >
              <div className={`text-2xl font-bold ${stat.accent} mb-1`}>{stat.value}</div>
              <div className="text-xs text-white/35">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
