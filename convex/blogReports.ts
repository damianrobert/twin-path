import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new blog report
export const createBlogReport = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("copyright"),
      v.literal("misinformation"),
      v.literal("offensive_language"),
      v.literal("other")
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be logged in to report a blog post");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the post exists
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Blog post not found");
    }

    // Check if user already reported this post
    const existingReport = await ctx.db
      .query("blogReports")
      .withIndex("by_post_status", (q) => 
        q.eq("postId", args.postId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    if (existingReport) {
      throw new Error("You have already reported this blog post");
    }

    // Don't allow users to report their own posts
    if (post.authorId === user._id) {
      throw new Error("You cannot report your own blog post");
    }

    const now = Date.now();
    const reportId = await ctx.db.insert("blogReports", {
      postId: args.postId,
      reporterId: user._id,
      reason: args.reason,
      message: args.message,
      status: "pending",
      createdAt: now,
    });

    return reportId;
  },
});

// Get all reports for a specific post (for admins)
export const getReportsByPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("blogReports")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Enrich with user and post information
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const post = await ctx.db.get(report.postId);
        const reviewer = report.reviewedBy ? await ctx.db.get(report.reviewedBy) : null;

        return {
          ...report,
          reporter: reporter ? {
            name: reporter.name,
            email: reporter.email,
          } : null,
          post: post ? {
            title: post.title,
            slug: post.slug,
          } : null,
          reviewer: reviewer ? {
            name: reviewer.name,
          } : null,
        };
      })
    );

    return enrichedReports;
  },
});

// Get all pending reports (for admins)
export const getPendingReports = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and check if they are admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const reports = await ctx.db
      .query("blogReports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with user and post information
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const post = await ctx.db.get(report.postId);
        const author = post ? await ctx.db.get(post.authorId) : null;

        return {
          ...report,
          reporter: reporter ? {
            name: reporter.name,
            email: reporter.email,
          } : null,
          post: post ? {
            title: post.title,
            slug: post.slug,
            author: author ? {
              name: author.name,
              email: author.email,
            } : null,
          } : null,
        };
      })
    );

    return enrichedReports;
  },
});

// Update report status (for admins)
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("blogReports"),
    status: v.union(v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get current user and check if they are admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedBy: user._id,
      reviewNotes: args.reviewNotes,
      reviewedAt: now,
    });

    return { success: true };
  },
});

// Check if current user has reported a specific post
export const hasUserReportedPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return false;
    }

    const existingReport = await ctx.db
      .query("blogReports")
      .withIndex("by_post_status", (q) => 
        q.eq("postId", args.postId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    return !!existingReport;
  },
});

// Get reports by current user
export const getUserReports = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const reports = await ctx.db
      .query("blogReports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", user._id))
      .collect();

    // Enrich with post information
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const post = await ctx.db.get(report.postId);
        return {
          ...report,
          post: post ? {
            title: post.title,
            slug: post.slug,
          } : null,
        };
      })
    );

    return enrichedReports;
  },
});
