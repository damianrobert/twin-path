"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  PenTool, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar,
  BookOpen,
  Plus,
  Filter,
  Hash,
  ArrowLeft,
  Send
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/web/ConfirmDeleteModal";
import { ConfirmPublishModal } from "@/components/web/ConfirmPublishModal";

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
  author?: {
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

export default function MentorBlogDashboard() {
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Id<"posts"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postToPublish, setPostToPublish] = useState<Id<"posts"> | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Get mentor's posts (filtered by status)
  const queryArgs = { 
    status: filter === "all" ? undefined : filter 
  };
  const posts = useQuery(api.posts.getPostsByAuthor, queryArgs) || [];

  // Get all posts for stats (always get all posts)
  const allPosts = useQuery(api.posts.getPostsByAuthor, { status: "all" }) || [];

  // Get all topics for filter
  const topics = useQuery(api.topics.getAllTopics) || [];

  // Delete post mutation
  const deletePost = useMutation(api.posts.deletePost);

  // Update post mutation (for publishing)
  const updatePost = useMutation(api.posts.updatePost);

  const handleDeleteClick = (postId: Id<"posts">) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    setIsDeleting(true);
    try {
      await deletePost({ postId: postToDelete });
      toast.success("Post deleted successfully");
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const handlePublishClick = (postId: Id<"posts">) => {
    setPostToPublish(postId);
    setPublishModalOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!postToPublish) return;
    
    setIsPublishing(true);
    try {
      await updatePost({
        postId: postToPublish,
        status: "published",
      });
      toast.success("Post published successfully!");
      setPublishModalOpen(false);
      setPostToPublish(null);
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishCancel = () => {
    setPublishModalOpen(false);
    setPostToPublish(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (post: BlogPost) => {
    return post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);
  };

  const draftPosts = allPosts.filter((post: BlogPost) => post.status === "draft");
  const publishedPosts = allPosts.filter((post: BlogPost) => post.status === "published");

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="mb-4">
        <Link href="/blog">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <PenTool className="h-8 w-8" />
                My Blog Posts
              </h1>
              <p className="text-muted-foreground">
                Manage and share your knowledge with the TwinPath community
              </p>
            </div>
          </div>
          <Link href="/blog/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write New Post
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{allPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{publishedPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{draftPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            <Filter className="h-4 w-4 mr-2" />
            All ({allPosts.length})
          </Button>
          <Button
            variant={filter === "published" ? "default" : "outline"}
            onClick={() => setFilter("published")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Published ({publishedPosts.length})
          </Button>
          <Button
            variant={filter === "draft" ? "default" : "outline"}
            onClick={() => setFilter("draft")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Drafts ({draftPosts.length})
          </Button>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
          <p className="text-muted-foreground mb-4">
            Start sharing your knowledge by writing your first blog post!
          </p>
          <Link href="/blog/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write First Post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: BlogPost) => (
            <Card key={post._id} className="group">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Post Info */}
                  <div className="flex-1 space-y-2">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status === "published" ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                      {post.status === "published" && post.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          Published {formatDate(post.publishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Topics and Tags */}
                    <div className="flex flex-wrap gap-2">
                      {post.topics.filter((topic): topic is NonNullable<typeof topic> => topic !== null).map((topic) => (
                        <Badge key={topic._id} variant="outline" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {topic.name}
                        </Badge>
                      ))}
                      {post.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatDate(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getReadingTime(post)} min read</span>
                      </div>
                      {post.status === "published" && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount || 0} views</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {post.status === "published" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                    {post.status === "draft" && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handlePublishClick(post._id)}
                        disabled={isPublishing}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/blog/edit/${post._id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(post._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog Post"
        description="Are you sure you want to delete this blog post? This action cannot be undone and will permanently remove the post from the platform."
        confirmText="Delete Post"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Publish Confirmation Modal */}
      <ConfirmPublishModal
        isOpen={publishModalOpen}
        onClose={handlePublishCancel}
        onConfirm={handlePublishConfirm}
        title="Publish Blog Post"
        description="Are you ready to publish this post? It will be visible to all users on the TwinPath blog."
        confirmText="Publish Post"
        cancelText="Cancel"
        isLoading={isPublishing}
      />
    </div>
  );
}
