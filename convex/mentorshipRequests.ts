import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Send a mentorship request
export const sendMentorshipRequest = mutation({
  args: {
    mentorId: v.id("users"),
    topicId: v.id("topics"),
    message: v.string(),
    learningGoal: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get mentee profile
    const menteeProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!menteeProfile) {
      throw new ConvexError("User profile not found");
    }

    // Check if mentor exists
    const mentorProfile = await ctx.db.get(args.mentorId);
    if (!mentorProfile) {
      throw new ConvexError("Mentor not found");
    }

    // Check if topic exists
    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new ConvexError("Topic not found");
    }

    // Check if user is not trying to request themselves
    if (menteeProfile._id === args.mentorId) {
      throw new ConvexError("Cannot send request to yourself");
    }

    // Check if there's already a pending request for this mentor-mentee-topic combination
    const existingRequest = await ctx.db
      .query("mentorshipRequests")
      .filter((q) =>
        q.and(
          q.eq(q.field("menteeId"), menteeProfile._id),
          q.eq(q.field("mentorId"), args.mentorId),
          q.eq(q.field("topicId"), args.topicId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingRequest) {
      throw new ConvexError("You already have a pending request for this mentor and topic");
    }

    // Check if there's already an active mentorship for this mentor-mentee-topic combination
    const existingMentorship = await ctx.db
      .query("mentorships")
      .filter((q) =>
        q.and(
          q.eq(q.field("menteeId"), menteeProfile._id),
          q.eq(q.field("mentorId"), args.mentorId),
          q.eq(q.field("topicId"), args.topicId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (existingMentorship) {
      throw new ConvexError("You already have an active mentorship with this mentor for this topic");
    }

    // Create the mentorship request
    const requestId = await ctx.db.insert("mentorshipRequests", {
      menteeId: menteeProfile._id,
      mentorId: args.mentorId,
      topicId: args.topicId,
      message: args.message,
      learningGoal: args.learningGoal,
      status: "pending",
      createdAt: Date.now(),
    });

    return requestId;
  },
});

// Get mentorship requests for the current user (as mentor or mentee)
export const getMentorshipRequests = query({
  args: {},
  handler: async (ctx) => {
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

    // Get requests where user is either mentor or mentee, ordered by newest first
    const requests = await ctx.db
      .query("mentorshipRequests")
      .filter((q) =>
        q.or(
          q.eq(q.field("mentorId"), userProfile._id),
          q.eq(q.field("menteeId"), userProfile._id)
        )
      )
      .order("desc")
      .collect();

    // Fetch related data for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const mentee = await ctx.db.get(request.menteeId);
        const mentor = await ctx.db.get(request.mentorId);
        const topic = await ctx.db.get(request.topicId);

        // For accepted requests, also get the mentorship
        let mentorship = null;
        if (request.status === "accepted") {
          mentorship = await ctx.db
            .query("mentorships")
            .filter((q) => q.eq(q.field("requestId"), request._id))
            .first();
        }

        return {
          ...request,
          mentee,
          mentor,
          topic,
          mentorship,
        };
      })
    );

    return requestsWithDetails;
  },
});

// Accept a mentorship request
export const acceptMentorshipRequest = mutation({
  args: {
    requestId: v.id("mentorshipRequests"),
  },
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

    // Get the request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError("Request not found");
    }

    // Check if user is the mentor
    if (request.mentorId !== userProfile._id) {
      throw new ConvexError("Only the mentor can accept this request");
    }

    // Check if request is pending
    if (request.status !== "pending") {
      throw new ConvexError("Request is no longer pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
    });

    // Create active mentorship
    const mentorshipId = await ctx.db.insert("mentorships", {
      requestId: args.requestId,
      menteeId: request.menteeId,
      mentorId: request.mentorId,
      topicId: request.topicId,
      status: "active",
      createdAt: Date.now(),
    });

    return mentorshipId;
  },
});

// Reject a mentorship request
export const rejectMentorshipRequest = mutation({
  args: {
    requestId: v.id("mentorshipRequests"),
  },
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

    // Get the request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError("Request not found");
    }

    // Check if user is the mentor
    if (request.mentorId !== userProfile._id) {
      throw new ConvexError("Only the mentor can reject this request");
    }

    // Check if request is pending
    if (request.status !== "pending") {
      throw new ConvexError("Request is no longer pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "rejected",
    });

    return args.requestId;
  },
});

// Get unread request count for notification badge
export const getUnreadRequestCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return 0;
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return 0;
    }

    // Count pending requests where user is the mentor
    const pendingRequests = await ctx.db
      .query("mentorshipRequests")
      .filter((q) =>
        q.and(
          q.eq(q.field("mentorId"), userProfile._id),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    return pendingRequests.length;
  },
});
