import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Create a new blog post
export const createPost = mutation({
  args: {
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      body: args.body,
      authorId: userProfile._id,
      createdAt: Date.now(),
    });

    return postId;
  },
});

// Get all blog posts
export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").collect();

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author,
        };
      })
    );

    return postsWithAuthors;
  },
});

// Get a single post by ID
export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      return null;
    }

    const author = await ctx.db.get(post.authorId);
    
    return {
      ...post,
      author,
    };
  },
});

// Delete a post (author only)
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

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

    if (post.authorId !== userProfile._id) {
      throw new ConvexError("Only the author can delete this post");
    }

    await ctx.db.delete(args.postId);
    return args.postId;
  },
});
