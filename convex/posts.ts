import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { authComponent } from "./auth";
import { Doc } from "./_generated/dataModel";

// Create a new blog post (mentors only)
export const createPost = mutation({
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

    // Associate topics with the post
    if (args.topicIds && args.topicIds.length > 0) {
      for (const topicId of args.topicIds) {
        await ctx.db.insert("postTopics", {
          postId,
          topicId,
        });
      }
    }

    return { success: true, postId };
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

    // Update the post
    const updateData: any = {
      updatedAt: now,
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.excerpt !== undefined) updateData.excerpt = args.excerpt;
    if (args.content !== undefined) {
      updateData.content = args.content;
      updateData.readingTime = calculateReadingTime(args.content);
    }
    if (args.status !== undefined) updateData.status = args.status;
    if (args.featuredImage !== undefined) updateData.featuredImage = args.featuredImage;
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

// Delete a blog post (author only)
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

    // Check if user is the author
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile || post.authorId !== userProfile._id) {
      throw new ConvexError("Only the author can delete this post");
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
