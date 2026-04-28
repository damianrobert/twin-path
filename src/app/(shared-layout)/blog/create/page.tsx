"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  PenTool,
  Save,
  Eye,
  Clock,
  Hash,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateBlogPage() {
  const router = useRouter();

  const allPosts = useQuery(api.posts.getPublishedPosts, { limit: 1000 });
  const userProfile = useQuery(api.users.getCurrentProfile);
  const topics = useQuery(api.topics.getAllTopics) || [];

  const createPost = useAction(api.posts.createPost);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featuredImage, setFeaturedImage] = useState("");
  const [, setFeaturedImageFile] = useState<File | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<"upload" | "link">("upload");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Id<"topics">[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionIssues, setRejectionIssues] = useState<string[]>([]);

  const canWriteBlog = userProfile?.role === "mentor" || userProfile?.role === "both";

  useEffect(() => {
    if (userProfile && !canWriteBlog) {
      toast.error("Only mentors can write blog posts");
      router.push("/blog");
    }
  }, [userProfile, canWriteBlog, router]);

  const generateSlug = async (titleInput: string) => {
    if (!titleInput.trim()) return;
    setIsGeneratingSlug(true);
    try {
      const baseSlug = titleInput
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existingSlugs = allPosts?.map((post: Doc<"posts">) => post.slug) || [];

      let finalSlug = baseSlug;
      let counter = 1;
      while (existingSlugs.includes(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      setSlug(finalSlug);
    } catch (error) {
      console.error("Error generating slug:", error);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  useEffect(() => {
    if (title && !slug) {
      const timeoutId = setTimeout(() => {
        generateSlug(title);
      }, 500);
      return () => clearTimeout(timeoutId);
    }

  }, [title]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!canWriteBlog) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-20">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-7 w-7 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/40 mb-6">
              Only mentors can write blog posts. Upgrade your role to access this page.
            </p>
            <button
              onClick={() => router.push("/blog")}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topicId as Id<"topics">]);
    } else {
      setSelectedTopics(selectedTopics.filter((id) => id !== topicId));
    }
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleImageUpload = (file: File) => {
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("Image size must be less than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImage(reader.result as string);
        setFeaturedImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (!slug.trim()) {
      toast.error("URL slug is required");
      return;
    }

    try {
      setIsAnalyzingContent(true);
      toast.loading("Please wait while AI checks your content…", { id: "content-analysis" });

      const result = await createPost({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        status,
        featuredImage: featuredImage.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
      });

      toast.dismiss("content-analysis");
      setIsAnalyzingContent(false);

      if (result.success) {
        toast.success(`Blog post ${status === "published" ? "published" : "saved as draft"} successfully!`);
        if (status === "published") {
          router.push("/blog");
        } else {
          router.push("/dashboard/blog");
        }
      } else {
        if (result.error === "Content not approved") {
          setRejectionIssues(result.issues);
          setRejectionModalOpen(true);
        } else {
          toast.error(result.error || "Failed to create blog post");
        }
      }
    } catch (error) {
      toast.dismiss("content-analysis");
      setIsAnalyzingContent(false);
      console.error("Error creating post:", error);

      if (error instanceof Error && error.message.includes("slug already exists")) {
        toast.error("This URL slug is already taken. Generating a new one…");
        generateSlug(title + "-" + Date.now());
      } else if (error instanceof Error && error.message.includes("Only mentors can create blog posts")) {
        toast.error("Only mentors can create blog posts");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create blog post");
      }
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.07),transparent_70%)]" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-purple-600/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back */}
        <div className="mb-8">
          <Link href="/blog">
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Share what you know</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3 leading-[1.1]">
            Write a{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Blog Post
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Share your expertise and insights with the TwinPath community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-white/55 mb-1.5">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your blog post title"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-medium text-white/55 mb-1.5">
                  URL Slug <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => generateSlug(title)}
                    disabled={isGeneratingSlug || !title.trim()}
                    className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingSlug ? "Generating…" : "Generate"}
                  </button>
                </div>
                <p className="text-xs text-white/35 mt-1.5">
                  URL preview: <span className="text-violet-300/80">/blog/{slug || "your-slug"}</span>
                </p>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-xs font-medium text-white/55 mb-1.5">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of your blog post (optional)"
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
                <p className="text-xs text-white/35 mt-1.5">
                  {excerpt.length}/200 characters recommended
                </p>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-xs font-medium text-white/55 mb-2">Featured Image</label>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod("upload")}
                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                      imageUploadMethod === "upload"
                        ? "bg-white text-black"
                        : "bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod("link")}
                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
                      imageUploadMethod === "link"
                        ? "bg-white text-black"
                        : "bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Link
                  </button>
                </div>

                {imageUploadMethod === "upload" && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/20 transition-colors bg-white/[0.02]">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (featuredImage) toast.info("Replacing existing featured image");
                            handleImageUpload(file);
                          }
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="h-5 w-5 text-white/40" />
                        </div>
                        <p className="text-sm text-white/60 mb-1">
                          {featuredImage ? "Click to replace featured image" : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-white/30">Maximum file size: 500KB</p>
                        {featuredImage && (
                          <p className="text-xs text-emerald-400 mt-2">✓ Image selected</p>
                        )}
                      </label>
                    </div>

                    {featuredImage && (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={featuredImage}
                          alt="Featured image preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturedImage("");
                            setFeaturedImageFile(null);
                            toast.info("Featured image removed");
                          }}
                          className="absolute top-2 right-2 inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-rose-500/20 border border-rose-500/30 text-rose-200 hover:bg-rose-500/30 backdrop-blur-md transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {imageUploadMethod === "link" && (
                  <div className="space-y-3">
                    <input
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className={inputClass}
                    />
                    {featuredImage && featuredImage.startsWith("http") && (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={featuredImage}
                          alt="Featured image preview"
                          className="w-full h-48 object-cover"
                          onError={() => toast.error("Failed to load image from URL")}
                        />
                        <button
                          type="button"
                          onClick={() => setFeaturedImage("")}
                          className="absolute top-2 right-2 inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium bg-rose-500/20 border border-rose-500/30 text-rose-200 hover:bg-rose-500/30 backdrop-blur-md transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <PenTool className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Content</h2>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post content here…"
              rows={15}
              required
              className={`${inputClass} resize-y font-mono text-[13.5px] leading-relaxed`}
            />
            <div className="flex items-center justify-between mt-3 text-xs text-white/35">
              <span>{content.length} characters</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />~{calculateReadingTime(content)} min read
              </span>
            </div>
          </div>

          {/* Topics */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Hash className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Topics</h2>
            </div>
            <p className="text-sm text-white/40 mb-4">
              Select topics that describe your post so readers can find it.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic: Doc<"topics">) => {
                const isChecked = selectedTopics.includes(topic._id);
                return (
                  <label
                    key={topic._id}
                    htmlFor={topic._id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                      isChecked
                        ? "bg-violet-500/10 border-violet-500/30 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Checkbox
                      id={topic._id}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleTopicChange(topic._id, checked as boolean)}
                      className="border-white/30 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                    />
                    <span className="text-sm">{topic.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Hash className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Tags</h2>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addTag}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 transition-colors"
                  >
                    #{tag}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Publishing */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-pink-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Publishing</h2>
            </div>
            <label className="block text-xs font-medium text-white/55 mb-1.5">Status</label>
            <Select value={status} onValueChange={(value: "draft" | "published") => setStatus(value)}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-xl h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border border-white/10 text-white">
                <SelectItem value="draft" className="focus:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Draft — save but don&apos;t publish
                  </div>
                </SelectItem>
                <SelectItem value="published" className="focus:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Published — make public
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || !slug.trim() || isAnalyzingContent}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-white/5"
            >
              {isAnalyzingContent ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Content…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {status === "published" ? "Publish Post" : "Save Draft"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={isAnalyzingContent}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Rejection Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Content Not Approved
            </DialogTitle>
            <DialogDescription>
              Your blog post could not be published due to the following issues:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {rejectionIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-sm">{issue}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Please review and revise your content:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Ensure your title is at least 3 characters and meaningful</li>
              <li>• Provide substantial content (at least 10 characters)</li>
              <li>• Use professional language and avoid inappropriate words</li>
              <li>• Make sure tags are relevant to your content</li>
              <li>• Use appropriate, professional images only</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Content moderation is performed by AI and may occasionally make errors.
              If you believe your content was incorrectly flagged, please contact our support team for review.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRejectionModalOpen(false)}
              className="flex-1 inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors"
            >
              I&apos;ll Fix It
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
