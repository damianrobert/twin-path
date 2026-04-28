"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  Search,
  Filter,
  PenTool,
  Hash,
  Settings,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface BlogPost {
  _id: Id<"posts">;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  authorId: Id<"users">;
  status: "draft" | "published";
  featuredImage?: string;
  readingTime?: number;
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
  createdAt: number;
  updatedAt?: number;
  publishedAt?: number;
  author: {
    _id: Id<"users">;
    name: string;
    role: string;
    bio?: string;
  } | null;
  topics: Array<{
    _id: Id<"topics">;
    name: string;
    description?: string;
  } | null>;
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("recent");

  const userProfile = useQuery(api.users.getCurrentProfile);
  const canWriteBlog = userProfile?.role === "mentor" || userProfile?.role === "both";

  const posts = useQuery(api.posts.getPublishedPosts, {
    limit: 50,
    topicId: selectedTopic !== "all" ? (selectedTopic as Id<"topics">) : undefined,
  });

  const topics = useQuery(api.topics.getAllTopics) || [];

  if (posts === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  const filteredPosts = posts.filter((post: BlogPost) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      (post.author?.name || "").toLowerCase().includes(query) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      post.topics.some((topic) => topic?.name.toLowerCase().includes(query) || false)
    );
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "trending": {
        const aScore = (a.viewCount || 0) + (a.likeCount || 0) * 2;
        const bScore = (b.viewCount || 0) + (b.likeCount || 0) * 2;
        return bScore - aScore;
      }
      case "recent":
      default:
        return (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt);
    }
  });

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getReadingTime = (post: BlogPost) =>
    post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);

  const featuredPost = sortedPosts[0];
  const restPosts = sortedPosts.slice(1);

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-purple-600/[0.03] blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Stories & insights from our mentor community</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
            The{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              TwinPath
            </span>{" "}
            Blog
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Deep dives, tutorials, and career lessons from professionals who&apos;ve lived it.
          </p>

          {canWriteBlog && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Link href="/dashboard/blog">
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors">
                  <Settings className="h-4 w-4" />
                  Manage Posts
                </button>
              </Link>
              <Link href="/blog/create">
                <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors shadow-lg shadow-white/5">
                  <PenTool className="h-4 w-4" />
                  Write Post
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-10 flex flex-col md:flex-row gap-3 backdrop-blur-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, topics, or authors…"
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>

          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white rounded-xl h-10">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-white/40" />
                <SelectValue placeholder="All Topics" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
              <SelectItem value="all" className="focus:bg-white/5">All Topics</SelectItem>
              {topics.map((topic: Doc<"topics">) => (
                <SelectItem key={topic._id} value={topic._id} className="focus:bg-white/5">
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "recent" | "popular" | "trending") => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-44 bg-white/5 border-white/10 text-white rounded-xl h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/40" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
              <SelectItem value="recent" className="focus:bg-white/5">Most Recent</SelectItem>
              <SelectItem value="popular" className="focus:bg-white/5">Most Popular</SelectItem>
              <SelectItem value="trending" className="focus:bg-white/5">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Empty state */}
        {sortedPosts.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-7 w-7 text-white/25" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No blog posts found</h3>
            <p className="text-white/40 mb-6">
              {searchQuery || selectedTopic !== "all"
                ? "Try adjusting your search or filters"
                : canWriteBlog
                ? "Be the first to share your knowledge with the community."
                : "Check back soon for fresh content from our mentors."}
            </p>
            {!searchQuery && selectedTopic === "all" && canWriteBlog && (
              <Link href="/blog/create">
                <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                  <PenTool className="h-4 w-4" />
                  Write First Post
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="block mb-10 group">
                <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10 border border-white/10 rounded-3xl p-1 hover:border-white/20 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_60%)]" />
                  <div className="relative grid md:grid-cols-2 gap-0 overflow-hidden rounded-[22px]">
                    {/* Image */}
                    <div className="relative aspect-video md:aspect-auto md:h-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 overflow-hidden">
                      {featuredPost.featuredImage ? (
                        <img
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white/15" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md">
                          Featured
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      {featuredPost.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {featuredPost.topics.filter(Boolean).slice(0, 2).map((topic) => (
                            <span
                              key={topic!._id}
                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300"
                            >
                              {topic!.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-violet-200 transition-colors line-clamp-3">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-white/45 leading-relaxed mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-white/35 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
                            {featuredPost.author?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-white/55 font-medium">
                            {featuredPost.author?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {getReadingTime(featuredPost)} min
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:gap-3 transition-all">
                        Read article
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {restPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gradient-to-br from-violet-500/10 to-blue-500/10 overflow-hidden">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-white/10" />
                        </div>
                      )}
                      {post.topics.filter(Boolean).length > 0 && (
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {post.topics.filter(Boolean).slice(0, 2).map((topic) => (
                            <span
                              key={topic!._id}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-white/90 backdrop-blur-md"
                            >
                              {topic!.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-white/40 text-sm line-clamp-2 leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/45"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-3 mt-auto">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-white">
                          {post.author?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-xs text-white/50 font-medium truncate">
                          {post.author?.name || "Unknown"}
                        </span>
                        <span className="text-white/15">·</span>
                        <span className="text-xs text-white/35">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-white/30 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{getReadingTime(post)} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart className="h-3 w-3" />
                          <span>{post.likeCount || 0}</span>
                        </div>
                        <span className="ml-auto text-violet-400/70 group-hover:text-violet-300 transition-colors">
                          Read →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
