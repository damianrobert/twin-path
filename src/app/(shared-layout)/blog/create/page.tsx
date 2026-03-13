"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PenTool, Save, Eye, Clock, Hash, FileText, Image, AlertCircle, Upload, Link as LinkIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<"upload" | "link">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Id<"topics">[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionIssues, setRejectionIssues] = useState<string[]>([]);

  // Get current user profile to check role
  const userProfile = useQuery(api.users.getCurrentProfile);

  // Check if user is mentor or both
  const canWriteBlog = userProfile?.role === "mentor" || userProfile?.role === "both";

  // Get all topics for selection
  const topics = useQuery(api.topics.getAllTopics) || [];

  // Actions and Mutations
  const createPost = useAction(api.posts.createPost);

  // Redirect non-mentors
  useEffect(() => {
    if (userProfile && !canWriteBlog) {
      toast.error("Only mentors can write blog posts");
      router.push("/blog");
    }
  }, [userProfile, canWriteBlog, router]);

  // Show loading or unauthorized state
  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canWriteBlog) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only mentors can write blog posts. You need to be a mentor to access this page.
          </p>
          <Button onClick={() => router.push("/blog")}>
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  // Generate slug from title
  const generateSlug = async (title: string) => {
    if (!title.trim()) return;
    
    setIsGeneratingSlug(true);
    try {
      // Simple slug generation - convert to lowercase, replace spaces with hyphens, remove special chars
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      setSlug(slug);
    } catch (error) {
      console.error("Error generating slug:", error);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  // Auto-generate slug when title changes
  useEffect(() => {
    if (title && !slug) {
      const timeoutId = setTimeout(() => {
        generateSlug(title);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [title]);

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle topic selection
  const handleTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topicId as Id<"topics">]);
    } else {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId));
    }
  };

  // Calculate reading time
  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Handle featured image upload
  const handleImageUpload = async (file: File) => {
    // Only allow one image - replace existing if any
    setIsUploadingImage(true);
    try {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed");
        setIsUploadingImage(false);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        setIsUploadingImage(false);
        return;
      }

      // For now, we'll use a simple approach - convert to base64 or use a placeholder
      // In a real app, you'd upload to a service like Cloudinary, AWS S3, or Convex storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Replace any existing image - only one featured image allowed
        setFeaturedImage(result);
        setFeaturedImageFile(file);
        setIsUploadingImage(false);
        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setIsUploadingImage(false);
    }
  };

  // Handle form submission
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
      toast.loading("Please wait while AI checks your content...", { id: "content-analysis" });
      
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
        
        // Redirect to blog page after successful submission
        if (status === "published") {
          router.push("/blog");
        } else {
          // For drafts, you could redirect to dashboard or stay on page
          router.push("/dashboard/blog");
        }
      } else {
        // Handle content moderation rejection
        console.log("🔍 Full result object:", result);
        if (result.error === "Content not approved") {
          console.log("🔍 Moderation issues:", result.issues);
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
      
      // Handle other unexpected errors
      if (error instanceof Error && error.message.includes("slug already exists")) {
        toast.error("This URL slug is already taken. Please choose a different one.");
      } else if (error instanceof Error && error.message.includes("Only mentors can create blog posts")) {
        toast.error("Only mentors can create blog posts");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create blog post");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <PenTool className="h-8 w-8" />
          Create Blog Post
        </h1>
        <p className="text-muted-foreground">
          Share your knowledge and expertise with the TwinPath community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your blog post title"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateSlug(title)}
                  disabled={isGeneratingSlug || !title.trim()}
                >
                  {isGeneratingSlug ? "Generating..." : "Generate"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This will be used in the URL: /blog/{slug || "your-slug"}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of your blog post (optional)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {excerpt.length}/200 characters recommended
              </p>
            </div>

            {/* Featured Image */}
            <div>
              <Label>Featured Image</Label>
              
              {/* Upload Method Selection */}
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={imageUploadMethod === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageUploadMethod("upload")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageUploadMethod === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageUploadMethod("link")}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link
                </Button>
              </div>

              {/* Upload Method */}
              {imageUploadMethod === "upload" && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; // Only take the first file
                        if (file) {
                          // Replace existing image - only one featured image allowed
                          if (featuredImage) {
                            toast.info("Replacing existing featured image");
                          }
                          handleImageUpload(file);
                        }
                        // Reset file input to prevent multiple selections
                        e.target.value = '';
                      }}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {featuredImage ? "Click to replace featured image" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB • Only one image allowed
                      </p>
                      {featuredImage && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Image selected (click to replace)
                        </p>
                      )}
                    </label>
                  </div>
                  
                  {/* Image Preview */}
                  {featuredImage && (
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="secondary" className="text-xs">
                          Featured Image
                        </Badge>
                      </div>
                      <img
                        src={featuredImage}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setFeaturedImage("");
                          setFeaturedImageFile(null);
                          toast.info("Featured image removed");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Link Method */}
              {imageUploadMethod === "link" && (
                <div className="space-y-3">
                  <Input
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  {/* Link Preview */}
                  {featuredImage && featuredImage.startsWith("http") && (
                    <div className="relative">
                      <img
                        src={featuredImage}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={() => {
                          toast.error("Failed to load image from URL");
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFeaturedImage("")}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post content here..."
              rows={15}
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {content.length} characters • ~{calculateReadingTime(content)} min read
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select topics that best describe your blog post for better discoverability
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic: Doc<"topics">) => (
                <div key={topic._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={topic._id}
                    checked={selectedTopics.includes(topic._id)}
                    onCheckedChange={(checked) => 
                      handleTopicChange(topic._id, checked as boolean)
                    }
                  />
                  <Label htmlFor={topic._id} className="text-sm">
                    {topic.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Publishing Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: "draft" | "published") => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Draft - Save but don't publish
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Published - Make public
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={!title.trim() || !content.trim() || !slug.trim() || isAnalyzingContent}
          >
            {isAnalyzingContent ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Analyzing Content...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {status === "published" ? "Publish Post" : "Save Draft"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isAnalyzingContent}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Content Rejection Modal */}
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
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => setRejectionModalOpen(false)}
              className="flex-1"
            >
              I'll Fix It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
