"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Shield, 
  Clock,
  Eye,
  Heart,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Target,
  Award,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConvexErrorHandler } from "../../../../hooks/useConvexErrorHandler";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  
  // Handle admin access errors
  useConvexErrorHandler();

  // Fetch data for analytics
  const allUsers = useQuery(api.admin.getAllUsers) || [];
  const adminUsers = useQuery(api.admin.getAdminUsers) || [];
  const allPosts = useQuery(api.posts.getAllPosts) || [];
  const allMentorships = useQuery(api.mentorships.getAllMentorships) || [];
  const allMessages = useQuery(api.messages.getAllMessages) || [];
  const allReports = useQuery(api.blogReports.getPendingReports) || [];
  const allTopics = useQuery(api.topics.getAllTopics) || [];

  // Calculate analytics
  const totalUsers = allUsers.length;
  const totalAdmins = adminUsers.length;
  const totalPosts = allPosts.length;
  const totalMentorships = allMentorships.length;
  const totalMessages = allMessages.length;
  const totalReports = allReports.length;
  const totalTopics = allTopics.length;

  // User role distribution
  const mentors = allUsers.filter(user => user.role === "mentor" || user.role === "both").length;
  const mentees = allUsers.filter(user => user.role === "mentee" || user.role === "both").length;
  const bothRoles = allUsers.filter(user => user.role === "both").length;

  // Mentorship stats
  const activeMentorships = allMentorships.filter(m => m.status === "active").length;
  const pendingMentorships = allMentorships.filter(m => m.status === "pending").length;
  const completedMentorships = allMentorships.filter(m => m.status === "completed").length;

  // Report stats (using pending reports as we don't have all reports)
  const pendingReports = allReports.length;
  const resolvedReports = 0; // Would need additional query
  const dismissedReports = 0; // Would need additional query

  // Post stats
  const publishedPosts = allPosts.filter(p => p.status === "published").length;
  const draftPosts = allPosts.filter(p => p.status === "draft").length;
  
  // Calculate engagement metrics
  const totalLikes = allPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
  const totalViews = allPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
  const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : "0";
  const avgViewsPerPost = totalPosts > 0 ? (totalViews / totalPosts).toFixed(1) : "0";

  // Recent activity (last 7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentUsers = allUsers.filter(user => user.createdAt > sevenDaysAgo).length;
  const recentPosts = allPosts.filter(post => post.createdAt > sevenDaysAgo).length;
  const recentMentorships = allMentorships.filter(m => m.createdAt > sevenDaysAgo).length;

  // Additional analytics
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const monthlyUsers = allUsers.filter(user => user.createdAt > thirtyDaysAgo).length;
  const monthlyPosts = allPosts.filter(post => post.createdAt > thirtyDaysAgo).length;
  const monthlyMentorships = allMentorships.filter(m => m.createdAt > thirtyDaysAgo).length;

  // User engagement metrics
  const usersWithPosts = new Set(allPosts.map(p => p.authorId)).size;
  const usersInMentorships = new Set([
    ...allMentorships.map(m => m.mentorId),
    ...allMentorships.map(m => m.menteeId)
  ]).size;
  const activeUsers = usersWithPosts + usersInMentorships;

  // Content performance metrics
  const mostLikedPosts = [...allPosts]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 5);
  const mostViewedPosts = [...allPosts]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  // Mentorship success metrics
  const successRate = totalMentorships > 0 
    ? ((completedMentorships / totalMentorships) * 100).toFixed(1) 
    : "0";
  
  const completedMentorshipsWithDuration = allMentorships.filter(
    (m: any) => m.status === "completed" && m.completedAt && m.createdAt
  );
  
  const avgMentorshipDuration = completedMentorshipsWithDuration.length > 0
    ? completedMentorshipsWithDuration.reduce(
        (sum: number, m: any) => sum + (m.completedAt - m.createdAt), 
        0
      ) / completedMentorshipsWithDuration.length
    : 0;

  // Time-based activity patterns
  const postsByDay = allPosts.reduce((acc, post) => {
    const day = new Date(post.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usersByDay = allUsers.reduce((acc, user) => {
    const day = new Date(user.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Platform growth metrics
  const avgDailyUsers = monthlyUsers / 30;
  const avgDailyPosts = monthlyPosts / 30;
  const avgDailyMentorships = monthlyMentorships / 30;

  // User retention metrics
  const oldestUsers = allUsers
    .filter(user => user.createdAt < thirtyDaysAgo)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 10);

  // Content categories (if topics are available)
  const topicDistribution = allTopics.length > 0 ? allTopics.slice(0, 10) : [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Platform Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user engagement
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d" | "all") => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>+{recentUsers} this week</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>+{monthlyUsers} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>+{recentPosts} this week</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Heart className="h-3 w-3" />
              <span>{totalLikes.toLocaleString()} total likes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorships</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMentorships}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>{activeMentorships} active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Award className="h-3 w-3" />
              <span>{successRate}% success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Total sent</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              <span>{usersInMentorships} participants</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyUsers.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Users per day</div>
            <div className="text-xs text-green-600 mt-1">
              Posts: {avgDailyPosts.toFixed(1)}/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <div className="text-xs text-muted-foreground">Engaged users</div>
            <div className="text-xs text-blue-600 mt-1">
              {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Mentorship Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(avgMentorshipDuration)}</div>
            <div className="text-xs text-muted-foreground">For completed ones</div>
            <div className="text-xs text-purple-600 mt-1">
              {completedMentorships} completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {mostLikedPosts.slice(0, 5).map((post: any, index: number) => (
                <div key={post._id} className="flex items-start justify-between p-3 bg-muted rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" title={post.title}>
                      {post.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <div className="truncate" title={`by ${post.authorName || 'Unknown'} • ${formatDate(post.createdAt)}`}>
                        by {post.authorName || 'Unknown'} • {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-shrink-0">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{post.likeCount || 0}</span>
                  </div>
                </div>
              ))}
              {mostLikedPosts.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No posts with likes yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Most Viewed Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {mostViewedPosts.slice(0, 5).map((post: any, index: number) => (
                <div key={post._id} className="flex items-start justify-between p-3 bg-muted rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" title={post.title}>
                      {post.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <div className="truncate" title={`by ${post.authorName || 'Unknown'} • ${formatDate(post.createdAt)}`}>
                        by {post.authorName || 'Unknown'} • {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-shrink-0">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{post.viewCount || 0}</span>
                  </div>
                </div>
              ))}
              {mostViewedPosts.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No posts with views yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Mentors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{mentors}</span>
                  <Badge variant="outline">{((mentors / totalUsers) * 100).toFixed(1)}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Mentees</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{mentees}</span>
                  <Badge variant="outline">{((mentees / totalUsers) * 100).toFixed(1)}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Both Roles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{bothRoles}</span>
                  <Badge variant="outline">{((bothRoles / totalUsers) * 100).toFixed(1)}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Admins</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{totalAdmins}</span>
                  <Badge variant="outline">{((totalAdmins / totalUsers) * 100).toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Mentorship Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{activeMentorships}</span>
                  <Badge variant="outline" className="text-green-600">Live</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{pendingMentorships}</span>
                  <Badge variant="outline" className="text-yellow-600">Waiting</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{completedMentorships}</span>
                  <Badge variant="outline" className="text-blue-600">Done</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Blog Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Published Posts</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{publishedPosts}</span>
                  <Badge variant="outline">{totalPosts > 0 ? ((publishedPosts / totalPosts) * 100).toFixed(1) : 0}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Draft Posts</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{draftPosts}</span>
                  <Badge variant="outline">{totalPosts > 0 ? ((draftPosts / totalPosts) * 100).toFixed(1) : 0}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Likes</span>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-semibold">{totalLikes.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Views</span>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{totalViews.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Likes/Post</span>
                <span className="font-semibold">{avgLikesPerPost}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Views/Post</span>
                <span className="font-semibold">{avgViewsPerPost}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Reports & Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Reports</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{pendingReports}</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Action Required</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">{pendingReports}</span>
                  <Badge variant="outline" className="text-orange-600">Review needed</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Retention & Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            User Retention & Activity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Activity */}
            <div>
              <h4 className="font-semibold mb-3">Daily Averages (Last 30 Days)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Users</span>
                  <span className="font-semibold">{avgDailyUsers.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Posts</span>
                  <span className="font-semibold">{avgDailyPosts.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Mentorships</span>
                  <span className="font-semibold">{avgDailyMentorships.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div>
              <h4 className="font-semibold mb-3">Engagement Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Content Creators</span>
                  <span className="font-semibold">{usersWithPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mentorship Participants</span>
                  <span className="font-semibold">{usersInMentorships}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Engagement Rate</span>
                  <span className="font-semibold">
                    {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Health */}
            <div>
              <h4 className="font-semibold mb-3">Platform Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-green-600">{successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Duration</span>
                  <span className="font-semibold">{formatDuration(avgMentorshipDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Topics</span>
                  <span className="font-semibold">{totalTopics}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Recent Activity Timeline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Top Activity Days (Users)</h5>
                <div className="space-y-1">
                  {Object.entries(usersByDay)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([day, count]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{day}</span>
                        <span className="font-semibold">{count} users</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Top Activity Days (Posts)</h5>
                <div className="space-y-1">
                  {Object.entries(postsByDay)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([day, count]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{day}</span>
                        <span className="font-semibold">{count} posts</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
