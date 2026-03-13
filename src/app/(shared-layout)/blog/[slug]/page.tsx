"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  User,
  ArrowLeft,
  Share2,
  Hash,
  BookOpen,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ReportBlogButton from "@/components/web/ReportBlogButton";
import DeleteConfirmModal from "@/components/web/DeleteConfirmModal";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  authorId: string;
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
    _id: string;
    name: string;
    role: string;
    bio?: string;
  } | null;
  topics: Array<{
    _id: string;
    name: string;
    description?: string;
  } | null>;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasViewed, setHasViewed] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Get post by slug
  const post = useQuery(api.posts.getPostBySlug, { slug });

  // Get current user profile
  const userProfile = useQuery(api.users.getCurrentProfile);
  
  // Check if current user is admin
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);

  // Check if user has liked this post (only call when post is loaded)
  const hasLiked = useQuery(
    api.posts.hasUserLikedPost, 
    post?._id ? { postId: post._id as any } : "skip"
  );

  // Mutations
  const incrementViewCount = useMutation(api.posts.incrementViewCount);
  const likePost = useMutation(api.posts.likePost);
  const unlikePost = useMutation(api.posts.unlikePost);
  const deletePost = useMutation(api.posts.deletePost);

  // Initialize like state
  useEffect(() => {
    if (post && hasLiked !== undefined) {
      setIsLiked(hasLiked);
      setLikeCount(post.likeCount || 0);
    }
  }, [post, hasLiked]);

  // Increment view count only once per session when post is loaded
  useEffect(() => {
    if (post && userProfile && !hasViewed) {
      incrementViewCount({ postId: post._id as any });
      setHasViewed(true); // Mark as viewed to prevent multiple increments
      
      // Store in session storage to prevent incrementing on page refresh
      const viewedPosts = JSON.parse(sessionStorage.getItem('viewedBlogPosts') || '[]');
      if (!viewedPosts.includes(post._id)) {
        viewedPosts.push(post._id);
        sessionStorage.setItem('viewedBlogPosts', JSON.stringify(viewedPosts));
      }
    }
  }, [post, userProfile, hasViewed, incrementViewCount]);

  // Check if post was already viewed in this session
  useEffect(() => {
    if (post) {
      const viewedPosts = JSON.parse(sessionStorage.getItem('viewedBlogPosts') || '[]');
      if (viewedPosts.includes(post._id)) {
        setHasViewed(true);
      }
    }
  }, [post]);

  // Handle like/unlike
  const handleLikeToggle = async () => {
    if (!userProfile) {
      toast.error("Please log in to like posts");
      return;
    }

    if (!post) return;

    setIsLiking(true);
    
    try {
      if (isLiked) {
        await unlikePost({ postId: post._id as any });
        setIsLiked(false);
        setLikeCount(prev => Math.max(prev - 1, 0));
        toast.success("Post unliked");
      } else {
        await likePost({ postId: post._id as any });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success("Post liked!");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle post deletion (admin only)
  const handleDeletePost = async () => {
    if (!post) return;

    setIsDeleting(true);
    
    try {
      await deletePost({ postId: post._id as any });
      toast.success("Blog post deleted successfully");
      setDeleteModalOpen(false);
      router.push("/blog");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete blog post");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle opening delete modal
  const handleOpenDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The blog post you're looking for doesn't exist or hasn't been published yet.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || `Check out this blog post by ${post.author?.name || 'Unknown author'}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/blog">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article className="space-y-6">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title and Meta */}
        <div className="space-y-4">
          {/* Topics */}
          {post.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.topics.map((topic: BlogPost['topics'][number]) => (
                topic && (
                  <Badge key={topic._id} variant="secondary">
                    <Hash className="h-3 w-3 mr-1" />
                    {topic.name}
                  </Badge>
                )
              ))}
            </div>
          )}

          <h1 className="text-4xl font-bold leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Author and Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {post.author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{post.author?.name || 'Unknown Author'}</h3>
                  {post.author?.role && (
                    <Badge variant="outline" className="text-xs">
                      {post.author.role}
                    </Badge>
                  )}
                </div>
                {post.author?.bio && (
                  <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200)} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap">{post.content}</div>
        </div>

        {/* Post Footer */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200)} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{post.viewCount || 0} views</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Show different buttons for admins vs regular users */}
              {isAdmin ? (
                // Admin-only buttons
                <>
                  {/* Delete Button - Admin Only */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenDeleteModal}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </Button>
                </>
              ) : (
                // Regular user buttons
                <>
                  {/* Like Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLikeToggle}
                    disabled={isLiking}
                    className={`${
                      isLiked ? "text-red-500 border-red-500 hover:bg-red-50" : ""
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    <span>{likeCount}</span>
                    {isLiked ? "Liked" : "Like"}
                  </Button>

                  {/* Share Button */}
                  <Button variant="outline" size="sm" onClick={sharePost}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Post
                  </Button>

                  {/* Report Button */}
                  <ReportBlogButton postId={post._id as any} postTitle={post.title} />
                </>
              )}
            </div>
          </div>

          {/* Show message for authors and admins */}
          {(userProfile && post.authorId === userProfile._id) || isAdmin ? (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {userProfile && post.authorId === userProfile._id 
                  ? "You cannot like your own posts, but you can share them with others!"
                  : isAdmin 
                    ? "As an admin, you can delete this post if it violates community guidelines."
                    : ""
                }
              </p>
            </div>
          ) : null}
        </div>

        {/* Author Bio Card */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {post.author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">About {post.author?.name || 'Unknown Author'}</h3>
                {post.author?.bio && (
                  <p className="text-muted-foreground mb-2">{post.author.bio}</p>
                )}
                {post.author?.role && (
                  <Badge variant="outline">{post.author.role}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </article>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeletePost}
        postTitle={post?.title || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}
