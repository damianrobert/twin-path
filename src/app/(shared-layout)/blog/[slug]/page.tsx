"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  ArrowLeft,
  Share2,
  Hash,
  BookOpen,
  Trash2,
  Loader2,
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

  const post = useQuery(api.posts.getPostBySlug, { slug });
  const userProfile = useQuery(api.users.getCurrentProfile);
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin);

  const hasLiked = useQuery(
    api.posts.hasUserLikedPost,
    post?._id ? { postId: post._id as any } : "skip"
  );

  const incrementViewCount = useMutation(api.posts.incrementViewCount);
  const likePost = useMutation(api.posts.likePost);
  const unlikePost = useMutation(api.posts.unlikePost);
  const deletePost = useMutation(api.posts.deletePost);

  useEffect(() => {
    if (post && hasLiked !== undefined) {
      setIsLiked(hasLiked);
      setLikeCount(post.likeCount || 0);
    }
  }, [post, hasLiked]);

  useEffect(() => {
    if (post && userProfile && !hasViewed) {
      incrementViewCount({ postId: post._id as any });
      setHasViewed(true);

      const viewedPosts = JSON.parse(sessionStorage.getItem("viewedBlogPosts") || "[]");
      if (!viewedPosts.includes(post._id)) {
        viewedPosts.push(post._id);
        sessionStorage.setItem("viewedBlogPosts", JSON.stringify(viewedPosts));
      }
    }
  }, [post, userProfile, hasViewed, incrementViewCount]);

  useEffect(() => {
    if (post) {
      const viewedPosts = JSON.parse(sessionStorage.getItem("viewedBlogPosts") || "[]");
      if (viewedPosts.includes(post._id)) {
        setHasViewed(true);
      }
    }
  }, [post]);

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
        setLikeCount((prev) => Math.max(prev - 1, 0));
        toast.success("Post unliked");
      } else {
        await likePost({ postId: post._id as any });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        toast.success("Post liked!");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

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

  if (post === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-20">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-7 w-7 text-white/25" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Blog Post Not Found</h1>
            <p className="text-white/40 mb-6">
              The blog post you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.
            </p>
            <Link href="/blog">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || `Check out this blog post by ${post.author?.name || "Unknown author"}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const readingTime = post.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);
  const isOwnPost = !!(userProfile && post.authorId === userProfile._id);

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-purple-600/[0.03] blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-blue-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back nav */}
        <div className="mb-8">
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>
          </Link>
        </div>

        <article className="space-y-8">
          {/* Topics */}
          {post.topics.filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.topics.filter(Boolean).map((topic: BlogPost["topics"][number]) => (
                <span
                  key={topic!._id}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300"
                >
                  <Hash className="h-3 w-3" />
                  {topic!.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-white/50 leading-relaxed">{post.excerpt}</p>
          )}

          {/* Author + meta */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-base font-semibold text-white">
                {post.author?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">
                    {post.author?.name || "Unknown Author"}
                  </h3>
                  {post.author?.role && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/50 uppercase tracking-wider">
                      {post.author.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/35 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                  <span className="text-white/15">·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{readingTime} min read</span>
                  </div>
                  <span className="text-white/15">·</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.viewCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-white/75 leading-relaxed text-[17px]">
              {post.content}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/55"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-white/35">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{post.viewCount || 0} views</span>
                </div>
                <span className="text-white/15">·</span>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{likeCount} likes</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin ? (
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/15 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Post
                  </button>
                ) : (
                  <>
                    {!isOwnPost && (
                      <button
                        onClick={handleLikeToggle}
                        disabled={isLiking}
                        className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
                          isLiked
                            ? "bg-rose-500/15 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20"
                            : "bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07]"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        <span>{likeCount}</span>
                        <span>{isLiked ? "Liked" : "Like"}</span>
                      </button>
                    )}

                    <button
                      onClick={sharePost}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>

                    {!isOwnPost && (
                      <ReportBlogButton postId={post._id as any} postTitle={post.title} />
                    )}
                  </>
                )}
              </div>
            </div>

            {(isOwnPost || isAdmin) && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/40">
                  {isOwnPost
                    ? "You cannot like your own posts, but you can share them with others."
                    : "As an admin, you can delete this post if it violates community guidelines."}
                </p>
              </div>
            )}
          </div>

          {/* Author Bio Card */}
          <div className="relative bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-white/10 rounded-3xl p-8 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.08),transparent_60%)]" />
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-xl font-bold text-white shrink-0">
                {post.author?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-1">
                  Written by
                </p>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {post.author?.name || "Unknown Author"}
                </h3>
                {post.author?.bio && (
                  <p className="text-white/50 leading-relaxed mb-3">{post.author.bio}</p>
                )}
                {post.author?.role && (
                  <span className="inline-flex text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 capitalize">
                    {post.author.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

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
