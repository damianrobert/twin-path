import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { authComponent } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Content moderation helper function (inline)
async function performContentModeration(title: string, content: string, featuredImage?: string, tags?: string[]) {
  console.log("🔍 Starting content moderation for:", { title: title.substring(0, 50), contentLength: content.length, hasImage: !!featuredImage, tags: tags || [] });
  
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.log("⚠️ No Gemini API key found, skipping moderation");
    // If no API key, skip moderation (fail safe)
    return { isApproved: true, moderatedTitle: title, moderatedContent: content, moderatedTags: tags, imageApproved: true };
  }

  try {
    // Skip image analysis for now - just do basic text moderation
    console.log("⚠️ Image analysis temporarily disabled");

    const prompt = `
You are a content moderator for a professional mentorship platform. Please analyze the following blog content for:

1. Profanity and curse words
2. Offensive or hateful language
3. Inappropriate content
4. Spam or promotional content
5. Personal information sharing
6. Some curse words may be typed in reverse (e.g., "suck" -> "kcus")
7. Low-quality content: single characters, gibberish, random text, meaningless content
8. Title and content must be substantial and meaningful

Title: "${title}"
Content: "${content}"
Tags: ${tags ? JSON.stringify(tags) : "[]"}

Respond in JSON format with:
{
  "isApproved": true/false,
  "titleIssues": ["list of title issues"],
  "contentIssues": ["list of content issues"],
  "tagIssues": ["list of tag issues"],
  "moderatedTitle": "title with inappropriate words replaced with ***",
  "moderatedContent": "content with inappropriate words replaced with ***",
  "moderatedTags": ["tags with inappropriate words replaced with ***"]
}

Be strict but reasonable. Educational content about difficult topics is allowed if it's professional.
Tags should be professional and relevant to the content.

REJECT content that:
- Has title less than 3 characters or is just random letters/numbers. If rejected for this, add "Title is too short or meaningless" to titleIssues.
- Has content less than 10 characters or is meaningless gibberish. If rejected for this, add "Content is too short or meaningless" to contentIssues.
- Contains only special characters, emojis, or random symbols. If rejected for this, add "Content contains only special characters/symbols" to contentIssues.
- Is clearly spam or automated text generation. If rejected for this, add "Content is spam or automated" to contentIssues.
- Has no meaningful value for readers. If rejected for this, add "Content has no meaningful value" to contentIssues.

APPROVE content that:
- Has meaningful, substantial titles and content
- Provides value to the mentorship community
- Is written in a professional or educational tone
- Contains real thoughts, experiences, or knowledge
`;

    console.log("📡 Calling Gemini API...");
    console.log("🔑 API Key available:", !!GEMINI_API_KEY);
    console.log("🔑 API Key length:", GEMINI_API_KEY?.length || 0);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log("📡 Gemini API response status:", response.status);
    console.log("📡 Gemini API response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("📡 Gemini API error response:", errorText);
      throw new Error(`Moderation API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    console.log("📝 Gemini API response:", text.substring(0, 200));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini API");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed moderation result:", result);
    
    const hasTitleIssues = result.titleIssues && result.titleIssues.length > 0;
    const hasContentIssues = result.contentIssues && result.contentIssues.length > 0;
    const hasTagIssues = result.tagIssues && result.tagIssues.length > 0;
    const isApproved = !hasTitleIssues && !hasContentIssues && !hasTagIssues;
    
    // Always approve images for now (validation disabled)
    const imageApproved = true;

    const finalResult = {
      isApproved: isApproved && imageApproved,
      moderatedTitle: hasTitleIssues ? result.moderatedTitle : title,
      moderatedContent: hasContentIssues ? result.moderatedContent : content,
      moderatedTags: hasTagIssues ? result.moderatedTags : tags,
      imageApproved
    };

    console.log("🏁 Final moderation result:", finalResult);
    return finalResult;

  } catch (error) {
    console.error("❌ Content moderation error:", error);
    // Fail safe: approve if moderation fails (temporarily relaxed for images)
    return { isApproved: true, moderatedTitle: title, moderatedContent: content, moderatedTags: tags, imageApproved: true };
  }
}

// Content moderation action
export const moderateContentAction = action({
  args: {
    title: v.string(),
    content: v.string(),
    featuredImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🔍 Starting content moderation for:", { title: args.title.substring(0, 50), contentLength: args.content.length, hasImage: !!args.featuredImage });
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log("⚠️ No Gemini API key found, skipping moderation");
      // If no API key, skip moderation (fail safe)
      return { isApproved: true, moderatedTitle: args.title, moderatedContent: args.content, imageApproved: true };
    }

    try {
      const prompt = `
You are a content moderator for a professional mentorship platform. Please analyze the following blog content for:

1. Profanity and curse words
2. Offensive or hateful language
3. Inappropriate content
4. Spam or promotional content
5. Personal information sharing

Title: "${args.title}"
Content: "${args.content}"

Respond in JSON format with:
{
  "isApproved": true/false,
  "titleIssues": ["list of title issues"],
  "contentIssues": ["list of content issues"],
  "moderatedTitle": "title with inappropriate words replaced with ***",
  "moderatedContent": "content with inappropriate words replaced with ***"
}

Be strict but reasonable. Educational content about difficult topics is allowed if it's professional.
`;

      console.log("📡 Calling Gemini API...");
      console.log("🔑 API Key available:", !!GEMINI_API_KEY);
      console.log("🔑 API Key length:", GEMINI_API_KEY?.length || 0);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      console.log("📡 Gemini API response status:", response.status);
      console.log("📡 Gemini API response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("📡 Gemini API error response:", errorText);
        throw new Error(`Moderation API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("No response from Gemini API");
      }

      console.log("📝 Gemini API response:", text.substring(0, 200));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from Gemini API");
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log("✅ Parsed moderation result:", result);
      
      const hasTitleIssues = result.titleIssues && result.titleIssues.length > 0;
      const hasContentIssues = result.contentIssues && result.contentIssues.length > 0;
      const isApproved = !hasTitleIssues && !hasContentIssues;
      
      // Basic image validation
      let imageApproved = true;
      if (args.featuredImage) {
        if (!args.featuredImage.startsWith('data:image/')) {
          imageApproved = false;
        } else {
          const base64Data = args.featuredImage.split(',')[1];
          const fileSize = Math.round(base64Data.length * 0.75) / 1024; // Rough estimate in KB
          
          if (fileSize > 5120) { // 5MB limit
            imageApproved = false;
          } else {
            const imageType = args.featuredImage.match(/data:image\/([^;]+)/);
            const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
            
            if (!imageType || !allowedTypes.includes(imageType[1].toLowerCase())) {
              imageApproved = false;
            }
          }
        }
      }

      const finalResult = {
        isApproved: isApproved && imageApproved,
        moderatedTitle: hasTitleIssues ? result.moderatedTitle : args.title,
        moderatedContent: hasContentIssues ? result.moderatedContent : args.content,
        imageApproved
      };

      console.log("🏁 Final moderation result:", finalResult);
      return finalResult;

    } catch (error) {
      console.error("❌ Content moderation error:", error);
      // Fail safe: approve if moderation fails
      return { isApproved: true, moderatedTitle: args.title, moderatedContent: args.content, imageApproved: true };
    }
  },
});

// Create a new blog post (mentors only) - as action to allow fetch()
export const createPost = action({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, args): Promise<{ success: true; postId: Id<"posts"> } | { success: false; error: string; issues: string[] }> => {
    console.log("🚀 createPost called with:", { title: args.title, status: args.status, contentLength: args.content.length });
    
    // First run the content moderation
    console.log("👤 Starting content moderation...");
    const moderation = await performContentModeration(args.title, args.content, args.featuredImage, args.tags);
    
    console.log("🔍 Moderation result:", moderation);
    
    if (!moderation.isApproved) {
      const issues = [];
      if (moderation.moderatedTitle !== args.title) issues.push("Title contains inappropriate content");
      if (moderation.moderatedContent !== args.content) issues.push("Content contains inappropriate language");
      if (moderation.moderatedTags && args.tags && JSON.stringify(moderation.moderatedTags) !== JSON.stringify(args.tags)) issues.push("Tags contain inappropriate content");
      
      console.log("❌ Content rejected:", issues);
      return { success: false, error: "Content not approved", issues };
    }

    console.log("✅ Content approved, proceeding with post creation...");

    // Now run the database operations as a mutation
    const result = await ctx.runMutation(api.posts.createPostInternal, {
      title: moderation.moderatedTitle || args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: moderation.moderatedContent || args.content,
      status: args.status,
      featuredImage: args.featuredImage,
      tags: moderation.moderatedTags || args.tags,
      topicIds: args.topicIds,
    });

    return result;
  },
});

// Internal mutation for database operations (no API calls)
export const createPostInternal = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user is a mentor or both (can write blogs)
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile || (userProfile.role !== "mentor" && userProfile.role !== "both")) {
      throw new ConvexError("Only mentors can create blog posts");
    }

    // Check if slug already exists
    const existingPost = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingPost) {
      throw new ConvexError("A post with this slug already exists");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      authorId: userProfile._id,
      status: args.status,
      featuredImage: args.featuredImage,
      readingTime: calculateReadingTime(args.content),
      tags: args.tags || [],
      viewCount: 0,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
    });

    // Handle topic associations
    if (args.topicIds && args.topicIds.length > 0) {
      for (const topicId of args.topicIds) {
        await ctx.db.insert("postTopics", {
          postId,
          topicId,
        });
      }
    }

    return { success: true, postId } as { success: true; postId: Id<"posts"> };
  },
});

// Update a blog post (author only)
export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    // Check if user is the author
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile || post.authorId !== userProfile._id) {
      throw new ConvexError("Only the author can update this post");
    }

    // Check if new slug already exists (if slug is being changed)
    if (args.slug && args.slug !== post.slug) {
      const existingPost = await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existingPost) {
        throw new ConvexError("A post with this slug already exists");
      }
    }

    const now = Date.now();
    const wasDraft = post.status === "draft";
    const isNowPublished = args.status === "published" || (!args.status && post.status === "published");

    // Content moderation for updated content
    let moderatedTitle = args.title;
    let moderatedContent = args.content;
    let moderatedImage = args.featuredImage;

    if (args.title !== undefined || args.content !== undefined || args.featuredImage !== undefined) {
      const moderation = await performContentModeration(
        args.title || post.title, 
        args.content || post.content, 
        args.featuredImage || post.featuredImage
      );
      
      if (!moderation.isApproved) {
        const issues = [];
        if (moderation.moderatedTitle !== (args.title || post.title)) issues.push("Title contains inappropriate content");
        if (moderation.moderatedContent !== (args.content || post.content)) issues.push("Content contains inappropriate language");
        
        throw new ConvexError(`Content not approved: ${issues.join(", ")}`);
      }

      moderatedTitle = moderation.moderatedTitle;
      moderatedContent = moderation.moderatedContent;
    }

    // Update the post
    const updateData: any = {
      updatedAt: now,
    };

    if (moderatedTitle !== undefined) updateData.title = moderatedTitle;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.excerpt !== undefined) updateData.excerpt = args.excerpt;
    if (moderatedContent !== undefined) {
      updateData.content = moderatedContent;
      updateData.readingTime = calculateReadingTime(moderatedContent);
    }
    if (args.status !== undefined) updateData.status = args.status;
    if (moderatedImage !== undefined) updateData.featuredImage = moderatedImage;
    if (args.tags !== undefined) updateData.tags = args.tags;

    // Set publishedAt if publishing for the first time
    if (wasDraft && isNowPublished) {
      updateData.publishedAt = now;
    }

    await ctx.db.patch(args.postId, updateData);

    // Update topic associations
    if (args.topicIds !== undefined) {
      // Remove existing topic associations
      const existingPostTopics = await ctx.db
        .query("postTopics")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();

      for (const postTopic of existingPostTopics) {
        await ctx.db.delete(postTopic._id);
      }

      // Add new topic associations
      if (args.topicIds.length > 0) {
        for (const topicId of args.topicIds) {
          await ctx.db.insert("postTopics", {
            postId: args.postId,
            topicId,
          });
        }
      }
    }

    return { success: true };
  },
});

// Delete a blog post (author or admin only)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    // Check if user is the author or admin
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    const isAuthor = post.authorId === userProfile._id;
    const isAdmin = userProfile.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      throw new ConvexError("Only the author or admin can delete this post");
    }

    // Delete topic associations
    const postTopics = await ctx.db
      .query("postTopics")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const postTopic of postTopics) {
      await ctx.db.delete(postTopic._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    return { success: true };
  },
});

// Get all published blog posts (for public view)
export const getPublishedPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    topicId: v.optional(v.id("topics")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    let posts;
    if (args.topicId) {
      // Get posts by topic
      const postTopics = await ctx.db
        .query("postTopics")
        .withIndex("by_topic", (q) => q.eq("topicId", args.topicId!))
        .collect();

      const postIds = postTopics.map(pt => pt.postId);
      
      // Get posts by fetching each one individually
      const postsPromises = postIds.map(postId => ctx.db.get(postId));
      const postsResults = await Promise.all(postsPromises);
      
      // Filter to only include published posts and sort by creation date
      posts = postsResults
        .filter((post): post is NonNullable<typeof post> => post !== null)
        .filter((post) => post.status === "published")
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } else {
      // Get all published posts
      posts = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("status", "published"))
        .order("desc")
        .take(limit);
    }

    // Get author and topic information
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const postTopics = await ctx.db
          .query("postTopics")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const topics = await Promise.all(
          postTopics.map(async (pt) => {
            const topic = await ctx.db.get(pt.topicId);
            return topic;
          })
        );

        return {
          ...post,
          author,
          topics: topics.filter(Boolean),
        };
      })
    );

    return postsWithDetails;
  },
});

// Increment post view count
export const incrementViewCount = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    await ctx.db.patch(args.postId, {
      viewCount: (post.viewCount || 0) + 1,
    });

    return { success: true };
  },
});

// Get blog post by slug
export const getPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post || post.status !== "published") {
      return null;
    }

    // Get author and topic information
    const author = await ctx.db.get(post.authorId);
    const postTopics = await ctx.db
      .query("postTopics")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();

    const topics = await Promise.all(
      postTopics.map(async (pt) => {
        const topic = await ctx.db.get(pt.topicId);
        return topic;
      })
    );

    return {
      ...post,
      author,
      topics: topics.filter(Boolean),
    };
  },
});

// Get posts by author (mentor's own posts)
export const getPostsByAuthor = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }

    let posts: Doc<"posts">[];
    
    // First get all posts by this author
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userProfile._id))
      .collect();
    
    // Then filter based on status
    if (args.status === "draft") {
      posts = allPosts.filter(p => p.status === "draft");
    } else if (args.status === "published") {
      posts = allPosts.filter(p => p.status === "published");
    } else {
      posts = allPosts;
    }

    // Get topic information
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const postTopics = await ctx.db
          .query("postTopics")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const topics = await Promise.all(
          postTopics.map(async (pt) => {
            const topic = await ctx.db.get(pt.topicId);
            return topic;
          })
        );

        return {
          ...post,
          topics: topics.filter(Boolean),
        };
      })
    );

    return postsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Test content moderation
export const testContentModeration = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🧪 Testing content moderation with:", args.content);
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log("🔑 API Key available:", !!GEMINI_API_KEY);
    console.log("🔑 API Key length:", GEMINI_API_KEY?.length || 0);
    
    const moderation = await performContentModeration("Test Title", args.content);
    console.log("🧪 Test moderation result:", moderation);
    
    return moderation;
  },
});

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Like a blog post
export const likePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("You must be logged in to like posts");
    }

    // Get user profile from email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    // Check if user is the author (can't like own posts)
    if (post.authorId === userProfile._id) {
      throw new ConvexError("You cannot like your own posts");
    }

    // Check if user already liked this post
    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_user_post", (q) => 
        q.eq("userId", userProfile._id).eq("postId", args.postId)
      )
      .first();

    if (existingLike) {
      throw new ConvexError("You have already liked this post");
    }

    // Create like record
    await ctx.db.insert("postLikes", {
      userId: userProfile._id,
      postId: args.postId,
    });

    // Increment post like count
    await ctx.db.patch(args.postId, {
      likeCount: (post.likeCount || 0) + 1,
    });

    return { success: true, liked: true, likeCount: (post.likeCount || 0) + 1 };
  },
});

// Unlike a blog post
export const unlikePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("You must be logged in to unlike posts");
    }

    // Get user profile from email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    // Find existing like
    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_user_post", (q) => 
        q.eq("userId", userProfile._id).eq("postId", args.postId)
      )
      .first();

    if (!existingLike) {
      throw new ConvexError("You haven't liked this post yet");
    }

    // Remove like record
    await ctx.db.delete(existingLike._id);

    // Decrement post like count
    await ctx.db.patch(args.postId, {
      likeCount: Math.max((post.likeCount || 0) - 1, 0),
    });

    return { success: true, liked: false, likeCount: Math.max((post.likeCount || 0) - 1, 0) };
  },
});

// Check if current user has liked a post
export const hasUserLikedPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return false;
    }

    // Get user profile from email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return false;
    }

    const like = await ctx.db
      .query("postLikes")
      .withIndex("by_user_post", (q) => 
        q.eq("userId", userProfile._id).eq("postId", args.postId)
      )
      .first();

    return !!like;
  },
});

// Get all posts (for analytics)
export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    return posts;
  },
});
