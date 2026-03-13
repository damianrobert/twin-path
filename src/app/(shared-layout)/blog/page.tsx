"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Search, 
  Filter,
  User,
  PenTool,
  Hash,
  Settings
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

  // Get current user profile to check role
  const userProfile = useQuery(api.users.getCurrentProfile);

  // Check if user is mentor or both
  const canWriteBlog = userProfile?.role === "mentor" || userProfile?.role === "both";

  // Get all published posts
  const posts = useQuery(api.posts.getPublishedPosts, {
    limit: 50,
    topicId: selectedTopic !== "all" ? selectedTopic as Id<"topics"> : undefined,
  }) || [];

  // Get all topics for filter
  const topics = useQuery(api.topics.getAllTopics) || [];

  // Filter posts by search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      (post.author?.name || "").toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.topics.some(topic => topic?.name.toLowerCase().includes(query) || false)
    );
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "trending":
        // Trending could be based on recent views + likes
        const aScore = (a.viewCount || 0) + (a.likeCount || 0) * 2;
        const bScore = (b.viewCount || 0) + (b.likeCount || 0) * 2;
        return bScore - aScore;
      case "recent":
      default:
        return (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt);
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (post: BlogPost) => {
    return post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              TwinPath Blog
            </h1>
            <p className="text-muted-foreground">
              Insights, tutorials, and experiences from our mentor community
            </p>
          </div>
          <div className="flex gap-2">
            {canWriteBlog && (
              <>
                <Link href="/dashboard/blog">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Posts
                  </Button>
                </Link>
                <Link href="/blog/create">
                  <Button>
                    <PenTool className="h-4 w-4 mr-2" />
                    Write Post
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Topic Filter */}
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full md:w-48">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <SelectValue placeholder="All Topics" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic._id} value={topic._id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: "recent" | "popular" | "trending") => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-48">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posts Grid */}
      {sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No blog posts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedTopic !== "all" 
              ? "Try adjusting your search or filters" 
              : canWriteBlog 
                ? "Be the first to share your knowledge with the community!"
                : "No blog posts yet. Check back soon for content from our mentors!"
            }
          </p>
          {(!searchQuery && selectedTopic === "all" && canWriteBlog) && (
            <Link href="/blog/create">
              <Button>
                <PenTool className="h-4 w-4 mr-2" />
                Write First Post
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPosts.map((post) => (
            <Card key={post._id} className="group hover:shadow-lg transition-shadow">
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}

              <CardHeader className="pb-3">
                {/* Topics */}
                {post.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.topics.filter(Boolean).slice(0, 2).map((topic) => (
                      <Badge key={topic!._id} variant="secondary" className="text-xs">
                        {topic!.name}
                      </Badge>
                    ))}
                    {post.topics.filter(Boolean).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.topics.filter(Boolean).length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Title */}
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Author and Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {post.author?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author?.name || "Unknown Author"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{getReadingTime(post)} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.viewCount || 0}</span>
                    </div>
                    {post.likeCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{post.likeCount}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/blog/${post.slug}`} className="text-xs">
                      Read More →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
