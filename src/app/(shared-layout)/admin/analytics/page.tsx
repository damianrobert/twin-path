"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Users,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Clock,
  Eye,
  Heart,
  BarChart3,
  Activity,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Headphones,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useConvexErrorHandler();

  const allUsers = useQuery(api.admin.getAllUsers) || [];
  const adminUsers = useQuery(api.admin.getAdminUsers) || [];
  const allPosts = useQuery(api.posts.getAllPosts) || [];
  const allMentorships = useQuery(api.mentorships.getAllMentorships) || [];
  const allMessages = useQuery(api.messages.getAllMessages) || [];
  const allReports = useQuery(api.blogReports.getPendingReports) || [];
  const allTopics = useQuery(api.topics.getAllTopics) || [];
  const supportStats = useQuery(api.supportCases.getSupportCaseStatistics);

  const totalUsers = allUsers.length;
  const totalAdmins = adminUsers.length;
  const totalPosts = allPosts.length;
  const totalMentorships = allMentorships.length;
  const totalMessages = allMessages.length;
  const totalTopics = allTopics.length;
  const totalCases = supportStats?.total || 0;
  const openCases = supportStats?.opened || 0;
  const inProgressCases = supportStats?.inProgress || 0;
  const resolvedCases = supportStats?.resolved || 0;
  const closedCases = supportStats?.closed || 0;
  const urgentCases = supportStats?.byPriority?.urgent || 0;

  const mentors = allUsers.filter((u) => u.role === "mentor" || u.role === "both").length;
  const mentees = allUsers.filter((u) => u.role === "mentee" || u.role === "both").length;
  const bothRoles = allUsers.filter((u) => u.role === "both").length;

  const activeMentorships = allMentorships.filter((m) => m.status === "active").length;
  const pendingMentorships = allMentorships.filter((m) => m.status === "pending").length;
  const completedMentorships = allMentorships.filter((m) => m.status === "completed").length;

  const publishedPosts = allPosts.filter((p) => p.status === "published").length;
  const draftPosts = allPosts.filter((p) => p.status === "draft").length;
  const totalLikes = allPosts.reduce((s, p) => s + (p.likeCount || 0), 0);
  const totalViews = allPosts.reduce((s, p) => s + (p.viewCount || 0), 0);
  const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : "0";
  const avgViewsPerPost = totalPosts > 0 ? (totalViews / totalPosts).toFixed(1) : "0";

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentUsers = allUsers.filter((u) => u.createdAt > sevenDaysAgo).length;
  const recentPosts = allPosts.filter((p) => p.createdAt > sevenDaysAgo).length;
  const monthlyUsers = allUsers.filter((u) => u.createdAt > thirtyDaysAgo).length;
  const monthlyPosts = allPosts.filter((p) => p.createdAt > thirtyDaysAgo).length;
  const monthlyMentorships = allMentorships.filter((m) => m.createdAt > thirtyDaysAgo).length;

  const usersWithPosts = new Set(allPosts.map((p) => p.authorId)).size;
  const usersInMentorships = new Set([
    ...allMentorships.map((m) => m.mentorId),
    ...allMentorships.map((m) => m.menteeId),
  ]).size;
  const activeUsers = usersWithPosts + usersInMentorships;

  const successRate =
    totalMentorships > 0
      ? ((completedMentorships / totalMentorships) * 100).toFixed(1)
      : "0";

  const completedWithDuration = allMentorships.filter(
    (m: any) => m.status === "completed" && m.completedAt && m.createdAt
  );
  const avgMentorshipDuration =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((s: number, m: any) => s + (m.completedAt - m.createdAt), 0) /
        completedWithDuration.length
      : 0;

  const avgDailyUsers = monthlyUsers / 30;
  const avgDailyPosts = monthlyPosts / 30;
  const avgDailyMentorships = monthlyMentorships / 30;

  const mostLikedPosts = [...allPosts]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 5);
  const mostViewedPosts = [...allPosts]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  const postsByDay = allPosts.reduce((acc, p) => {
    const day = new Date(p.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usersByDay = allUsers.reduce((acc, u) => {
    const day = new Date(u.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""}`;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
      <p className="text-white font-semibold text-sm mb-4">{title}</p>
      {children}
    </div>
  );

  const StatRow = ({
    label,
    value,
    accent,
    badge,
  }: {
    label: string;
    value: React.ReactNode;
    accent?: string;
    badge?: string;
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        {accent && (
          <div className={`w-2 h-2 rounded-full ${accent}`} />
        )}
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white text-sm">{value}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/35 text-xs rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2">
            Insights
          </p>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-400" />
            Platform Analytics
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Comprehensive insights into platform performance
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v: "7d" | "30d" | "90d" | "all") => setTimeRange(v)}
        >
          <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Users",
            value: totalUsers,
            sub: `+${recentUsers} this week`,
            icon: Users,
            accent: "text-blue-400",
          },
          {
            label: "Blog Posts",
            value: totalPosts,
            sub: `${totalLikes.toLocaleString()} likes`,
            icon: BookOpen,
            accent: "text-violet-400",
          },
          {
            label: "Mentorships",
            value: totalMentorships,
            sub: `${activeMentorships} active`,
            icon: Target,
            accent: "text-emerald-400",
          },
          {
            label: "Messages",
            value: totalMessages,
            sub: `${usersInMentorships} participants`,
            icon: MessageSquare,
            accent: "text-amber-400",
          },
          {
            label: "Support Cases",
            value: totalCases,
            sub: `${openCases} need attention`,
            icon: Headphones,
            accent: "text-red-400",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-xs">{s.label}</span>
                <Icon className="h-3.5 w-3.5 text-white/20" />
              </div>
              <div className={`text-2xl font-bold ${s.accent} mb-1`}>{s.value}</div>
              <div className="text-xs text-white/30">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Growth metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Daily User Growth", value: avgDailyUsers.toFixed(1), sub: `Posts: ${avgDailyPosts.toFixed(1)}/day`, accent: "text-blue-400" },
          {
            label: "Active Engagement",
            value: activeUsers,
            sub: `${totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}% of total`,
            accent: "text-violet-400",
          },
          {
            label: "Avg Mentorship Duration",
            value: formatDuration(avgMentorshipDuration),
            sub: `${completedMentorships} completed`,
            accent: "text-emerald-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
          >
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent} mb-1`}>{s.value}</p>
            <p className="text-xs text-white/30">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Content performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Top Performing Posts (by Likes)">
          <div className="space-y-2">
            {mostLikedPosts.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">No posts with likes yet</p>
            ) : (
              mostLikedPosts.map((post: any) => (
                <div
                  key={post._id}
                  className="flex items-start justify-between gap-3 p-3 bg-white/5 border border-white/8 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{post.title}</p>
                    <p className="text-xs text-white/35 truncate mt-0.5">
                      by {post.authorName || "Unknown"} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                    <Heart className="h-3.5 w-3.5 text-red-400" />
                    <span className="font-semibold text-white">{post.likeCount || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Most Viewed Posts">
          <div className="space-y-2">
            {mostViewedPosts.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">No posts with views yet</p>
            ) : (
              mostViewedPosts.map((post: any) => (
                <div
                  key={post._id}
                  className="flex items-start justify-between gap-3 p-3 bg-white/5 border border-white/8 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{post.title}</p>
                    <p className="text-xs text-white/35 truncate mt-0.5">
                      by {post.authorName || "Unknown"} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-semibold text-white">{post.viewCount || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      {/* Distribution grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="User Distribution">
          <StatRow label="Mentors" value={mentors} accent="bg-blue-500" badge={`${((mentors / (totalUsers || 1)) * 100).toFixed(1)}%`} />
          <StatRow label="Mentees" value={mentees} accent="bg-emerald-500" badge={`${((mentees / (totalUsers || 1)) * 100).toFixed(1)}%`} />
          <StatRow label="Both Roles" value={bothRoles} accent="bg-violet-500" badge={`${((bothRoles / (totalUsers || 1)) * 100).toFixed(1)}%`} />
          <StatRow label="Admins" value={totalAdmins} accent="bg-amber-500" badge={`${((totalAdmins / (totalUsers || 1)) * 100).toFixed(1)}%`} />
        </Section>

        <Section title="Mentorship Status">
          <StatRow label="Active" value={activeMentorships} accent="bg-emerald-500" badge="Live" />
          <StatRow label="Pending" value={pendingMentorships} accent="bg-amber-500" badge="Waiting" />
          <StatRow label="Completed" value={completedMentorships} accent="bg-blue-500" badge="Done" />
          <StatRow label="Success Rate" value={`${successRate}%`} />
        </Section>
      </div>

      {/* Support + Blog analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Support Case Status">
          <StatRow label="Open" value={openCases} accent="bg-red-500" badge="Needs Attention" />
          <StatRow label="In Progress" value={inProgressCases} accent="bg-amber-500" badge="Working" />
          <StatRow label="Resolved" value={resolvedCases} accent="bg-emerald-500" badge="Done" />
          <StatRow label="Closed" value={closedCases} accent="bg-white/30" badge="Archived" />
          <StatRow label="Urgent" value={urgentCases} accent="bg-red-600" badge="High Priority" />
          <StatRow
            label="Resolution Rate"
            value={`${totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : 0}%`}
          />
        </Section>

        <Section title="Blog Content">
          <StatRow label="Published Posts" value={publishedPosts} badge={`${totalPosts > 0 ? ((publishedPosts / totalPosts) * 100).toFixed(1) : 0}%`} />
          <StatRow label="Draft Posts" value={draftPosts} badge={`${totalPosts > 0 ? ((draftPosts / totalPosts) * 100).toFixed(1) : 0}%`} />
          <StatRow label="Total Likes" value={totalLikes.toLocaleString()} />
          <StatRow label="Total Views" value={totalViews.toLocaleString()} />
          <StatRow label="Avg Likes/Post" value={avgLikesPerPost} />
          <StatRow label="Avg Views/Post" value={avgViewsPerPost} />
        </Section>
      </div>

      {/* Platform health */}
      <Section title="Platform Health & Activity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">
              Daily Averages (30 days)
            </p>
            <div className="space-y-2">
              {[
                { label: "New Users", value: avgDailyUsers.toFixed(1) },
                { label: "New Posts", value: avgDailyPosts.toFixed(1) },
                { label: "New Mentorships", value: avgDailyMentorships.toFixed(1) },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{r.label}</span>
                  <span className="font-semibold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">
              Engagement
            </p>
            <div className="space-y-2">
              {[
                { label: "Content Creators", value: usersWithPosts },
                { label: "Mentorship Participants", value: usersInMentorships },
                { label: "Engagement Rate", value: `${totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{r.label}</span>
                  <span className="font-semibold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">
              Platform Stats
            </p>
            <div className="space-y-2">
              {[
                { label: "Success Rate", value: `${successRate}%` },
                { label: "Avg Duration", value: formatDuration(avgMentorshipDuration) },
                { label: "Total Topics", value: totalTopics },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{r.label}</span>
                  <span className="font-semibold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">
              Top Activity Days (Users)
            </p>
            <div className="space-y-1.5">
              {Object.entries(usersByDay)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([day, count]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-white/40">{day}</span>
                    <span className="font-semibold text-white">{count} users</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-3">
              Top Activity Days (Posts)
            </p>
            <div className="space-y-1.5">
              {Object.entries(postsByDay)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([day, count]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-white/40">{day}</span>
                    <span className="font-semibold text-white">{count} posts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
